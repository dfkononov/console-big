import { VmwareImportWizard } from '../../tests/models/vmwareImportWizard';
import { V2V_VM_IMPORT_TIMEOUT } from '../../tests/utils/constants/common';
import { VM_STATUS } from '../../tests/utils/constants/vm';
import { withResource } from '../../utils/shared-utils';
import { vmwareWindowsVMConfig } from './v2v.configs';

describe('Kubevirt import Windows 10 VM using wizard', () => {
  const leakedResources = new Set<string>();
  const wizard = new VmwareImportWizard();

  it(
    'Imports Windows 10 VM from VMware Instance',
    async () => {
      const vm = await wizard.import(vmwareWindowsVMConfig);
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.waitForStatus(VM_STATUS.Stopped, V2V_VM_IMPORT_TIMEOUT);
      });
    },
    V2V_VM_IMPORT_TIMEOUT,
  );
});
