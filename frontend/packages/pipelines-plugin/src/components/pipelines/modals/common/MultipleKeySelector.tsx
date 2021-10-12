import * as React from 'react';
import { TextInputTypes, Button, FormGroup, Tooltip, Flex, FlexItem } from '@patternfly/react-core';
import { PlusCircleIcon, MinusCircleIcon } from '@patternfly/react-icons';
import { FieldArray, useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { DropdownField, InputField, getFieldId, useFormikValidationFix } from '@console/shared';
import './MultipleKeySelector.scss';

interface MultipleKeySelectorProps {
  name: string;
  keys: { [key: string]: string };
  addString?: string;
  tooltip?: string;
}

const MultipleKeySelector: React.FC<MultipleKeySelectorProps> = ({
  name,
  keys,
  addString,
  tooltip,
}) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<FormikValues>();
  const items = _.get(values, name, []);
  useFormikValidationFix(items);
  return (
    <FieldArray
      name={name}
      key="multiple-key-selector"
      render={({ push, remove }) => {
        return (
          <FormGroup
            fieldId={getFieldId(name, 'multiple-key-selector')}
            label={t('pipelines-plugin~Items')}
            className="odc-multiple-key-selector"
          >
            {items.length > 0 &&
              items.map((item, index) => {
                const fieldKey = `${name}.${index}.${item.key}`;
                return (
                  <div className="form-group odc-multiple-key-selector__item" key={fieldKey}>
                    <Flex direction={{ default: 'column', lg: 'row' }}>
                      <FlexItem grow={{ default: 'grow' }}>
                        <DropdownField
                          name={`${name}.${index}.key`}
                          title={t('pipelines-plugin~Select a key')}
                          items={keys}
                          fullWidth
                        />
                      </FlexItem>
                      <FlexItem grow={{ default: 'grow' }}>
                        <InputField
                          name={`${name}.${index}.path`}
                          type={TextInputTypes.text}
                          placeholder={t('pipelines-plugin~Enter a path')}
                        />
                      </FlexItem>
                    </Flex>
                    <div className="odc-multiple-key-selector__deleteButton">
                      <Tooltip content={tooltip || t('pipelines-plugin~Remove')}>
                        <MinusCircleIcon aria-hidden="true" onClick={() => remove(index)} />
                      </Tooltip>
                    </div>
                  </div>
                );
              })}
            <Button
              variant="link"
              onClick={() => push({ key: '', path: '' })}
              icon={<PlusCircleIcon />}
              isInline
            >
              {addString || t('pipelines-plugin~Add items')}
            </Button>
          </FormGroup>
        );
      }}
    />
  );
};

export default MultipleKeySelector;
