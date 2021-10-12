import * as React from 'react';
import { Kebab, KebabOption } from '@console/internal/components/utils';
import { useDeepCompareMemoize } from '../../hooks/use-deep-compare-memoize';
import { VirtualMachineInstanceModel, VirtualMachineModel } from '../../models';
import { VMStatusBundle } from '../../statuses/vm/types';
import { getVMConditionsStatus } from '../../statuses/vm/vm-status';
import { VMIKind, VMKind } from '../../types';
import { vmiMenuActions, vmMenuActions } from '../vms/menu-actions';
import { VmStatusResourcesValue } from './use-vm-status-resources';

type LazyVmRowKebabProps = {
  vm: VMKind;
  vmi: VMIKind;
  vmStatusResources: VmStatusResourcesValue;
  key: string;
  id: string;
};

export const LazyVmRowKebab: React.FC<LazyVmRowKebabProps> = ({
  key,
  id,
  vm,
  vmi,
  vmStatusResources,
}) => {
  const { pods, migrations, loaded, dvs, pvcs } = vmStatusResources;
  const vmStatusBundle = useDeepCompareMemoize(
    loaded
      ? getVMConditionsStatus({ vm, vmi, pods, migrations, dataVolumes: dvs, pvcs })
      : ({} as VMStatusBundle),
  );

  const options: KebabOption[] = React.useMemo(() => {
    if (vm) {
      return vmMenuActions.map((action) =>
        action(VirtualMachineModel, vm, {
          vmStatusBundle,
          vmi,
        }),
      );
    }
    if (vmi) {
      return vmiMenuActions.map((action) => action(VirtualMachineInstanceModel, vmi));
    }

    return [];
  }, [vm, vmStatusBundle, vmi]);

  return <Kebab options={options} key={key} id={id} isDisabled={!loaded} />;
};
