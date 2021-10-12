package chartproxy

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"sigs.k8s.io/yaml"
	"strings"

	"helm.sh/helm/v3/pkg/repo"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	corev1 "k8s.io/client-go/kubernetes/typed/core/v1"
	"k8s.io/klog"

	"github.com/openshift/library-go/pkg/crypto"
)

var (
	helmChartRepositoryGVK = schema.GroupVersionResource{
		Group:    "helm.openshift.io",
		Version:  "v1beta1",
		Resource: "helmchartrepositories",
	}
)

const (
	configNamespace = "openshift-config"
)

type helmRepo struct {
	Name       string
	URL        *url.URL
	Disabled   bool
	httpClient func() (*http.Client, error)
}

func httpClient(tlsConfig *tls.Config) (*http.Client, error) {
	tr := &http.Transport{
		TLSClientConfig: tlsConfig,
		Proxy:           http.ProxyFromEnvironment,
	}

	client := &http.Client{Transport: tr}
	return client, nil
}

func (hr helmRepo) OverwrittenRepoName() string {
	if hr.Name == "openshift-helm-charts" {
		return "redhat-helm-repo"
	}
	return ""
}

func (hr helmRepo) IndexFile() (*repo.IndexFile, error) {
	var indexFile repo.IndexFile
	httpClient, err := hr.httpClient()
	if err != nil {
		return nil, err
	}
	indexURL := hr.URL.String()
	if !strings.HasSuffix(indexURL, "/index.yaml") {
		indexURL += "/index.yaml"
	}
	resp, err := httpClient.Get(indexURL)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != 200 {
		return nil, errors.New(fmt.Sprintf("Response for %v returned %v with status code %v", indexURL, resp, resp.StatusCode))
	}
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	err = yaml.Unmarshal(body, &indexFile)
	if err != nil {
		return nil, err
	}
	for _, chartVersions := range indexFile.Entries {
		for _, chartVersion := range chartVersions {
			for i, url := range chartVersion.URLs {
				chartVersion.URLs[i], err = repo.ResolveReferenceURL(hr.URL.String(), url)
				if err != nil {
					klog.Errorf("Error resolving chart url for %v: %v", hr, err)
				}
			}
		}
	}

	return &indexFile, nil
}

type HelmRepoGetter interface {
	List() ([]*helmRepo, error)
}

type helmRepoGetter struct {
	Client     dynamic.Interface
	CoreClient corev1.CoreV1Interface
}

func (b helmRepoGetter) unmarshallConfig(repo unstructured.Unstructured) (*helmRepo, error) {
	h := &helmRepo{}

	disabled, _, err := unstructured.NestedBool(repo.Object, "spec", "disabled")
	if err != nil {
		return nil, err
	}
	h.Disabled = disabled

	urlValue, _, err := unstructured.NestedString(repo.Object, "spec", "connectionConfig", "url")
	if err != nil {
		return nil, err
	}

	h.URL, err = url.Parse(urlValue)
	if err != nil {
		return nil, err
	}

	h.Name, _, err = unstructured.NestedString(repo.Object, "metadata", "name")
	if err != nil {
		return nil, err
	}

	caReference, _, err := unstructured.NestedString(repo.Object, "spec", "connectionConfig", "ca", "name")
	if err != nil {
		return nil, err
	}

	tlsReference, _, err := unstructured.NestedString(repo.Object, "spec", "connectionConfig", "tlsClientConfig", "name")
	if err != nil {
		return nil, err
	}

	var rootCAs *x509.CertPool
	if caReference != "" {
		configMap, err := b.CoreClient.ConfigMaps(configNamespace).Get(context.TODO(), caReference, v1.GetOptions{})
		if err != nil {
			return nil, errors.New(fmt.Sprintf("Failed to GET configmap %s, reason %v", caReference, err))
		}
		caBundleKey := "ca-bundle.crt"
		caCert, found := configMap.Data[caBundleKey]
		if !found {
			return nil, errors.New(fmt.Sprintf("Failed to find %s key in configmap %s", caBundleKey, caReference))
		}
		if caCert != "" {
			rootCAs = x509.NewCertPool()
			if ok := rootCAs.AppendCertsFromPEM([]byte(caCert)); !ok {
				return nil, errors.New("Failed to append caCert")
			}
		}
	}
	if rootCAs == nil {
		rootCAs, err = x509.SystemCertPool()
		if err != nil {
			return nil, err
		}
	}
	tlsClientConfig := crypto.SecureTLSConfig(&tls.Config{
		RootCAs: rootCAs,
	})
	if tlsReference != "" {
		secret, err := b.CoreClient.Secrets(configNamespace).Get(context.TODO(), tlsReference, v1.GetOptions{})
		if err != nil {
			return nil, errors.New(fmt.Sprintf("Failed to GET secret %s reason %v", tlsReference, err))
		}
		tlsCertSecretKey := "tls.crt"
		tlsCert, ok := secret.Data[tlsCertSecretKey]
		if !ok {
			return nil, errors.New(fmt.Sprintf("Failed to find %s key in secret %s", tlsCertSecretKey, tlsReference))
		}
		tlsSecretKey := "tls.key"
		tlsKey, ok := secret.Data[tlsSecretKey]
		if !ok {
			return nil, errors.New(fmt.Sprintf("Failed to find %s key in secret %s", tlsSecretKey, tlsReference))
		}
		if tlsKey != nil && tlsCert != nil {
			cert, err := tls.X509KeyPair(tlsCert, tlsKey)
			if err != nil {
				return nil, err
			}
			tlsClientConfig.Certificates = []tls.Certificate{cert}
		}
	}
	h.httpClient = func() (*http.Client, error) {
		return httpClient(tlsClientConfig)
	}
	return h, nil
}

func (b *helmRepoGetter) List() ([]*helmRepo, error) {
	var helmRepos []*helmRepo
	repos, err := b.Client.Resource(helmChartRepositoryGVK).List(context.TODO(), v1.ListOptions{})
	if err != nil {
		klog.Errorf("Error listing helm chart repositories: %v \nempty repository list will be used", err)
		return helmRepos, nil
	}
	for _, item := range repos.Items {
		helmConfig, err := b.unmarshallConfig(item)
		if err != nil {
			klog.Errorf("Error unmarshalling repo %v: %v", item, err)
			continue
		}
		helmRepos = append(helmRepos, helmConfig)
	}
	return helmRepos, nil
}

func NewRepoGetter(client dynamic.Interface, corev1Client corev1.CoreV1Interface) HelmRepoGetter {
	return &helmRepoGetter{
		Client:     client,
		CoreClient: corev1Client,
	}
}
