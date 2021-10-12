import { iGetIn } from '../../../../utils/immutable';
import { CloudInitField, VMWizardTab } from '../../types';
import { iGetCreateVMWizardTabs } from './common';

export const iGetCloudInitValue = (
  state,
  id: string,
  key: CloudInitField,
  defaultValue = undefined,
) =>
  iGetIn(
    iGetCreateVMWizardTabs(state, id),
    [VMWizardTab.ADVANCED, 'value', key, 'value'],
    defaultValue,
  );
