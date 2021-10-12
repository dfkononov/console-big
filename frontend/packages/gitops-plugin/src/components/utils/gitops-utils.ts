import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { coFetchJSON } from '@console/internal/co-fetch';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { GitOpsManifestData, GitOpsAppGroupData } from './gitops-types';

export const getManifestURLs = (namespaces: K8sResourceKind[]): string[] => {
  const annotation = 'app.openshift.io/vcs-uri';
  return _.uniq(
    namespaces
      .filter((ns) => {
        return !!ns.metadata?.annotations?.[annotation];
      })
      .map((ns) => {
        return ns.metadata?.annotations?.[annotation];
      }),
  );
};

export const getApplicationsListBaseURI = () => {
  return `/api/gitops/applications`;
};

export const fetchAppGroups = async (
  baseURL: string,
  manifestURL: string,
): Promise<GitOpsAppGroupData[]> => {
  let data: GitOpsManifestData;
  try {
    const newListApi = getApplicationsListBaseURI();
    data = await coFetchJSON(`${newListApi}?url=${manifestURL}`);
  } catch (err) {
    try {
      data = await coFetchJSON(`${baseURL}&url=${manifestURL}`);
    } catch {} // eslint-disable-line no-empty
  }
  return data?.applications ?? [];
};

export const fetchAllAppGroups = async (baseURL: string, manifestURLs: string[], t: TFunction) => {
  let emptyMsg: string = null;
  let allAppGroups: GitOpsAppGroupData[] = null;
  if (baseURL) {
    if (_.isEmpty(manifestURLs)) {
      emptyMsg = t('gitops-plugin~No GitOps manifest URLs found');
    } else {
      try {
        allAppGroups = _.sortBy(
          _.flatten(
            await Promise.all(
              _.map(manifestURLs, (manifestURL) => fetchAppGroups(baseURL, manifestURL)),
            ),
          ),
          ['name'],
        );
      } catch {} // eslint-disable-line no-empty
      if (_.isEmpty(allAppGroups)) {
        emptyMsg = t('gitops-plugin~No Application groups found');
      }
    }
  }
  return [allAppGroups, emptyMsg];
};

export const getEnvData = async (v2EnvURI: string, envURI: string, env: string, appURI: string) => {
  let data;
  try {
    data = await coFetchJSON(`${v2EnvURI}/${env}${appURI}`);
  } catch {
    try {
      data = await coFetchJSON(`${envURI}/${env}${appURI}`);
    } catch {} // eslint-disable-line no-empty
  }
  return data;
};

export const getPipelinesBaseURI = (secretNS: string, secretName: string) => {
  return secretNS && secretName
    ? `/api/gitops/pipelines?secretNS=${secretNS}&secretName=${secretName}`
    : undefined;
};

export const getArgoCDFilteredAppsURI = (argocdBaseUri: string, appGroupName: string) => {
  return argocdBaseUri && appGroupName
    ? `${argocdBaseUri}/applications?labels=app.kubernetes.io%252Fname%253D${appGroupName}`
    : undefined;
};

export const getApplicationsBaseURI = (
  appName: string,
  secretNS: string,
  secretName: string,
  manifestURL: string,
) => {
  return secretNS && secretName
    ? `/application/${appName}?secretNS=${secretNS}&secretName=${secretName}&url=${manifestURL}&app=${appName}`
    : undefined;
};
