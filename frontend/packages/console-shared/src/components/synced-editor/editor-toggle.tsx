import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RadioGroup } from '@console/internal/components/radio';
import './styles.scss';

export enum EditorType {
  Form = 'form',
  YAML = 'yaml',
}

export const EditorToggle: React.FC<EditorToggleProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="co-synced-editor__editor-toggle">
      <RadioGroup
        label={t('console-shared~Configure via:')}
        currentValue={value}
        inline
        items={[
          {
            value: EditorType.Form,
            title: t('console-shared~Form view'),
          },
          {
            value: EditorType.YAML,
            title: t('console-shared~YAML view'),
          },
        ]}
        onChange={({ currentTarget }) => onChange(currentTarget.value as EditorType)}
      />
    </div>
  );
};

type EditorToggleProps = {
  value: EditorType;
  onChange?: (newValue: EditorType) => void;
};
