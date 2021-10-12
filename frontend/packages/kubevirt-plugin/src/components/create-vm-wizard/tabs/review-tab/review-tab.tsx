import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { vmWizardActions } from '../../redux/actions';
import { ActionType } from '../../redux/types';
import { iGetVmSettings } from '../../selectors/immutable/vm-settings';
import { AdvancedReviewTab } from './advanced-tab';
import { GeneralReview } from './general-tab';
import { NetworkingReview } from './networking-review';
import { ReviewOptions } from './review-options';
import { StorageReview } from './storage-review';

import './review-tab.scss';

export const ReviewTabConnected: React.FC<ReviewTabProps> = (props) => {
  const { t } = useTranslation();
  const { wizardReduxID } = props;

  return (
    <>
      <h2 className="pf-c-title pf-m-xl">
        {t('kubevirt-plugin~Review and confirm your settings')}
      </h2>

      <section className="kubevirt-create-vm-modal__review-tab-section">
        <h3 className="kubevirt-create-vm-modal__review-tab-section__title pf-c-title pf-m-lg">
          {t('kubevirt-plugin~General')}
        </h3>
        <GeneralReview
          wizardReduxID={wizardReduxID}
          className="kubevirt-create-vm-modal__review-tab-section__content"
        />
      </section>

      <section className="kubevirt-create-vm-modal__review-tab-section">
        <h3 className="kubevirt-create-vm-modal__review-tab-section__title pf-c-title pf-m-lg">
          {t('kubevirt-plugin~Networking')}
        </h3>
        <NetworkingReview wizardReduxID={wizardReduxID} />
      </section>

      <section className="kubevirt-create-vm-modal__review-tab-section">
        <h3 className="kubevirt-create-vm-modal__review-tab-section__title pf-c-title pf-m-lg">
          {t('kubevirt-plugin~Storage')}
        </h3>
        <StorageReview wizardReduxID={wizardReduxID} />
      </section>

      <section className="kubevirt-create-vm-modal__review-tab-section">
        <h3 className="kubevirt-create-vm-modal__review-tab-section__title pf-c-title pf-m-lg">
          {t('kubevirt-plugin~Advanced')}
        </h3>
        <AdvancedReviewTab wizardReduxID={wizardReduxID} />
      </section>

      <footer className="kubevirt-create-vm-modal__review-tab__footer">
        <ReviewOptions wizardReduxID={wizardReduxID} />
      </footer>
    </>
  );
};

type ReviewTabProps = {
  vmSettings: any;
  wizardReduxID: string;
};

const stateToProps = (state, { wizardReduxID }) => ({
  vmSettings: iGetVmSettings(state, wizardReduxID),
});

const dispatchToProps = (dispatch, props) => ({
  onFieldChange: (key, value) =>
    dispatch(vmWizardActions[ActionType.SetVmSettingsFieldValue](props.wizardReduxID, key, value)),
});

export const ReviewTab = connect(stateToProps, dispatchToProps)(ReviewTabConnected);
