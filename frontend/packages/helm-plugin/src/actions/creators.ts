import { TFunction } from 'i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { coFetchJSON } from '@console/internal/co-fetch';
import { deleteResourceModal } from '@console/shared';
import { HelmActionsScope } from './types';

export const getHelmDeleteAction = (
  { release: { name: releaseName, namespace }, redirect }: HelmActionsScope,
  t: TFunction,
): Action => ({
  id: 'delete-helm',
  label: t('helm-plugin~Uninstall Helm Release'),
  cta: () => {
    deleteResourceModal({
      blocking: true,
      resourceName: releaseName,
      resourceType: 'Helm Release',
      actionLabel: t('helm-plugin~Uninstall'),
      redirect,
      onSubmit: () => {
        return coFetchJSON.delete(
          `/api/helm/release?name=${releaseName}&ns=${namespace}`,
          null,
          null,
          -1,
        );
      },
    });
  },
});

export const getHelmUpgradeAction = (
  { release: { name: releaseName, namespace }, actionOrigin }: HelmActionsScope,
  t: TFunction,
): Action => ({
  id: 'upgrade-helm',
  label: t('helm-plugin~Upgrade'),
  cta: {
    href: `/helm-releases/ns/${namespace}/${releaseName}/upgrade?actionOrigin=${actionOrigin}`,
  },
});

export const getHelmRollbackAction = (
  { release: { name: releaseName, namespace }, actionOrigin }: HelmActionsScope,
  t: TFunction,
): Action => ({
  id: 'rollback-helm',
  label: t('helm-plugin~Rollback'),
  cta: {
    href: `/helm-releases/ns/${namespace}/${releaseName}/rollback?actionOrigin=${actionOrigin}`,
  },
});
