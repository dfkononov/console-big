import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { Formik, useField, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { SecretType } from '@console/internal/components/secrets/create-secret';
import { ExpandCollapse } from '@console/internal/components/utils';
import { SecretModel } from '@console/internal/models';
import { k8sCreate } from '@console/internal/module/k8s';
import {
  associateServiceAccountToSecret,
  getSecretAnnotations,
} from '../../../../utils/pipeline-utils';
import { SecretAnnotationId } from '../../const';
import SecretForm from './SecretForm';
import SecretsList from './SecretsList';
import { CommonPipelineModalFormikValues } from './types';
import { advancedSectionValidationSchema } from './validation-utils';

import './PipelineSecretSection.scss';

const initialValues = {
  secretName: '',
  annotations: { key: SecretAnnotationId.Image, value: '' },
  type: SecretType.dockerconfigjson,
  formData: {},
};

const PipelineSecretSection: React.FC = () => {
  const { t } = useTranslation();
  const [secretOpenField] = useField<boolean>('secretOpen');
  const {
    setFieldValue,
    values: { namespace },
  } = useFormikContext<CommonPipelineModalFormikValues>();

  const handleSubmit = (values, actions) => {
    const newSecret = {
      apiVersion: SecretModel.apiVersion,
      kind: SecretModel.kind,
      metadata: {
        name: values.secretName,
        namespace,
        annotations: getSecretAnnotations(values.annotations),
      },
      type: values.type,
      stringData: values.formData,
    };
    return k8sCreate(SecretModel, newSecret)
      .then((resp) => {
        setFieldValue(secretOpenField.name, false);
        associateServiceAccountToSecret(
          resp,
          namespace,
          values.annotations.key === SecretAnnotationId.Image,
        );
      })
      .catch((err) => {
        actions.setStatus({ submitError: err.message });
      });
  };

  const handleReset = (values, actions) => {
    actions.resetForm({ values: initialValues, status: {} });
    setFieldValue(secretOpenField.name, false);
  };

  return (
    <ExpandCollapse
      textExpanded={t('pipelines-plugin~Hide credential options')}
      textCollapsed={t('pipelines-plugin~Show credential options')}
    >
      <div className="odc-pipeline-secret-section">
        <p>
          {t(
            'pipelines-plugin~The following secrets are available for all pipelines in this namespace to authenticate to the specified Git server or Image registry:',
          )}
        </p>
        <div className="odc-pipeline-secret-section__secrets">
          <SecretsList namespace={namespace} />
          {secretOpenField.value ? (
            <div className="odc-pipeline-secret-section__secret-form">
              <Formik
                initialValues={initialValues}
                validationSchema={advancedSectionValidationSchema()}
                onSubmit={handleSubmit}
                onReset={handleReset}
              >
                {(formikProps) => <SecretForm {...formikProps} />}
              </Formik>
            </div>
          ) : (
            <Button
              variant="link"
              onClick={() => {
                setFieldValue(secretOpenField.name, true);
              }}
              className="odc-pipeline-secret-section__secret-action"
              icon={<PlusCircleIcon />}
            >
              {t('pipelines-plugin~Add Secret')}
            </Button>
          )}
        </div>
      </div>
    </ExpandCollapse>
  );
};

export default PipelineSecretSection;
