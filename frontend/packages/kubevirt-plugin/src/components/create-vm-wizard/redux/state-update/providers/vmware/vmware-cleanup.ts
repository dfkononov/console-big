import { deleteV2VvmwareObject } from '../../../../../../k8s/requests/v2v/delete-v2vvmware-object';
import {
  iGetVMWareField,
  isVMWareProvider,
} from '../../../../selectors/immutable/provider/vmware/selectors';
import { iGetCommonData } from '../../../../selectors/immutable/selectors';
import { VMImportProvider, VMWareProviderField, VMWizardProps } from '../../../../types';
import { getVmWareInitialState } from '../../../initial-state/providers/vmware-initial-state';
import { vmWizardInternalActions } from '../../../internal-actions';
import { InternalActionType, UpdateOptions } from '../../../types';

// should be idempotent and called on every provider change
export const cleanupVmWareProvider = async (options: UpdateOptions) => {
  const { id, prevState, getState, dispatch } = options;
  const state = getState();

  const name = iGetVMWareField(state, id, VMWareProviderField.CURRENT_V2V_VMWARE_CR_NAME);
  if (name) {
    // delete stale object
    deleteV2VvmwareObject({
      name,
      namespace: iGetCommonData(state, id, VMWizardProps.activeNamespace),
    });
  }

  // will clear V2V_NAME if provider changed
  if (isVMWareProvider(prevState, id) && !isVMWareProvider(state, id)) {
    dispatch(
      vmWizardInternalActions[InternalActionType.SetImportProvider](
        id,
        VMImportProvider.VMWARE,
        getVmWareInitialState(),
      ),
    );
  }
};
