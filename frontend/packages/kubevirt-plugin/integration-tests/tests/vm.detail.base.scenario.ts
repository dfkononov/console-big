import * as _ from 'lodash';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { resourceTitle } from '@console/internal-integration-tests/views/crud.view';
import { asyncForEach, createResource, deleteResource } from '../utils/shared-utils';
import * as vmView from '../views/virtualMachine.view';
import { getVMManifest } from './mocks/mocks';
import { VirtualMachine } from './models/virtualMachine';
import { NodePortService } from './types/types';
import { NOT_AVAILABLE, VM_BOOTUP_TIMEOUT_SECS } from './utils/constants/common';
import { ProvisionSource } from './utils/constants/enums/provisionSource';
import { VM_STATUS } from './utils/constants/vm';
import { OperatingSystem, Workload } from './utils/constants/wizard';
import { exposeServices } from './utils/utils';

describe('Kubevirt VM details tab', () => {
  const vmName = `vm-${testName}`;
  const cloudInit = `#cloud-config\nuser: cloud-user\npassword: atomic\nchpasswd: {expire: False}`;
  const serviceCommon = { name: vmName, kind: 'vm', type: 'NodePort', namespace: testName };
  const testVM = getVMManifest(ProvisionSource.CONTAINER, testName, vmName, cloudInit);
  const vm = new VirtualMachine(testVM.metadata);
  const nodePortServices = new Set<NodePortService>();
  nodePortServices.add({
    ...serviceCommon,
    exposeName: `${vmName}-service-ssh`,
    port: '22',
    targetPort: '20022',
  });
  nodePortServices.add({
    ...serviceCommon,
    exposeName: `${vmName}-service-smtp`,
    port: '25',
    targetPort: '20025',
  });
  nodePortServices.add({
    ...serviceCommon,
    exposeName: `${vmName}-service-http`,
    port: '80',
    targetPort: '20080',
  });

  beforeAll(async () => {
    createResource(testVM);
    exposeServices(nodePortServices);
  });

  afterAll(async () => {
    deleteResource(testVM);
  });

  beforeEach(async () => {
    await vm.navigateToDetail();
  });

  it('ID(CNV-763) Check VM details when VM is off', async () => {
    const expectation = {
      name: vmName,
      status: VM_STATUS.Stopped,
      description: testName,
      os: OperatingSystem.RHEL7,
      profile: Workload.DESKTOP.toLowerCase(),
      template: NOT_AVAILABLE,
      bootOrder: ['rootdisk (Disk)', 'nic-0 (NIC)', 'cloudinitdisk (Disk)'],
      flavorConfig: 'Tiny: 1 CPU | 1 GiB Memory',
      ip: NOT_AVAILABLE,
      pod: NOT_AVAILABLE,
      node: NOT_AVAILABLE,
    };

    const found = {
      name: await resourceTitle.getText(),
      status: await vm.getStatus(),
      description: await vmView.vmDetailDesc(testName, vmName).getText(),
      os: await vmView.vmDetailOS(testName, vmName).getText(),
      profile: await vmView.vmDetailWorkloadProfile(testName, vmName).getText(),
      template: await vmView.vmDetailTemplate().getText(),
      bootOrder: await vmView.vmDetailBootOrder(testName, vmName).getText(),
      flavorConfig: await vmView.vmDetailFlavor(testName, vmName).getText(),
      ip: await vmView.vmDetailIP(testName, vmName).getText(),
      pod: await vmView.vmDetailPod(testName, vmName).getText(),
      node: await vmView.vmDetailNode(testName, vmName).getText(),
    };

    const equal = _.isEqual(found, expectation);
    if (!equal) {
      // eslint-disable-next-line no-console
      console.error(`Expected:\n${JSON.stringify(expectation)},\nGot:\n${JSON.stringify(found)}`);
    }
    expect(equal).toBe(true);
  });

  it(
    'ID(CNV-4037) Check VM details when VM is running',
    async () => {
      await vm.start();
      // Empty fields turn into non-empty
      expect(await vmView.vmDetailIP(testName, vmName).getText()).not.toEqual(NOT_AVAILABLE);
      expect(
        await vmView
          .vmDetailPod(testName, vmName)
          .$('a')
          .getText(),
      ).toContain('virt-launcher');
      expect(
        await vmView
          .vmDetailNode(testName, vmName)
          .$('a')
          .getText(),
      ).not.toEqual(NOT_AVAILABLE);
    },
    VM_BOOTUP_TIMEOUT_SECS,
  );

  it('ID(CNV-2081) Check exposed services', async () => {
    await asyncForEach(nodePortServices, async (srv) => {
      expect(await vmView.vmDetailService(srv.exposeName).getText()).toEqual(srv.exposeName);
      expect(await vmView.vmDetailService(srv.exposeName).getAttribute('href')).toContain(
        `/k8s/ns/${testName}/services/${srv.exposeName}`,
      );
    });
  });
});
