import { click, fillInput } from '../../utils/shared-utils';
import * as view from '../../views/dialogs/networkInterface.view';
import * as wizardView from '../../views/importWizard.view';
import { modalSubmitButton, saveButton } from '../../views/kubevirtUIResource.view';
import { waitForNoLoaders } from '../../views/wizard.view';
import { Network } from '../types/types';
import {
  checkForError,
  getSelectOptions,
  selectItemFromDropdown,
  selectOptionByText,
} from '../utils/utils';

export class NetworkInterfaceDialog {
  async fillName(name: string) {
    await fillInput(view.nicName, name);
    return checkForError(wizardView.errorHelper);
  }

  async selectModel(model: string) {
    await selectItemFromDropdown(view.nicModel, view.nicDropDownItem(model));
  }

  async selectNetwork(network: string) {
    await selectOptionByText(view.nicNetwork, network);
  }

  async selectType(type: string) {
    await selectItemFromDropdown(view.nicType, view.nicDropDownItem(type));
  }

  async fillMAC(mac: string) {
    await fillInput(view.nicMACAddress, mac);
  }

  async getNetworks(): Promise<string[]> {
    return getSelectOptions(view.nicNetwork);
  }

  async create(NIC: Network) {
    await waitForNoLoaders();
    await this.fillName(NIC.name);
    await this.selectModel(NIC.model);
    await this.selectNetwork(NIC.network);
    await this.selectType(NIC.type);
    await this.fillMAC(NIC.mac);
    await click(modalSubmitButton);
    await waitForNoLoaders();
  }

  async edit(NIC) {
    await waitForNoLoaders();
    if (NIC.name) {
      await this.fillName(NIC.name);
    }
    if (NIC.model) {
      await this.selectModel(NIC.model);
    }
    if (NIC.network) {
      await this.selectNetwork(NIC.network);
    }
    if (NIC.type) {
      await this.selectType(NIC.type);
    }
    if (NIC.mac) {
      await this.fillMAC(NIC.mac);
    }
    await click(saveButton);
    await waitForNoLoaders();
  }
}
