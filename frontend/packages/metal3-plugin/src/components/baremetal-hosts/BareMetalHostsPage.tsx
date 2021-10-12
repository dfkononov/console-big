import * as React from 'react';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { MultiListPage } from '@console/internal/components/factory';
import { FirehoseResource, FirehoseResult } from '@console/internal/components/utils';
import { MachineModel, MachineSetModel, NodeModel } from '@console/internal/models';
import {
  MachineKind,
  MachineSetKind,
  NodeKind,
  referenceForModel,
} from '@console/internal/module/k8s';
import { getName, createLookup, getNodeMachineName } from '@console/shared';
import { useMaintenanceCapability } from '../../hooks/useMaintenanceCapability';
import { BareMetalHostModel } from '../../models';
import { getHostMachine, getNodeMaintenanceNodeName } from '../../selectors';
import { getMachineMachineSetOwner } from '../../selectors/machine';
import { getHostStatus } from '../../status/host-status';
import { BareMetalHostKind } from '../../types';
import { BareMetalHostBundle } from '../types';
import BareMetalHostsTable from './BareMetalHostsTable';
import { hostStatusFilter } from './table-filters';

type Resources = {
  hosts: FirehoseResult<BareMetalHostKind[]>;
  machines: FirehoseResult<MachineKind[]>;
  machineSets: FirehoseResult<MachineSetKind[]>;
  nodes: FirehoseResult<NodeKind[]>;
  nodeMaintenances: FirehoseResult;
};

const flattenResources = (resources: Resources) => {
  // TODO(jtomasek): Remove loaded check once ListPageWrapper_ is updated to call flatten only
  // when resources are loaded
  const loaded = _.every(resources, (resource) =>
    resource.optional ? resource.loaded || !_.isEmpty(resource.loadError) : resource.loaded,
  );
  const {
    hosts: { data: hostsData },
    machines: { data: machinesData },
    machineSets,
    nodes,
    nodeMaintenances,
  } = resources;

  if (loaded) {
    const maintenancesByNodeName = createLookup(nodeMaintenances, getNodeMaintenanceNodeName);
    const nodesByMachineName = createLookup(nodes, getNodeMachineName);
    const machineSetByUID = createLookup(machineSets);

    return hostsData.map(
      (host): BareMetalHostBundle => {
        // TODO(jtomasek): replace this with createLookup once there is metal3.io/BareMetalHost annotation
        // on machines
        const machine = getHostMachine(host, machinesData);
        const node = nodesByMachineName[getName(machine)];
        const nodeMaintenance = maintenancesByNodeName[getName(node)];
        const machineOwner = getMachineMachineSetOwner(machine);
        const machineSet = machineOwner && machineSetByUID[machineOwner.uid];

        const status = getHostStatus({ host, machine, node, nodeMaintenance });
        // TODO(jtomasek): metadata.name is needed to make 'name' textFilter work.
        // Remove it when it is possible to pass custom textFilter as a function
        return {
          metadata: { name: getName(host) },
          host,
          machine,
          node,
          nodeMaintenance,
          machineSet,
          status,
        };
      },
    );
  }
  return [];
};

type BareMetalHostsPageProps = {
  namespace: string;
};

const getCreateProps = ({ namespace, t }: { namespace: string; t: TFunction }) => {
  const items: any = {
    dialog: t('metal3-plugin~New with Dialog'),
    yaml: t('metal3-plugin~New from YAML'),
  };

  return {
    items,
    createLink: (itemName) => {
      const base = `/k8s/ns/${namespace || 'default'}/${referenceForModel(BareMetalHostModel)}`;

      switch (itemName) {
        case 'dialog':
          return `${base}/~new/form`;
        case 'yaml':
        default:
          return `${base}/~new`;
      }
    },
  };
};

const BareMetalHostsPage: React.FC<BareMetalHostsPageProps> = (props) => {
  const { t } = useTranslation();
  const [hasNodeMaintenanceCapability, model] = useMaintenanceCapability();
  const { namespace } = props;
  const resources: FirehoseResource[] = [
    {
      kind: referenceForModel(BareMetalHostModel),
      namespaced: true,
      prop: 'hosts',
    },
    {
      kind: referenceForModel(MachineModel),
      namespaced: true,
      prop: 'machines',
    },
    {
      kind: referenceForModel(MachineSetModel),
      namespaced: true,
      isList: true,
      prop: 'machineSets',
    },
    {
      kind: NodeModel.kind,
      namespaced: false,
      prop: 'nodes',
    },
  ];

  if (hasNodeMaintenanceCapability) {
    resources.push({
      kind: referenceForModel(model),
      namespaced: false,
      isList: true,
      prop: 'nodeMaintenances',
      optional: true,
    });
  }

  return (
    <MultiListPage
      {...props}
      canCreate
      rowFilters={[hostStatusFilter(t)]}
      createProps={getCreateProps({ namespace, t })}
      createButtonText={t('metal3-plugin~Add Host')}
      namespace={namespace}
      resources={resources}
      flatten={flattenResources}
      ListComponent={BareMetalHostsTable}
      title={t('metal3-plugin~Bare Metal Hosts')}
    />
  );
};

export default BareMetalHostsPage;
