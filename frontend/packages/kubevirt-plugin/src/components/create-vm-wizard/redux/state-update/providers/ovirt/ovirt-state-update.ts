import * as _ from 'lodash';
import { correctVMImportProviderSecretLabels } from '../../../../../../k8s/requests/v2v/correct-vm-import-provider-secret-labels';
import { NetworkWrapper } from '../../../../../../k8s/wrapper/vm/network-wrapper';
import { PodDeploymentStatus } from '../../../../../../statuses/pod-deployment/constants';
import { getSimplePodDeploymentStatus } from '../../../../../../statuses/pod-deployment/pod-deployment-status';
import {
  getSimpleV2VPRoviderStatus,
  V2V_PROVIDER_STATUS_ALL_OK,
  V2VProviderStatus,
} from '../../../../../../statuses/v2v';
import { UIValidationType } from '../../../../../../types/ui/ui';
import {
  iGet,
  iGetIn,
  immutableListToShallowJS,
  toShallowJS,
} from '../../../../../../utils/immutable';
import { iGetCreateVMWizardTabs } from '../../../../selectors/immutable/common';
import { hasImportProvidersChanged } from '../../../../selectors/immutable/import-providers';
import { iGetNetworks } from '../../../../selectors/immutable/networks';
import {
  hasOvirtSettingsChanged,
  hasOvirtSettingsValueChanged,
  iGetOvirtField,
  iGetOvirtFieldAttribute,
  iGetOvirtFieldValue,
  isOvirtProvider,
} from '../../../../selectors/immutable/provider/ovirt/selectors';
import { iGetCommonData, iGetLoadedCommonData } from '../../../../selectors/immutable/selectors';
import { getLoadedVm } from '../../../../selectors/provider/selectors';
import {
  ImportProvidersField,
  OvirtProviderField,
  OvirtProviderProps,
  VM_WIZARD_DIFFICULT_TABS,
  VMImportProvider,
  VMSettingsField,
  VMWizardNetwork,
  VMWizardProps,
  VMWizardTab,
} from '../../../../types';
import { asDisabled, asHidden, asRequired } from '../../../../utils/utils';
import { vmWizardInternalActions } from '../../../internal-actions';
import { InternalActionType, UpdateOptions } from '../../../types';
import { cleanupOvirtProvider } from './ovirt-cleanup';
import { prefillUpdateCreator } from './ovirt-prefill-vm';
import {
  createConnectionObjects,
  startVMImportOperatorWithCleanup,
} from './ovirt-provider-actions';
import { updateExtraWSQueries } from './update-ws-queries';

const startControllerAndCleanup = (options: UpdateOptions) => {
  const { id, dispatch, prevState, getState } = options;
  const state = getState();
  if (!hasImportProvidersChanged(prevState, state, id, ImportProvidersField.PROVIDER)) {
    return;
  }

  const namespace = iGetCommonData(state, id, VMWizardProps.activeNamespace);

  cleanupOvirtProvider(options); // call should be idempotent and called on every provider change

  dispatch(
    vmWizardInternalActions[InternalActionType.SetInVmSettings](
      id,
      [VMSettingsField.NAME, 'validations'],
      isOvirtProvider(state, id)
        ? [
            {
              type: UIValidationType.LENGTH,
              settings: {
                min: 1,
                max: 63,
              },
            },
          ]
        : [],
    ),
  );

  if (isOvirtProvider(state, id) && namespace) {
    startVMImportOperatorWithCleanup(options);
  }
};

const deploymentChanged = (options: UpdateOptions) => {
  const { id, getState, changedCommonData, dispatch } = options;
  const state = getState();

  if (
    !changedCommonData.has(OvirtProviderProps.deployment) &&
    !changedCommonData.has(OvirtProviderProps.deploymentPods)
  ) {
    return;
  }

  const iDeployment = iGet(iGetCommonData(state, id, OvirtProviderProps.deployment), 'data');
  const deployment = toShallowJS(iDeployment, undefined, true);
  const deploymentPods = immutableListToShallowJS(
    iGetLoadedCommonData(state, id, OvirtProviderProps.deploymentPods),
  );

  const status = getSimplePodDeploymentStatus(deployment, deploymentPods);

  const isLastErrorHidden = !!deployment;
  const isOvirtEngineSecreteDisabled = status !== PodDeploymentStatus.ROLLOUT_COMPLETE;

  if (
    iGet(
      iGetOvirtFieldAttribute(state, id, OvirtProviderField.CONTROLLER_LAST_ERROR, 'isHidden'),
      VMImportProvider.OVIRT,
    ) !== isLastErrorHidden ||
    iGet(
      iGetOvirtFieldAttribute(state, id, OvirtProviderField.OVIRT_ENGINE_SECRET_NAME, 'isDisabled'),
      VMImportProvider.OVIRT,
    ) !== isOvirtEngineSecreteDisabled
  ) {
    dispatch(
      vmWizardInternalActions[InternalActionType.UpdateImportProvider](id, VMImportProvider.OVIRT, {
        [OvirtProviderField.CONTROLLER_LAST_ERROR]: {
          isHidden: asHidden(isLastErrorHidden, VMImportProvider.OVIRT),
        },
        [OvirtProviderField.OVIRT_ENGINE_SECRET_NAME]: {
          isDisabled: asDisabled(isOvirtEngineSecreteDisabled, VMImportProvider.OVIRT),
        },
      }),
    );
  }
};

const ovirtProviderCRUpdater = (options: UpdateOptions) => {
  const { id, prevState, changedCommonData, dispatch, getState } = options;
  const state = getState();

  if (!changedCommonData.has(OvirtProviderProps.ovirtProvider)) {
    return;
  }

  const iOVirtProviderCR = iGet(
    iGetCommonData(state, id, OvirtProviderProps.ovirtProvider),
    'data',
  );
  const ovirtProviderCR = toShallowJS(iOVirtProviderCR, undefined, true);

  const selectedVMID = iGetOvirtFieldValue(state, id, OvirtProviderField.VM);
  const vm = getLoadedVm(ovirtProviderCR, selectedVMID);
  const defaultSC = toShallowJS(iGetOvirtFieldAttribute(state, id, OvirtProviderField.VM, 'sc'));

  const status = getSimpleV2VPRoviderStatus(ovirtProviderCR, { requestsVM: selectedVMID && !vm }); // hack around unresponsiveness of ovirtProvider

  const areMainActionsDisabled = _.isEmpty(iOVirtProviderCR) || iOVirtProviderCR.isEmpty();

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateImportProvider](id, VMImportProvider.OVIRT, {
      [OvirtProviderField.CLUSTER]: {
        isDisabled: asDisabled(areMainActionsDisabled, OvirtProviderField.CLUSTER),
      },
      [OvirtProviderField.VM]: {
        isDisabled: asDisabled(areMainActionsDisabled, OvirtProviderField.VM),
        // data for request
        vm: selectedVMID && !vm ? undefined : vm, // moving across tabs resets listening for OvirtProvider
      },
      [OvirtProviderField.STATUS]: {
        value: status?.getValue(),
      },
    }),
  );

  if (status === V2VProviderStatus.CONNECTION_SUCCESSFUL) {
    const selectedSecretName = iGetOvirtFieldAttribute(
      state,
      id,
      OvirtProviderField.OVIRT_ENGINE_SECRET_NAME,
      'secretName',
    );
    const currentResolvedSecretName = iGetOvirtField(
      state,
      id,
      OvirtProviderField.CURRENT_RESOLVED_OVIRT_ENGINE_SECRET_NAME,
    );
    if (currentResolvedSecretName !== selectedSecretName) {
      // update - so we don't correct labels twice
      dispatch(
        vmWizardInternalActions[InternalActionType.UpdateImportProvider](
          id,
          VMImportProvider.OVIRT,
          {
            [OvirtProviderField.OVIRT_ENGINE_SECRET_NAME]: {
              secretName: currentResolvedSecretName,
            },
          },
        ),
      );
      correctVMImportProviderSecretLabels({
        provider: VMImportProvider.OVIRT,
        secretName: currentResolvedSecretName,
        secretNamespace: iGetCommonData(state, id, VMWizardProps.activeNamespace),
        saveCredentialsRequested: iGetOvirtFieldValue(
          state,
          id,
          OvirtProviderField.REMEMBER_PASSWORD,
        ),
      });
    }
  }

  const prevVm = iGetOvirtFieldAttribute(prevState, id, OvirtProviderField.VM, 'vm');
  const prevLoadedVMID = prevVm && prevVm.get('id');
  const loadedVMID = vm?.id;

  if (!vm || prevLoadedVMID === loadedVMID || loadedVMID !== selectedVMID) {
    return;
  }

  prefillUpdateCreator(options, defaultSC);
};

const vmOrClusterChangedUpdater = (options: UpdateOptions) => {
  const { id, prevState, dispatch, getState } = options;
  const state = getState();
  if (
    !hasOvirtSettingsValueChanged(
      prevState,
      state,
      id,
      OvirtProviderField.VM,
      OvirtProviderField.CLUSTER,
    )
  ) {
    return;
  }

  if (iGetCommonData(state, id, VMWizardProps.isSimpleView)) {
    VM_WIZARD_DIFFICULT_TABS.forEach((tab) => {
      if (!iGetIn(iGetCreateVMWizardTabs(state, id), [tab, 'isHidden'])) {
        dispatch(vmWizardInternalActions[InternalActionType.SetTabHidden](id, tab, true));
      }
    });
  }
};

const providerUpdater = (options: UpdateOptions) => {
  const { id, prevState, dispatch, getState } = options;
  const state = getState();
  if (
    !(
      hasImportProvidersChanged(prevState, state, id, ImportProvidersField.PROVIDER) ||
      hasOvirtSettingsChanged(
        prevState,
        state,
        id,
        OvirtProviderField.STATUS,
        OvirtProviderField.VM,
      )
    )
  ) {
    return;
  }

  const namespace = iGetCommonData(state, id, VMWizardProps.activeNamespace);
  const loadedVm = iGetOvirtFieldAttribute(state, id, OvirtProviderField.VM, 'vm');
  const iStatus = iGetOvirtFieldValue(state, id, OvirtProviderField.STATUS);
  const status = V2VProviderStatus.fromString(iStatus);

  const hasLoadedVm = !!loadedVm;
  const isOvProvider = !!isOvirtProvider(state, id);
  const isOkStatus = V2V_PROVIDER_STATUS_ALL_OK.has(status);

  const hiddenMetadata = {
    isHidden: asHidden(!namespace || !isOvProvider, VMImportProvider.OVIRT),
  };

  const requiredMetadata = {
    ...hiddenMetadata,
    isRequired: asRequired(isOvProvider, VMImportProvider.OVIRT),
  };

  const isEditingDisabled = isOvProvider;
  const needsValuesReset = !isOvProvider || (isOvProvider && !hasLoadedVm);

  const vmFieldUpdate = {
    isDisabled: asDisabled(isEditingDisabled, VMImportProvider.OVIRT),
    value: needsValuesReset ? null : undefined,
    // VM Settings override! (Do not use for container and url as it is just a boolean - not by key as isRequired)
    skipValidation: isOvProvider,
  };

  const mainFieldUpdate = {
    ...requiredMetadata,
    isDisabled: asDisabled(
      !isOkStatus && status !== V2VProviderStatus.LOADING_VM_DETAIL_FAILED,
      VMImportProvider.OVIRT,
    ),
  };

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateVmSettings](id, {
      [VMSettingsField.NAME]: {
        value: needsValuesReset ? null : undefined,
      },
      [VMSettingsField.DESCRIPTION]: {
        value: needsValuesReset ? null : undefined,
      },
      [VMSettingsField.OPERATING_SYSTEM]: {
        ...vmFieldUpdate,
        display: needsValuesReset ? null : undefined,
      },
      [VMSettingsField.FLAVOR]: vmFieldUpdate,
      [VMSettingsField.MEMORY]: vmFieldUpdate,
      [VMSettingsField.CPU]: vmFieldUpdate,
      [VMSettingsField.WORKLOAD_PROFILE]: vmFieldUpdate,
      [VMSettingsField.START_VM]: {
        isHidden: asHidden(!isOvProvider, VMWizardProps.isProviderImport),
      },
    }),
  );

  [VMWizardTab.STORAGE, VMWizardTab.NETWORKING, VMWizardTab.ADVANCED].forEach((tab) => {
    const isDisabled = isOvProvider;
    if (!!iGetIn(iGetCreateVMWizardTabs(state, id), [tab, 'isCreateDisabled']) !== isDisabled) {
      dispatch(
        vmWizardInternalActions[InternalActionType.SetTabIsCreateDisabled](id, tab, isDisabled),
      );
      dispatch(
        vmWizardInternalActions[InternalActionType.SetTabIsDeleteDisabled](id, tab, isDisabled),
      );
    }
  });

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateImportProvider](id, VMImportProvider.OVIRT, {
      [OvirtProviderField.OVIRT_ENGINE_SECRET_NAME]: requiredMetadata,
      [OvirtProviderField.API_URL]: hiddenMetadata,
      [OvirtProviderField.USERNAME]: hiddenMetadata,
      [OvirtProviderField.PASSWORD]: hiddenMetadata,
      [OvirtProviderField.REMEMBER_PASSWORD]: hiddenMetadata,
      [OvirtProviderField.CERTIFICATE]: hiddenMetadata,
      [OvirtProviderField.CONTROLLER_LAST_ERROR]: hiddenMetadata,
      [OvirtProviderField.CLUSTER]: {
        ...mainFieldUpdate,
        value: !isOvProvider ? null : undefined,
      },
      [OvirtProviderField.VM]: {
        ...mainFieldUpdate,
        value: !isOvProvider ? null : undefined,
        vm: !isOvProvider ? null : undefined,
      },
      [OvirtProviderField.STATUS]: {
        isHidden: asHidden(
          !isOvProvider ||
            V2V_PROVIDER_STATUS_ALL_OK.has(status) ||
            status === V2VProviderStatus.UNKNOWN,
          VMImportProvider.OVIRT,
        ),
      },
    }),
  );
};

const secretUpdater = (options) => {
  const { id, prevState, dispatch, getState } = options;
  const state = getState();
  if (
    !hasOvirtSettingsValueChanged(prevState, state, id, OvirtProviderField.OVIRT_ENGINE_SECRET_NAME)
  ) {
    return;
  }

  const connectionSecretName = iGetOvirtFieldAttribute(
    state,
    id,
    OvirtProviderField.OVIRT_ENGINE_SECRET_NAME,
    'secretName',
  );
  const isNewInstanceSecret = iGetOvirtFieldAttribute(
    state,
    id,
    OvirtProviderField.OVIRT_ENGINE_SECRET_NAME,
    'isNewInstance',
  );

  const hiddenMetadata = {
    isHidden: asHidden(!isNewInstanceSecret, OvirtProviderField.OVIRT_ENGINE_SECRET_NAME),
  };

  const metadata = {
    ...hiddenMetadata,
    isRequired: asRequired(isNewInstanceSecret, OvirtProviderField.OVIRT_ENGINE_SECRET_NAME),
  };

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateImportProvider](id, VMImportProvider.OVIRT, {
      [OvirtProviderField.API_URL]: metadata,
      [OvirtProviderField.USERNAME]: metadata,
      [OvirtProviderField.PASSWORD]: metadata,
      [OvirtProviderField.CERTIFICATE]: metadata,
      [OvirtProviderField.REMEMBER_PASSWORD]: hiddenMetadata,
    }),
  );

  if (!isNewInstanceSecret && connectionSecretName) {
    // side effect
    createConnectionObjects(options, {
      namespace: iGetCommonData(state, id, VMWizardProps.activeNamespace),
      connectionSecretName,
      prevNamespace: iGetCommonData(prevState, id, VMWizardProps.activeNamespace),
      prevOvirtProviderName: iGetOvirtField(
        prevState,
        id,
        OvirtProviderField.CURRENT_OVIRT_PROVIDER_CR_NAME,
      ),
    });
  }
};

const networksNicProfileDuplicatesUpdater = (options: UpdateOptions) => {
  const { id, prevState, dispatch, getState } = options;
  const state = getState();

  if (!isOvirtProvider(state, id)) {
    return;
  }

  const prevINetworks = iGetNetworks(prevState, id);
  const iNetworks = iGetNetworks(state, id);

  if (!iNetworks) {
    return;
  }

  const changedInetworks = !prevINetworks
    ? iNetworks
    : iNetworks.filter((iNetwork, iNetworkIdx) => iNetwork !== prevINetworks.get(iNetworkIdx));

  const changedInetworksWithMultipleVNics = changedInetworks.filter((iNetwork) =>
    iGetIn(iNetwork, ['importData', 'networksWithSameVnicID']),
  );

  if (changedInetworksWithMultipleVNics.size === 0) {
    return;
  }

  const changedNetworksVnicIDLookup = changedInetworksWithMultipleVNics.reduce(
    (lookup, iNetwork) => {
      const vnicID = iGetIn(iNetwork, ['importData', 'vnicID']);
      if (vnicID) {
        lookup[vnicID] = iNetwork;
      }
      return lookup;
    },
    {},
  );

  const updatedNetworks = iNetworks
    .map((iNetwork) => {
      const wizardNetwork: VMWizardNetwork = toShallowJS(iNetwork);
      const changedPeerIwizardNetwork =
        changedNetworksVnicIDLookup[wizardNetwork?.importData?.vnicID];

      if (changedPeerIwizardNetwork && iNetwork !== changedPeerIwizardNetwork) {
        const networkWrapper = new NetworkWrapper(wizardNetwork.network, true);
        const changedPeerNetworkWrapper = new NetworkWrapper(
          toShallowJS(changedPeerIwizardNetwork.get('network')),
        );

        networkWrapper.setType(
          changedPeerNetworkWrapper.getType(),
          changedPeerNetworkWrapper.getTypeData(),
        );

        return {
          ...wizardNetwork,
          network: networkWrapper.asResource(),
        };
      }
      return wizardNetwork;
    })
    .toArray();

  dispatch(vmWizardInternalActions[InternalActionType.SetNetworks](id, updatedNetworks));
};

export const getOvirtProviderStateUpdater = (options: UpdateOptions) =>
  [
    updateExtraWSQueries,
    startControllerAndCleanup,
    deploymentChanged,
    ovirtProviderCRUpdater,
    vmOrClusterChangedUpdater,
    providerUpdater,
    secretUpdater,
    networksNicProfileDuplicatesUpdater,
  ].forEach((updater) => {
    updater && updater(options);
  });
