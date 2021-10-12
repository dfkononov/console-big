import { testName } from '@console/internal-integration-tests/protractor.conf';
import { createResource, deleteResources } from '../utils/shared-utils';
import { filterCount } from '../views/vms.list.view';
import { getVMIManifest, getVMManifest } from './mocks/mocks';
import { VirtualMachineInstance } from './models/virtualMachineInstance';
import { ProvisionSource } from './utils/constants/enums/provisionSource';
import { VM_STATUS } from './utils/constants/vm';

const waitForVM = async (manifest: any, status: VM_STATUS) => {
  const vmi = new VirtualMachineInstance(manifest.metadata);
  createResource(manifest);
  await vmi.waitForStatus(status);
  return vmi;
};

describe('Test List View Filtering (VMI)', () => {
  const testVM = getVMManifest(ProvisionSource.CONTAINER, testName, `${testName}-vm-test`);
  const testVMI = getVMIManifest(ProvisionSource.CONTAINER, testName, `${testName}-vmi-test`);

  beforeAll(async () => {
    await waitForVM(testVM, VM_STATUS.Stopped);
    const vmi = await waitForVM(testVMI, VM_STATUS.Running);
    await vmi.navigateToListView();
  });

  afterAll(async () => {
    deleteResources([testVM, testVMI]);
  });

  it('ID(CNV-3701) Displays correct count of Off VMs', async () => {
    const vmImportingCount = await filterCount(VM_STATUS.Stopped);
    expect(vmImportingCount).toEqual(1);
  });

  it('ID(CNV-3700) Displays correct count of Running VMIs', async () => {
    const vmiImportingCount = await filterCount(VM_STATUS.Running);
    expect(vmiImportingCount).toEqual(1);
  });
});
