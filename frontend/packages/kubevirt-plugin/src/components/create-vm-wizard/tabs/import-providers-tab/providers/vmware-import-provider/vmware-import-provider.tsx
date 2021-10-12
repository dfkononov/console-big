import * as React from 'react';
import { Checkbox, TextInput } from '@patternfly/react-core';
import { connect } from 'react-redux';
import { iGet, iGetIn } from '../../../../../../utils/immutable';
import { FormField, FormFieldType } from '../../../../form/form-field';
import { FormFieldMemoRow } from '../../../../form/form-field-row';
import { vmWizardActions } from '../../../../redux/actions';
import { ActionType } from '../../../../redux/types';
import {
  iGetVMwareData,
  isVMWareProvider,
} from '../../../../selectors/immutable/provider/vmware/selectors';
import {
  VMImportProvider,
  VMWareProviderField,
  VMWareProviderRenderableField,
} from '../../../../types';
import { getFieldId } from '../../../../utils/renderable-field-utils';
import { VMImportPassword } from '../vm-import-password';
import { VMImportProviderControllerErrors } from '../vm-import-provider-controller-errors';
import { VMImportProviderControllerStatusRow } from '../vm-import-provider-controller-status-row';
import { VMImportProviderObjectStatus } from '../vm-import-provider-object-status';
import { VMImportSecrets } from '../vm-import-secrets';
import { VMWareVMs } from './vmware-vms';

import './vmware-import-provider.scss';

const provider = VMImportProvider.VMWARE;

class VMWareImportProviderConnected extends React.Component<VMWareImportProviderProps> {
  // helpers
  getField = (key: VMWareProviderRenderableField) => iGet(this.props.vmWareData, key);

  getValue = (key: VMWareProviderRenderableField) => iGetIn(this.props.vmWareData, [key, 'value']);

  onChange = (key: VMWareProviderRenderableField) => (value) =>
    this.props.onFieldChange(key, { value });

  render() {
    const { wizardReduxID, isVMWare } = this.props;

    if (!isVMWare) {
      return null;
    }

    return (
      <>
        <VMImportSecrets wizardReduxID={wizardReduxID} provider={provider} />
        <FormFieldMemoRow
          field={this.getField(VMWareProviderField.HOSTNAME)}
          fieldType={FormFieldType.TEXT}
        >
          <FormField>
            <TextInput onChange={this.onChange(VMWareProviderField.HOSTNAME)} />
          </FormField>
        </FormFieldMemoRow>
        <FormFieldMemoRow
          field={this.getField(VMWareProviderField.USERNAME)}
          fieldType={FormFieldType.TEXT}
        >
          <FormField>
            <TextInput onChange={this.onChange(VMWareProviderField.USERNAME)} />
          </FormField>
        </FormFieldMemoRow>
        <VMImportPassword wizardReduxID={wizardReduxID} provider={provider} />
        <FormFieldMemoRow
          field={this.getField(VMWareProviderField.REMEMBER_PASSWORD)}
          fieldType={FormFieldType.INLINE_CHECKBOX}
        >
          <FormField>
            <Checkbox
              className="kubevirt-create-vm-modal__vmware-provider-remember-password"
              id={getFieldId(VMWareProviderField.REMEMBER_PASSWORD)}
              onChange={this.onChange(VMWareProviderField.REMEMBER_PASSWORD)}
            />
          </FormField>
        </FormFieldMemoRow>
        <VMWareVMs wizardReduxID={wizardReduxID} />
        <VMImportProviderControllerErrors wizardReduxID={wizardReduxID} provider={provider} />
        <VMImportProviderControllerStatusRow
          wizardReduxID={wizardReduxID}
          provider={provider}
          id="v2v-vmware-status"
        />
        <VMImportProviderObjectStatus wizardReduxID={wizardReduxID} provider={provider} />
      </>
    );
  }
}

type VMWareImportProviderProps = {
  isVMWare: boolean;
  vmWareData: any;
  wizardReduxID: string;
  onFieldChange: (key: VMWareProviderField, value: any) => void;
};

const stateToProps = (state, { wizardReduxID }) => ({
  isVMWare: isVMWareProvider(state, wizardReduxID),
  vmWareData: iGetVMwareData(state, wizardReduxID),
});

const dispatchToProps = (dispatch, { wizardReduxID }) => ({
  onFieldChange: (key: VMWareProviderField, value: any) =>
    dispatch(
      vmWizardActions[ActionType.UpdateImportProviderField](
        wizardReduxID,
        VMImportProvider.VMWARE,
        key,
        value,
      ),
    ),
});

export const VMWareImportProvider = connect(
  stateToProps,
  dispatchToProps,
)(VMWareImportProviderConnected);
