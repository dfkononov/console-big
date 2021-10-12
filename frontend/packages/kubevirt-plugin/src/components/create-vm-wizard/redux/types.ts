import { DeviceType } from '../../../constants/vm';
import { ValidationObject } from '../../../selectors';
import { FirehoseResourceEnhanced } from '../../../types/custom';
import {
  ChangedCommonData,
  ChangedCommonDataProp,
  CloudInitField,
  ImportProvidersField,
  OvirtProviderField,
  SettingsFieldType,
  VMImportProvider,
  VMSettingsField,
  VMWareProviderField,
  VMWizardNetwork,
  VMWizardStorage,
  VMWizardTab,
} from '../types';

export enum ActionType {
  Create = 'KubevirtVMWizardExternalCreate',
  Dispose = 'KubevirtVMWiExternalDispose',
  CreateVM = 'KubevirtVMWiExternalCreateVM',
  UpdateCommonData = 'KubevirtVMWizardExternalUpdateCommonData',
  SetGoToStep = 'KubevirtVMWizardExternalSetGoToStep',
  OpenDifficultTabs = 'KubevirtVMWizardExternalOpenDifficultTabs',
  SetVmSettingsFieldValue = 'KubevirtVMWizardExternalSetVmSettingsFieldValue',
  SetImportProvidersFieldValue = 'KubevirtVMWizardExternalSetImportProvidersFieldValue',
  UpdateImportProviderField = 'KubevirtVMWizardExternalUpdateImportProviderField',
  SetCloudInitFieldValue = 'KubevirtVMWizardExternalSetCloudInitFieldValue',
  SetTabLocked = 'KubevirtVMWizardExternalSetTabLocked',
  SetTabHidden = 'KubevirtVMWizardExternalSetTabHidden',
  RemoveNIC = 'KubevirtVMWizardExternalRemoveNIC',
  UpdateNIC = 'KubevirtVMWizardExternalUpdateNIC',
  SetDeviceBootOrder = 'KubevirtVMWizardExternalSetDeviceBootOrder',
  RemoveStorage = 'KubevirtVMWizardExternalRemoveStorage',
  UpdateStorage = 'KubevirtVMWizardExternalUpdateStorage',
  SetResults = 'KubevirtVMWizardExternalSetResults',
}

// should not be called directly from outside redux code (e.g. stateUpdate)
export enum InternalActionType {
  Create = 'KubevirtVMWizardCreate',
  Dispose = 'KubevirtVMWizardDispose',
  Update = 'KubevirtVMWizardUpdate',
  UpdateCommonData = 'KubevirtVMWizardUpdateCommonData',
  UpdateCommonDataValue = 'KubevirtVMWizardUpdateCommonDataValue',
  SetExtraWSQueries = 'KubevirtVMWizardSetExtraWSQueries',
  SetGoToStep = 'KubevirtVMWizardSetGoToStep',
  SetTabValidity = 'KubevirtVMWizardSetTabValidity',
  SetTabLocked = 'KubevirtVMWizardSetTabLocked',
  SetTabHidden = 'KubevirtVMWizardSetTabHidden',
  SetTabIsCreateDisabled = 'KubevirtVMWizardSetTabIsCreateDisabled',
  SetTabIsUpdateDisabled = 'KubevirtVMWizardSetTabIsUpdateDisabled',
  SetTabIsDeleteDisabled = 'KubevirtVMWizardSetTabIsDeleteDisabled',
  SetVmSettingsFieldValue = 'KubevirtVMWizardSetVmSettingsFieldValue',
  SetImportProvidersFieldValue = 'KubevirtVMWizardSetImportProvidersFieldValue',
  UpdateImportProviderField = 'KubevirtVMWizardUpdateImportProviderField',
  SetImportProvider = 'KubevirtVMWizardSetImportProvider',
  UpdateImportProvider = 'KubevirtVMWizardUpdateImportProvider',
  SetCloudInitFieldValue = 'KubevirtVMWizardSetCloudInitFieldValue',
  SetInVmSettings = 'KubevirtVMWizardSetInVmSettings',
  SetInVmSettingsBatch = 'KubevirtVMWizardSetInVmSettingsBatch',
  UpdateVmSettingsField = 'KubevirtVMWizardUpdateVmSettingsField',
  UpdateVmSettings = 'KubevirtVMWizardUpdateVmSettings',
  RemoveNIC = 'KubevirtVMWizardRemoveNIC',
  UpdateNIC = 'KubevirtVMWizardUpdateNIC',
  SetDeviceBootOrder = 'KubevirtVMWizardSetDeviceBootOrder',
  RemoveStorage = 'KubevirtVMWizardRemoveStorage',
  UpdateStorage = 'KubevirtVMWizardUpdateStorage',
  SetNetworks = 'KubevirtVMWizardSetNetworks',
  SetStorages = 'KubevirtVMWizardSetStorages',
  SetResults = 'KubevirtVMWizardSetResults',
}

export type WizardInternalAction = {
  type: InternalActionType;
  payload: {
    id: string;
    value?: any;
    isValid?: boolean;
    isLocked?: boolean;
    isPending?: boolean;
    isHidden?: boolean;
    isDisabled?: boolean;
    hasAllRequiredFilled?: boolean;
    path?: string[];
    key?:
      | VMSettingsField
      | CloudInitField
      | VMWareProviderField
      | OvirtProviderField
      | ImportProvidersField;
    queryKey?: string;
    wsQueries?: FirehoseResourceEnhanced[];
    provider?: VMImportProvider;
    tab?: VMWizardTab;
    batch?: ActionBatch;
    network?: VMWizardNetwork;
    networkID?: string;
    storage?: VMWizardStorage;
    storageID?: string;
    deviceID?: string;
    deviceType?: DeviceType;
    bootOrder?: number;
    errorKey?: string;
    fieldKeys?: string[];
  };
};

export type WizardInternalActionDispatcher = (id: string, ...any) => WizardInternalAction;
export type WizardActionDispatcher = (
  id: string,
  ...any
) => (dispatch: Function, getState: Function) => void;

export type ActionBatch = { path: string[]; value: any }[];

export type UpdateOptions = {
  id: string;
  changedCommonData: ChangedCommonData;
  dispatch: Function;
  getState: Function;
  prevState: any;
};

export type Validator<Field = VMSettingsField> = (
  field: SettingsFieldType<Field>,
  options: UpdateOptions,
) => ValidationObject;

export type ValidationConfig<Field = VMSettingsField> = {
  [key: string]: {
    detectValueChanges?: ((field, options) => Field[]) | Field[];
    detectCommonDataChanges?:
      | ((field, options) => ChangedCommonDataProp[])
      | ChangedCommonDataProp[];
    validator: Validator<Field>;
  };
};

export type Validation = {
  errorKey: string;
  fieldKeys?: string[];
  hasAllRequiredFilled: boolean;
  isValid: boolean;
};
