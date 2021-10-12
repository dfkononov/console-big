import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { FormFooter } from '@console/shared';
import NamespaceSection from './NamespaceSection';

const CloudShellSetupForm: React.FC<Pick<
  FormikProps<FormikValues>,
  'errors' | 'handleSubmit' | 'handleReset' | 'status' | 'isSubmitting'
>> = ({ errors, handleSubmit, handleReset, status, isSubmitting }) => {
  const { t } = useTranslation();
  return (
    <Form onSubmit={handleSubmit} className="co-m-pane__form">
      <NamespaceSection />
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('console-app~Start')}
        disableSubmit={!_.isEmpty(errors) || isSubmitting}
        resetLabel={t('console-app~Cancel')}
        sticky
      />
    </Form>
  );
};

export default CloudShellSetupForm;
