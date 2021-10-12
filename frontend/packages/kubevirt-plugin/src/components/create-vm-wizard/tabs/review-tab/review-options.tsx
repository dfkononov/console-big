import * as React from 'react';
import { Checkbox, Form } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { FormField, FormFieldType } from '../../form/form-field';
import { FormFieldMemoRow } from '../../form/form-field-row';
import { vmWizardActions } from '../../redux/actions';
import { ActionType } from '../../redux/types';
import { iGetVmSettings } from '../../selectors/immutable/vm-settings';
import { VMSettingsField, VMSettingsRenderableField } from '../../types';
import { getFieldId } from '../../utils/renderable-field-utils';
import { getField } from './utils';

import './review-options.scss';

const ReviewOptionsConnected: React.FC<ReviewOptionsConnectedProps> = ({
  onFieldChange,
  iVMSettings,
}) => {
  const { t } = useTranslation();
  const onChange = (key: VMSettingsRenderableField) => (value) => onFieldChange(key, value);

  return (
    <Form>
      <FormFieldMemoRow
        field={getField(VMSettingsField.START_VM, iVMSettings)}
        fieldType={FormFieldType.INLINE_CHECKBOX}
      >
        <FormField>
          <Checkbox
            className="kubevirt-create-vm-modal__start_vm_checkbox"
            id={getFieldId(VMSettingsField.START_VM)}
            onChange={onChange(VMSettingsField.START_VM)}
            label={t('kubevirt-plugin~Start Virtual Machine on Creation')}
          />
        </FormField>
      </FormFieldMemoRow>
    </Form>
  );
};

type ReviewOptionsConnectedProps = {
  onFieldChange: (key: VMSettingsRenderableField, value: string) => void;
  iVMSettings: any;
};

const stateToProps = (state, { wizardReduxID }) => ({
  iVMSettings: iGetVmSettings(state, wizardReduxID),
});

const dispatchToProps = (dispatch, props) => ({
  onFieldChange: (key, value) =>
    dispatch(vmWizardActions[ActionType.SetVmSettingsFieldValue](props.wizardReduxID, key, value)),
});

export const ReviewOptions = connect(stateToProps, dispatchToProps)(ReviewOptionsConnected);
