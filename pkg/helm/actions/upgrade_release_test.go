package actions

import (
	"errors"
	"io/ioutil"
	"strings"
	"testing"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chartutil"
	kubefake "helm.sh/helm/v3/pkg/kube/fake"
	"helm.sh/helm/v3/pkg/release"
	"helm.sh/helm/v3/pkg/storage"
	"helm.sh/helm/v3/pkg/storage/driver"
	"helm.sh/helm/v3/pkg/time"
)

func TestUpgradeReleaseWithoutDependencies(t *testing.T) {
	tests := []struct {
		testName     string
		chartPath    string
		chartName    string
		chartVersion string
		err          error
	}{
		{
			testName:     "upgrade valid release should return successful response",
			chartPath:    "../testdata/influxdb-3.0.2.tgz",
			chartName:    "influxdb",
			chartVersion: "3.0.2",
			err:          nil,
		},
		{
			testName:     "upgrade invalid chart upgrade should fail",
			chartPath:    "../testdata/influxdb-3.0.1.tgz",
			chartName:    "influxdb",
			chartVersion: "3.0.2",
			err:          errors.New(`path "../testdata/influxdb-3.0.1.tgz" not found`),
		},
		{
			testName:     "upgrade release with no chart_url without dependencies should upgrade successfully",
			chartPath:    "",
			chartName:    "influxdb",
			chartVersion: "3.0.2",
			err:          nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.testName, func(t *testing.T) {
			store := storage.Init(driver.NewMemory())
			actionConfig := &action.Configuration{
				Releases:     store,
				KubeClient:   &kubefake.PrintingKubeClient{Out: ioutil.Discard},
				Capabilities: chartutil.DefaultCapabilities,
				Log:          func(format string, v ...interface{}) {},
			}

			r := release.Release{
				Name:      "test",
				Namespace: "test-namespace",
				Info: &release.Info{
					FirstDeployed: time.Time{},
					Status:        "deployed",
				},
				Version: 1,
				Chart: &chart.Chart{
					Metadata: &chart.Metadata{
						Name:        "influxdb",
						Version:     "3.0.2",
						Annotations: map[string]string{"chart_url": "../testdata/influxdb-3.0.2.tgz"},
					},
				},
			}

			store.Create(&r)

			rel, err := UpgradeRelease("test-namespace", "test", tt.chartPath, nil, actionConfig)
			if err == nil && tt.err != nil {
				t.Error(err)
			}
			if err != nil && err.Error() != tt.err.Error() {
				t.Error("Error occurred while installing chartPath")
			}
			if rel != nil {
				if rel.Name != r.Name {
					t.Error("Release testName isn't matching")
				}
				if rel.Namespace != r.Namespace {
					t.Error("Namespace testName isn't matching")
				}
				if rel.Info.Status != release.StatusDeployed {
					t.Error("Chart status should be deployed")
				}
				if rel.Chart.Metadata.Name != tt.chartName {
					t.Error("Chart name mismatch")
				}
				if rel.Chart.Metadata.Version != tt.chartVersion {
					t.Error("Chart version mismatch")
				}
				if rel.Version != 2 {
					t.Error("Upgrade should increase the version count")
				}
				if rel.Chart.Metadata.Annotations["chart_url"] != r.Chart.Metadata.Annotations["chart_url"] {
					t.Error("Chart URL isn't matching")
				}
			}
		})
	}
}

func TestUpgradeReleaseWithDependencies(t *testing.T) {
	tests := []struct {
		testName     string
		chartPath    string
		chartName    string
		chartVersion string
		err          error
		values       map[string]interface{}
	}{
		{
			testName:     "upgrade release with no chart_url with dependencies should upgrade successfully",
			chartPath:    "",
			chartName:    "wildfly",
			chartVersion: "1.0.0",
			err:          nil,
			values:       map[string]interface{}{"build": map[string]interface{}{"uri": "https://github.com/wildfly/quickstart.git"}},
		},
	}
	for _, tt := range tests {
		t.Run(tt.testName, func(t *testing.T) {
			store := storage.Init(driver.NewMemory())
			actionConfig := &action.Configuration{
				Releases:     store,
				KubeClient:   &kubefake.PrintingKubeClient{Out: ioutil.Discard},
				Capabilities: chartutil.DefaultCapabilities,
				Log:          func(format string, v ...interface{}) {},
			}

			r := release.Release{
				Name:      "test",
				Namespace: "test-namespace",
				Info: &release.Info{
					FirstDeployed: time.Time{},
					Status:        "deployed",
				},
				Version: 1,
				Chart: &chart.Chart{
					Metadata: &chart.Metadata{
						Name:        "wildfly",
						Version:     "1.0.0",
						Annotations: map[string]string{"chart_url": "../testdata/wildfly-1.0.0.tgz"},
					},
				},
			}

			store.Create(&r)

			rel, err := UpgradeRelease("test-namespace", "test", tt.chartPath, tt.values, actionConfig)
			if err == nil && tt.err != nil {
				t.Error(err)
			}
			if err != nil && err.Error() != tt.err.Error() {
				t.Error("Error occurred while installing chartPath")
			}
			if rel != nil {
				if rel.Name != r.Name {
					t.Error("Release testName isn't matching")
				}
				if rel.Namespace != r.Namespace {
					t.Error("Namespace testName isn't matching")
				}
				if rel.Info.Status != release.StatusDeployed {
					t.Error("Chart status should be deployed")
				}
				if rel.Chart.Metadata.Name != tt.chartName {
					t.Error("Chart name mismatch")
				}
				if rel.Chart.Metadata.Version != tt.chartVersion {
					t.Error("Chart version mismatch")
				}
				if rel.Version != 2 {
					t.Error("Upgrade should increase the version count")
				}
				if rel.Chart.Metadata.Annotations["chart_url"] != r.Chart.Metadata.Annotations["chart_url"] {
					t.Error("Chart URL isn't matching")
				}
				// check if git url is set through tt.values
				if !strings.Contains(rel.Manifest, `uri: https://github.com/wildfly/quickstart.git`) {
					t.Error("Custom value mismatch")
				}

				// assert if chart values are being set as expected
				assertValues(t, tt.values, rel.Config)
			}
		})
	}
}

func TestUpgradeNonExistRelease(t *testing.T) {
	tests := []struct {
		testName     string
		chartPath    string
		chartName    string
		chartVersion string
		err          error
	}{
		{
			testName:     "upgrade non exist release should return no release found",
			chartPath:    "",
			chartName:    "influxdb",
			chartVersion: "3.0.2",
			err:          ErrReleaseNotFound,
		},
	}
	for _, tt := range tests {
		t.Run(tt.testName, func(t *testing.T) {
			store := storage.Init(driver.NewMemory())
			actionConfig := &action.Configuration{
				Releases:     store,
				KubeClient:   &kubefake.PrintingKubeClient{Out: ioutil.Discard},
				Capabilities: chartutil.DefaultCapabilities,
				Log:          func(format string, v ...interface{}) {},
			}

			_, err := UpgradeRelease("test-namespace", "test", tt.chartPath, nil, actionConfig)
			if err == nil && tt.err != nil {
				t.Error(err)
			}
			if err != nil && err.Error() != tt.err.Error() {
				t.Error("Error occurred while installing chartPath")
			}
		})
	}
}

func TestUpgradeReleaseWithCustomValues(t *testing.T) {
	tests := []struct {
		testName     string
		chartPath    string
		chartName    string
		chartVersion string
		values       map[string]interface{}
		err          error
	}{
		{
			testName:     "upgrade valid release with custom values should return successful response",
			chartPath:    "../testdata/influxdb-3.0.2.tgz",
			chartName:    "influxdb",
			chartVersion: "3.0.2",
			values: map[string]interface{}{
				"service": map[string]interface{}{"type": "NodePort"},
			},
			err: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.testName, func(t *testing.T) {
			store := storage.Init(driver.NewMemory())
			actionConfig := &action.Configuration{
				Releases:     store,
				KubeClient:   &kubefake.PrintingKubeClient{Out: ioutil.Discard},
				Capabilities: chartutil.DefaultCapabilities,
				Log:          func(format string, v ...interface{}) {},
			}

			r := release.Release{
				Name:      "test",
				Namespace: "test-namespace",
				Info: &release.Info{
					FirstDeployed: time.Time{},
					Status:        "deployed",
				},
				Version: 1,
				Chart: &chart.Chart{
					Metadata: &chart.Metadata{
						Name:        "influxdb",
						Version:     "3.0.2",
						Annotations: map[string]string{"chart_url": "../testdata/influxdb-3.0.2.tgz"},
					},
				},
			}

			store.Create(&r)

			rel, err := UpgradeRelease("test-namespace", "test", tt.chartPath, tt.values, actionConfig)
			if err == nil && tt.err != nil {
				t.Error(err)
			}
			if err != nil && err.Error() != tt.err.Error() {
				t.Error("Error occurred while installing chartPath")
			}
			if rel != nil {
				if rel.Name != r.Name {
					t.Error("Release testName isn't matching")
				}
				if rel.Namespace != r.Namespace {
					t.Error("Namespace testName isn't matching")
				}
				if rel.Info.Status != release.StatusDeployed {
					t.Error("Chart status should be deployed")
				}
				if rel.Chart.Metadata.Name != tt.chartName {
					t.Error("Chart name mismatch")
				}
				if rel.Chart.Metadata.Version != tt.chartVersion {
					t.Error("Chart version mismatch")
				}
				if rel.Version != 2 {
					t.Error("Upgrade should increase the version count")
				}
				if rel.Chart.Metadata.Annotations["chart_url"] != r.Chart.Metadata.Annotations["chart_url"] {
					t.Error("Chart URL isn't matching")
				}

				// check if service type set to NodePort.
				if !strings.Contains(rel.Manifest, `type: NodePort`) {
					t.Error("custom value mismatch")
				}

				// assert if chart values are being set as expected
				assertValues(t, tt.values, rel.Config)
			}
		})
	}
}

func assertValues(t *testing.T, expected map[string]interface{}, received map[string]interface{}) {
	for k, v := range expected {
		if val, ok := received[k]; ok {
			switch val.(type) {
			case string:
				if strings.Compare(val.(string), v.(string)) != 0 {
					t.Errorf("Value mismatch expected is %s and received is %s", val.(string), v.(string))
				}
			case int:
				if val.(int) != v.(int) {
					t.Errorf("Value mismatch expected is %d and received is %d", val.(int), v.(int))
				}
			case map[string]interface{}:
				assertValues(t, v.(map[string]interface{}), val.(map[string]interface{}))
			}
		}
	}
}
