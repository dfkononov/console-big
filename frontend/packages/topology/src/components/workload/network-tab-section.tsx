import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import {
  isNetworkAdapter,
  useResolvedExtensions,
  NetworkAdapter,
  K8sResourceCommon,
} from '@console/dynamic-plugin-sdk';
import TopologySideBarTabSection from '../side-bar/TopologySideBarTabSection';
import { NetworkingOverview } from './NetworkingOverview';
import { getDataFromAdapter } from './utils';

const NetworkTabSection: React.FC<{ element: GraphElement }> = ({ element }) => {
  const [networkAdapterExtensions, extensionsLoaded] = useResolvedExtensions<NetworkAdapter>(
    isNetworkAdapter,
  );
  const networkAdapter = React.useMemo(
    () =>
      getDataFromAdapter<{ resource: K8sResourceCommon }, NetworkAdapter>(element, [
        networkAdapterExtensions,
        extensionsLoaded,
      ]),
    [element, extensionsLoaded, networkAdapterExtensions],
  );
  return networkAdapter ? (
    <TopologySideBarTabSection>
      <NetworkingOverview obj={networkAdapter.resource} />
    </TopologySideBarTabSection>
  ) : null;
};

export const getNetworkingSideBarTabSection = (element: GraphElement) => {
  return <NetworkTabSection element={element} />;
};
