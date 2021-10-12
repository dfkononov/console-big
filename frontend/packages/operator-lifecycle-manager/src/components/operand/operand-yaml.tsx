import * as React from 'react';
import { match as RouterMatch } from 'react-router-dom';
import { CreateYAML } from '@console/internal/components/create-yaml';
import { K8sResourceKindReference } from '@console/internal/module/k8s';

/**
 * Component which wraps the YAML editor to ensure the templates are added from the `ClusterServiceVersion` annotations.
 */
export const OperandYAML: React.FC<OperandYAMLProps> = ({
  match,
  onChange,
  next,
  initialYAML = '',
}) => {
  return (
    <CreateYAML
      hideHeader
      match={match}
      onChange={onChange}
      template={initialYAML}
      {...(next && { resourceObjPath: () => next })}
    />
  );
};

export type OperandYAMLProps = {
  initialYAML?: string;
  onChange?: (yaml: string) => void;
  match: RouterMatch<{ csvName: string; ns: string; plural: K8sResourceKindReference }>;
  next?: string;
};
