import * as _ from 'lodash';
import { browser } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { getBootableDevicesInOrder, getNonBootableDevices } from '../../src/selectors/vm/devices';
import { click, createResource, deleteResource } from '../utils/shared-utils';
import * as bootOrderView from '../views/dialogs/editBootOrderView';
import { saveButton } from '../views/kubevirtUIResource.view';
import { getVMManifest, hddDisk } from './mocks/mocks';
import { VirtualMachine } from './models/virtualMachine';
import { VM_CREATE_AND_EDIT_TIMEOUT_SECS } from './utils/constants/common';
import { ProvisionSource } from './utils/constants/enums/provisionSource';
import { dragAndDrop } from './utils/scripts/drag-drop';
import { getRandStr, getSelectOptions, selectOptionByText } from './utils/utils';

describe('KubeVirt VM detail - Boot Order Dialog', () => {
  const testVM = getVMManifest(ProvisionSource.URL, testName, `bootordervm-${getRandStr(5)}`);
  const vm = new VirtualMachine(testVM.metadata);

  beforeAll(async () => {
    createResource(testVM);
    await vm.addDisk(hddDisk);
    await vm.navigateToDetail();
  });

  afterAll(() => {
    deleteResource(testVM);
  });

  afterEach(async () => {
    await vm.closeModalDialog();
  });

  it(
    'ID(CNV-3550) Displays boot devices',
    async () => {
      const bootableDevices = getBootableDevicesInOrder(vm.getResource()).map(
        (device) => `${_.get(device, 'value.name')}`,
      );
      const displayedbootableDevices = (await vm.getBootDevices()).map(
        (device) => device.split(' ')[0],
      );
      expect(displayedbootableDevices).toEqual(bootableDevices);
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-3549) Deletes bootable device',
    async () => {
      await vm.modalEditBootOrder();
      const FIRST_DEVICE_POSITION = 1;
      const initialBootableDevices = getBootableDevicesInOrder(vm.getResource());
      await click(bootOrderView.deleteDeviceButton(FIRST_DEVICE_POSITION));
      await click(saveButton);
      // Wait for the boot Order to update
      await bootOrderView.waitForBootDevicesCount(
        vm.name,
        vm.namespace,
        initialBootableDevices.length - 1,
      );
      const orderedBootableDevices = getBootableDevicesInOrder(vm.getResource()).map(
        (device) => `${_.get(device, 'value.name')}`,
      );
      const displayedbootableDevices = (await vm.getBootDevices()).map(
        (device) => device.split(' ')[0],
      );
      expect(orderedBootableDevices).toEqual(displayedbootableDevices);
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-3548) Adds bootable device',
    async () => {
      await vm.modalEditBootOrder();
      const initialVMObject = vm.getResource();
      const initialBootableDevices = getBootableDevicesInOrder(initialVMObject);
      const nonBootableDevices = getNonBootableDevices(initialVMObject).map(
        (device) => `${_.get(device, 'value.name')}`,
      );

      await click(bootOrderView.addDeviceButton);
      const nonBootableDevicesSelectOptions = (
        await getSelectOptions(bootOrderView.addDeviceSelect)
      ).map((device) => device.split(' ')[0]);
      // Expect that only non-bootable devices are listed in the 'Add device' dropdown
      expect(nonBootableDevices.sort()).toEqual(nonBootableDevicesSelectOptions.sort());
      // Select the last item from the selector
      await selectOptionByText(
        bootOrderView.addDeviceSelect,
        nonBootableDevicesSelectOptions[nonBootableDevicesSelectOptions.length - 1],
      );
      await click(saveButton);
      // Wait for the boot Order to update
      await bootOrderView.waitForBootDevicesCount(
        vm.name,
        vm.namespace,
        initialBootableDevices.length + 1,
      );
      const orderedBootableDevices = getBootableDevicesInOrder(vm.getResource()).map(
        (device) => `${_.get(device, 'value.name')}`,
      );
      const displayedbootableDevices = (await vm.getBootDevices()).map(
        (device) => device.split(' ')[0],
      );
      expect(orderedBootableDevices).toEqual(displayedbootableDevices);
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-3547) Drags and drops to change boot order',
    async () => {
      await vm.modalEditBootOrder();
      const initialBootableDevices = getBootableDevicesInOrder(vm.getResource()).map(
        (device) => `${_.get(device, 'value.name')}`,
      );

      // Find devices at indexes 0 and 1 representing first and second device
      const source = bootOrderView.draggablePointer(1);
      const destination = bootOrderView.draggablePointer(2);

      await browser.executeScript(dragAndDrop, source, destination);
      // Wait for the DOM structure to update
      await browser.sleep(300);
      // Click and wait for the changes to be applied
      await click(saveButton);
      await isLoaded();
      // Renavigate to force the page to update
      await vm.navigateToDetail();
      // Get current boot order from overview page
      const displayedBootableDevices = (await vm.getBootDevices()).map(
        (device) => device.split(' ')[0],
      );
      expect(displayedBootableDevices).toEqual([...initialBootableDevices].reverse());
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );
});
