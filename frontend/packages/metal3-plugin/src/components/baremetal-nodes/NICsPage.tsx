import * as React from 'react';
import { PageComponentProps } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel, NodeKind } from '@console/internal/module/k8s';
import { getNodeMachineName, createBasicLookup } from '@console/shared';
import { BareMetalHostModel } from '../../models';
import { getHostMachineName } from '../../selectors';
import { BareMetalHostKind } from '../../types';
import BareMetalHostNICs from '../baremetal-hosts/BareMetalHostNICs';

const bareMetalHosts = {
  kind: referenceForModel(BareMetalHostModel),
  namespaced: true,
  isList: true,
};

const NICsPage: React.FC<PageComponentProps<NodeKind>> = ({ obj }) => {
  const [hosts, loaded, loadError] = useK8sWatchResource<BareMetalHostKind[]>(bareMetalHosts);
  let host: BareMetalHostKind;
  if (loaded) {
    const hostsByMachineName = createBasicLookup(hosts, getHostMachineName);
    host = hostsByMachineName[getNodeMachineName(obj)];
  }
  return <BareMetalHostNICs obj={host} loadError={loadError} />;
};

export default NICsPage;
