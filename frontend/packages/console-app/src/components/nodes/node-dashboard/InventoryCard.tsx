import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { PodModel, NodeModel } from '@console/internal/models';
import { referenceForModel, K8sResourceCommon, K8sKind } from '@console/internal/module/k8s';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import InventoryItem, {
  ResourceInventoryItem,
  StatusGroupMapper,
} from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { getPodStatusGroups } from '@console/shared/src/components/dashboard/inventory-card/utils';
import { NodeDashboardContext } from './NodeDashboardContext';

export const NodeInventoryItem: React.FC<NodeInventoryItemProps> = ({
  nodeName,
  model,
  mapper,
}) => {
  const resource = React.useMemo(
    () => ({
      kind: model.crd ? referenceForModel(model) : model.kind,
      fieldSelector: `spec.nodeName=${nodeName}`,
      isList: true,
    }),
    [nodeName, model],
  );
  const [data, loaded, loadError] = useK8sWatchResource<K8sResourceCommon[]>(resource);
  const basePath = `${resourcePathFromModel(NodeModel, nodeName)}/pods`;

  return (
    <ResourceInventoryItem
      kind={model}
      isLoading={!loaded}
      error={!!loadError}
      resources={data}
      mapper={mapper}
      basePath={basePath}
    />
  );
};

const InventoryCard: React.FC = () => {
  const { obj } = React.useContext(NodeDashboardContext);
  const { t } = useTranslation();

  return (
    <DashboardCard data-test-id="inventory-card">
      <DashboardCardHeader>
        <DashboardCardTitle>{t('console-app~Inventory')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <NodeInventoryItem
          nodeName={obj.metadata.name}
          model={PodModel}
          mapper={getPodStatusGroups}
        />
        <InventoryItem
          isLoading={!obj}
          title={t('console-app~Image')}
          titlePlural={t('console-app~Images')}
          count={obj.status?.images?.length}
          error={!obj.status?.images}
        />
      </DashboardCardBody>
    </DashboardCard>
  );
};

type NodeInventoryItemProps = {
  nodeName: string;
  model: K8sKind;
  mapper?: StatusGroupMapper;
};

export default InventoryCard;
