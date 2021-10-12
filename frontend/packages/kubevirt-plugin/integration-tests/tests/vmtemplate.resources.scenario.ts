import { find } from 'lodash';
import { createResource, deleteResource, deleteResources } from '../utils/shared-utils';
import { hddDisk, multusNAD, multusNetworkInterface } from './mocks/mocks';
import { getBasicVMBuilder, getBasicVMTBuilder } from './mocks/vmBuilderPresets';
import { VMBuilder } from './models/vmBuilder';
import { VMTemplateBuilder } from './models/vmtemplateBuilder';
import { TEMPLATE_ACTIONS_TIMEOUT_SECS } from './utils/constants/common';
import { ProvisionSource } from './utils/constants/enums/provisionSource';

describe('Test adding/removing discs/nics to/from a VM template', () => {
  const vmt = new VMTemplateBuilder(getBasicVMTBuilder())
    .setProvisionSource(ProvisionSource.URL)
    .setName('test-vmt-disk-nic')
    .build();

  const vm = new VMBuilder(getBasicVMBuilder())
    .setSelectTemplateName(vmt.name)
    .setName('from-template')
    .setStartOnCreation(false)
    .build();

  beforeAll(async () => {
    createResource(multusNAD);
    await vmt.create();
    await vmt.navigateToDetail();
  });

  afterAll(() => {
    deleteResources([multusNAD, vmt.asResource()]);
  });

  describe('Test adding disks/nics to a VM template', () => {
    beforeAll(async () => {
      await vmt.addDisk(hddDisk);
      await vmt.addNIC(multusNetworkInterface);
      await vm.create();
    }, TEMPLATE_ACTIONS_TIMEOUT_SECS);

    afterAll(() => {
      deleteResource(vm.asResource());
    });

    it('ID(CNV-1849) Adds a disk to a VM template', async () => {
      expect(
        find(await vm.getAttachedDisks(), (disk) => disk.name.startsWith(hddDisk.name)),
      ).toBeDefined();
    });

    it('ID(CNV-1850) Adds a NIC to a VM template', async () => {
      expect(
        find(await vm.getAttachedNICs(), (NIC) => NIC.name.startsWith(multusNetworkInterface.name)),
      ).toBeDefined();
    });
  });

  describe('Test removing disks/nics from a VM template', () => {
    beforeAll(async () => {
      await vmt.navigateToDetail();
      await vmt.removeDisk(hddDisk.name);
      await vmt.removeNIC(multusNetworkInterface.name);
      await vm.create();
    }, TEMPLATE_ACTIONS_TIMEOUT_SECS);

    afterAll(() => {
      deleteResource(vm.asResource());
    });

    it('ID(CNV-4092) Removes a disk from VM template', async () => {
      expect(
        find(await vm.getAttachedDisks(), (disk) => disk.name.startsWith(hddDisk.name)),
      ).not.toBeDefined();
      expect(vm.getAttachedDisks()).not.toContain(hddDisk);
    });

    it('ID(CNV-4091) Removes a NIC from VM template', async () => {
      expect(
        find(await vm.getAttachedNICs(), (NIC) => NIC.name.startsWith(multusNetworkInterface.name)),
      ).not.toBeDefined();
    });
  });
});
