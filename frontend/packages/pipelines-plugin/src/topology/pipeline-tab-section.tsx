import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import TopologySideBarTabSection from '@console/topology/src/components/side-bar/TopologySideBarTabSection';
import PipelinesOverview from '../components/pipelines/pipeline-overview/PipelineOverview';

export const getPipelinesSideBarTabSection = (element: GraphElement) => {
  const data = element.getData();
  const resources = data?.resources;
  // This check is based on the properties added through getPipelinesDataModelReconciler
  if (!resources?.pipelines) return undefined;
  return (
    <TopologySideBarTabSection>
      <PipelinesOverview item={resources} />
    </TopologySideBarTabSection>
  );
};
