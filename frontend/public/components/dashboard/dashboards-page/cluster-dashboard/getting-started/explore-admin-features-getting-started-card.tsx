import * as React from 'react';
import * as semver from 'semver';
import { useTranslation } from 'react-i18next';
import { FlagIcon } from '@patternfly/react-icons';

import { useOpenShiftVersion } from '@console/shared/src';
import {
  GettingStartedCard,
  GettingStartedLink,
} from '@console/shared/src/components/getting-started';

export const ExploreAdminFeaturesGettingStartedCard: React.FC = () => {
  const { t } = useTranslation();
  const parsed = semver.parse(useOpenShiftVersion());
  // Show only major and minor version.
  const version = parsed ? `${parsed.major}.${parsed.minor}` : '';

  const links: GettingStartedLink[] = [
    {
      id: 'api-explorer',
      title: t('public~API Explorer'),
      href: '/api-explorer',
    },
    {
      id: 'operatorhub',
      title: t('public~OperatorHub'),
      href: '/operatorhub',
    },
  ];

  const moreLink: GettingStartedLink = {
    id: 'whats-new',
    title: t("public~See what's new in OpenShift {{version}}", { version }),
    href: 'https://www.openshift.com/learn/whats-new',
    external: true,
  };

  return (
    <GettingStartedCard
      id="admin-features"
      icon={<FlagIcon color="var(--pf-global--palette--orange-300)" aria-hidden="true" />}
      title={t('public~Explore new admin features')}
      titleColor={'var(--pf-global--palette--gold-700)'}
      description={t('public~Explore new features and resources within the admin perspective.')}
      links={links}
      moreLink={moreLink}
    />
  );
};
