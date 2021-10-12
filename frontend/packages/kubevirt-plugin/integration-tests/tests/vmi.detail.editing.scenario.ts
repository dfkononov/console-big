import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { resourceRows } from '@console/internal-integration-tests/views/crud.view';
import { createResource, deleteResource } from '../utils/shared-utils';
import * as kubevirtDetailView from '../views/kubevirtUIResource.view';
import { vmDetailBootOrderEditButton } from '../views/virtualMachine.view';
import * as disksView from '../views/vm.disks.view';
import { getVMIManifest } from './mocks/mocks';
import { VirtualMachineInstance } from './models/virtualMachineInstance';
import { VM_CREATE_AND_EDIT_TIMEOUT_SECS } from './utils/constants/common';
import { ProvisionSource } from './utils/constants/enums/provisionSource';
import { TAB, VM_STATUS } from './utils/constants/vm';

const waitForVM = async (manifest: any, status: VM_STATUS) => {
  const vm = new VirtualMachineInstance(manifest.metadata);
  createResource(manifest);
  await vm.waitForStatus(status);
  return vm;
};

describe('KubeVirt VMI detail - editing', () => {
  const testVM = getVMIManifest(ProvisionSource.CONTAINER, testName);
  let vmi: VirtualMachineInstance;

  afterAll(() => {
    deleteResource(testVM);
  });

  beforeAll(async () => {
    vmi = await waitForVM(testVM, VM_STATUS.Running);
    await vmi.navigateToOverview();
  });

  it(
    'ID(CNV-4040) should not have boot order edit buttons',
    async () => {
      await vmi.navigateToDetail();
      expect(vmDetailBootOrderEditButton(vmi.namespace, vmi.name).isPresent()).toBe(false);
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-4042) should not have add nic button',
    async () => {
      await vmi.navigateToTab(TAB.NetworkInterfaces);
      expect(kubevirtDetailView.createNICButton.isPresent()).toBe(false);
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-4043) nic row kebab button is disabled',
    async () => {
      await vmi.navigateToTab(TAB.NetworkInterfaces);
      expect(
        resourceRows
          .first()
          .$('[data-test-id=kebab-button]')
          .isEnabled(),
      ).toBe(false);
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-4041) should not have add disk button',
    async () => {
      await vmi.navigateToTab(TAB.Disks);
      expect(kubevirtDetailView.createDiskButton.isPresent()).toBe(false);
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-3694) disk row kebab button is disabled',
    async () => {
      await vmi.navigateToTab(TAB.Disks);
      await browser.wait(until.presenceOf(disksView.diskRows));
      expect(
        resourceRows
          .first()
          .$('[data-test-id="kebab-button"]')
          .isEnabled(),
      ).toBe(false);
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );
});
