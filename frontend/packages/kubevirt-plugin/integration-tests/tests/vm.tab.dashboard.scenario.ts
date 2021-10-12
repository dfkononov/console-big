import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { VirtualMachineModel } from '../../src/models';
import {
  click,
  createResources,
  deleteResources,
  waitForStringInElement,
} from '../utils/shared-utils';
import * as dashboardView from '../views/dashboard.view';
import { getVMManifest, hddDisk, multusNAD, multusNetworkInterface } from './mocks/mocks';
import { VirtualMachine } from './models/virtualMachine';
import {
  JASMINE_EXTENDED_TIMEOUT_INTERVAL,
  NOT_AVAILABLE,
  VM_BOOTUP_TIMEOUT_SECS,
} from './utils/constants/common';
import { ProvisionSource } from './utils/constants/enums/provisionSource';
import { VM_STATUS } from './utils/constants/vm';

describe('Kubevirt VM dashboard tab', () => {
  const cloudInit = `#cloud-config\nuser: cloud-user\npassword: atomic\nchpasswd: {expire: False}\nruncmd:\n- dnf install -y qemu-guest-agent\n- systemctl start qemu-guest-agent`;
  const testVM = getVMManifest(ProvisionSource.CONTAINER, testName, null, cloudInit);
  const vm = new VirtualMachine(testVM.metadata);

  beforeAll(async () => {
    createResources([multusNAD, testVM]);
    await vm.navigateToOverview();
  });

  afterAll(() => {
    deleteResources([vm.asResource(), multusNAD]);
  });

  it('ID(CNV-3333) Inventory card', async () => {
    expect(dashboardView.vmInventoryNICs.getText()).toContain('1');
    expect(dashboardView.vmInventoryNICs.$('a').getAttribute('href')).toMatch(
      new RegExp(`.*/k8s/ns/${vm.namespace}/${VirtualMachineModel.plural}/${vm.name}/nics`),
    );
    expect(dashboardView.vmInventoryDisks.getText()).toContain('2');

    await vm.addDisk(hddDisk);
    await vm.addNIC(multusNetworkInterface);
    await vm.navigateToOverview();

    expect(dashboardView.vmInventoryNICs.getText()).toContain('2');
    expect(dashboardView.vmInventoryDisks.getText()).toContain('3');

    await vm.removeDisk(hddDisk.name);
    await vm.removeNIC(multusNetworkInterface.name);
  });

  it(
    'ID(CNV-3330) Status card',
    async () => {
      await vm.waitForStatus(VM_STATUS.Stopped);
      await vm.navigateToOverview();
      expect(dashboardView.vmStatus.getText()).toEqual(VM_STATUS.Stopped);

      await vm.start();
      await vm.navigateToOverview();
      expect(dashboardView.vmStatus.getText()).toEqual(VM_STATUS.Running);
      await browser.wait(until.stalenessOf(dashboardView.vmStatusAlert));
    },
    VM_BOOTUP_TIMEOUT_SECS,
  );

  it('ID(CNV-3332) Details card', async () => {
    await browser.wait(waitForStringInElement(dashboardView.vmDetailsHostname, vm.name));
    expect(dashboardView.vmDetailsName.getText()).toEqual(vm.name);
    expect(dashboardView.vmDetailsNamespace.getText()).toEqual(vm.namespace);
    expect(dashboardView.vmDetailsNode.getText()).not.toEqual(NOT_AVAILABLE);
    expect(dashboardView.vmDetailsIPAddress.getText()).not.toEqual(NOT_AVAILABLE);
    expect(dashboardView.vmDetailsOS.getText()).toContain('Fedora');
    expect(dashboardView.vmDetailsTZ.getText()).toContain('UTC');

    await click(dashboardView.vmDetailsViewAll);
    const currentUrl = await browser.getCurrentUrl();
    expect(currentUrl).toMatch(
      new RegExp(`.*/k8s/ns/${vm.namespace}/${VirtualMachineModel.plural}/${vm.name}/details`),
    );

    await vm.stop();
    await vm.navigateToOverview();

    expect(dashboardView.vmDetailsNode.getText()).toEqual(NOT_AVAILABLE);
    expect(dashboardView.vmDetailsIPAddress.getText()).toEqual(NOT_AVAILABLE);
    expect(dashboardView.vmDetailsOS.getText()).toEqual('Red Hat Enterprise Linux 7.0 or higher');
  });

  it(
    'ID(CNV-3331) Utilization card',
    async () => {
      expect(dashboardView.vmUtilizationItemUsage(0).getText()).toContain('CPU');
      expect(dashboardView.vmUtilizationItemUsage(0).getText()).toContain(NOT_AVAILABLE);
      expect(dashboardView.vmUtilizationItemMetrics(0).getText()).toContain('No datapoints found');

      await vm.start();
      await vm.navigateToOverview();
      expect(dashboardView.vmStatus.getText()).toEqual(VM_STATUS.Running);
      // CPU metrics takes very long time to show up
      await browser.wait(
        until.not(
          until.textToBePresentInElement(dashboardView.vmUtilizationItemUsage(0), NOT_AVAILABLE),
        ),
        150 * 1000,
      );
      for (let i = 0; i < dashboardView.vmUtilizationItems.count(); i++) {
        expect(dashboardView.vmUtilizationItemUsage(i).getText()).not.toContain(NOT_AVAILABLE);
        expect(dashboardView.vmUtilizationItemMetrics(i).getText()).not.toContain(
          'No datapoints found',
        );
      }
    },
    JASMINE_EXTENDED_TIMEOUT_INTERVAL,
  );

  it('ID(CNV-3329) Events card', async () => {
    await browser.wait(until.presenceOf(dashboardView.vmEvents));
    await click(dashboardView.vmEventsViewAll);
    const currentUrl = await browser.getCurrentUrl();
    expect(currentUrl).toMatch(
      new RegExp(`.*/k8s/ns/${vm.namespace}/${VirtualMachineModel.plural}/${vm.name}/events`),
    );
  });
});
