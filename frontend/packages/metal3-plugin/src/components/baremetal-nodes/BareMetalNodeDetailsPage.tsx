import * as React from 'react';
import * as _ from 'lodash';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import NodeTerminal from '@console/app/src/components/nodes/NodeTerminal';
import { ResourceEventStream } from '@console/internal/components/events';
import { DetailsPage } from '@console/internal/components/factory';
import { PodsPage } from '@console/internal/components/pod';
import { ResourceDetailsPageProps } from '@console/internal/components/resource-list';
import { navFactory, FirehoseResource } from '@console/internal/components/utils';
import { connectToPlural } from '@console/internal/kinds';
import { MachineModel, NodeModel, CertificateSigningRequestModel } from '@console/internal/models';
import { NodeKind, referenceForModel } from '@console/internal/module/k8s';
import { useMaintenanceCapability } from '../../hooks/useMaintenanceCapability';
import { BareMetalHostModel } from '../../models';
import BareMetalNodeDetails from './BareMetalNodeDetails';
import BareMetalNodeDashboard from './dashboard/BareMetalNodeDashboard';
import { menuActionsCreator } from './menu-actions';

const { editYaml, events, pods } = navFactory;

type BareMetalNodeDetailsPageProps = ResourceDetailsPageProps & {
  plural: string;
};

const BareMetalNodeDetailsPage = connectToPlural((props: BareMetalNodeDetailsPageProps) => {
  const { t } = useTranslation();
  const [hasNodeMaintenanceCapability, maintenanceModel] = useMaintenanceCapability();

  const pagesFor = React.useCallback(
    (node: NodeKind) => [
      {
        href: '',
        name: t('metal3-plugin~Overview'),
        component: BareMetalNodeDashboard,
      },
      {
        href: 'details',
        name: t('metal3-plugin~Details'),
        component: BareMetalNodeDetails,
      },
      editYaml(),
      pods(({ obj }) => (
        <PodsPage showTitle={false} fieldSelector={`spec.nodeName=${obj.metadata.name}`} />
      )),
      events(ResourceEventStream),
      ...(!_.some(
        node?.metadata?.labels,
        (v, k) =>
          (k === 'node.openshift.io/os_id' && v === 'Windows') ||
          (k === 'corev1.LabelOSStable' && v === 'windows'),
      )
        ? [{ href: 'terminal', name: t('metal3-plugin~Terminal'), component: NodeTerminal }]
        : []),
    ],
    [t],
  );

  const resources: FirehoseResource[] = [
    {
      kind: referenceForModel(MachineModel),
      namespaced: true,
      isList: true,
      prop: 'machines',
    },
    {
      kind: referenceForModel(BareMetalHostModel),
      namespaced: true,
      isList: true,
      prop: 'hosts',
    },
    {
      kind: CertificateSigningRequestModel.kind,
      namespaced: false,
      isList: true,
      prop: 'csrs',
    },
  ];

  if (hasNodeMaintenanceCapability) {
    resources.push({
      kind: referenceForModel(maintenanceModel),
      namespaced: false,
      isList: true,
      prop: 'nodeMaintenances',
      optional: true,
    });
  }

  const { modelRef, plural, kindObj, match } = props;
  const { name } = match.params;
  return (
    <>
      <Helmet>
        <title>{t('metal3-plugin~{{name}} · Details', { name })}</title>
      </Helmet>
      <DetailsPage
        {...props}
        name={name}
        menuActions={menuActionsCreator}
        pagesFor={pagesFor}
        resources={resources}
        kind={modelRef}
        customData={{ hasNodeMaintenanceCapability, maintenanceModel, t }}
        breadcrumbsFor={() => [
          {
            name: `${kindObj.labelPlural}`,
            path: `/k8s/cluster/${plural}`,
          },
          {
            name: t('metal3-plugin~{{name}} Details', { name: kindObj.label }),
            path: `${match.url}`,
          },
        ]}
      />
    </>
  );
});

export default (props) => <BareMetalNodeDetailsPage plural={NodeModel.plural} {...props} />;
