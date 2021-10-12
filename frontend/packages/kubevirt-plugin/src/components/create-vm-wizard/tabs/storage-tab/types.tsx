import { StorageSimpleData } from '../../../vm-disks/types';
import { VMWizardStorage } from '../../types';

export type VMWizardStorageBundle = StorageSimpleData & {
  wizardStorageData: VMWizardStorage;
};

export type VMWizardStorageRowActionOpts = {
  wizardReduxID: string;
  removeStorage?: (id: string) => void;
  withProgress?: (promise: Promise<any>) => void;
  isUpdateDisabled: boolean;
  isDeleteDisabled: boolean;
};

export type VMWizardStorageRowCustomData = VMWizardStorageRowActionOpts & {
  columnClasses: string[];
  isDisabled: boolean;
};
