import * as React from 'react';
import { ModelKind } from '@patternfly/react-topology';
import { PipelineLayout } from './const';
import PipelineVisualizationSurface from './PipelineVisualizationSurface';
import { PipelineEdgeModel, PipelineMixedNodeModel } from './types';

import './PipelineTopologyGraph.scss';

type PipelineTopologyGraphProps = {
  id: string;
  fluid?: boolean;
  nodes: PipelineMixedNodeModel[];
  edges: PipelineEdgeModel[];
  layout: PipelineLayout;
};

const PipelineTopologyGraph: React.FC<PipelineTopologyGraphProps> = ({
  id,
  fluid,
  nodes,
  edges,
  layout,
  ...props
}) => {
  return (
    <div
      className="odc-pipeline-topology-graph"
      data-test={props['data-test'] || 'pipeline-topology-graph'}
      style={{ display: fluid ? 'block' : undefined }}
    >
      <PipelineVisualizationSurface
        model={{
          graph: {
            id,
            type: ModelKind.graph,
            layout,
          },
          nodes,
          edges,
        }}
      />
    </div>
  );
};

export default PipelineTopologyGraph;
