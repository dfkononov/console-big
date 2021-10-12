import { Extension } from './base';

namespace ExtensionProperties {
  export interface StorageClassProvisioner {
    getStorageClassProvisioner: ExtensionSCProvisionerProp;
  }
}

export interface StorageClassProvisioner
  extends Extension<ExtensionProperties.StorageClassProvisioner> {
  type: 'StorageClass/Provisioner';
}

export const isStorageClassProvisioner = (e: Extension): e is StorageClassProvisioner => {
  return e.type === 'StorageClass/Provisioner';
};

export type ProvisionerProps = {
  parameterKey: string;
  parameterValue: string;
  onParamChange: (param: string, event: string, checkbox: boolean) => void;
};

export type ExtensionSCProvisionerProp = {
  [key: string]: {
    [key: string]: {
      title: string;
      provisioner: string;
      allowVolumeExpansion: boolean;
      parameters: {
        [key: string]: {
          name: string;
          hintText: string;
          value?: string;
          visible?: (params?: any) => boolean;
          required?: boolean;
          Component?: React.ComponentType<ProvisionerProps>;
        };
      };
    };
  };
};
