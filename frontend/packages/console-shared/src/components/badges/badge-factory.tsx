import * as React from 'react';
import DevPreviewBadge from './DevPreviewBadge';
import { InlineDevPreviewBadge, InlineTechPreviewBadge } from './InlineBadge';
import TechPreviewBadge from './TechPreviewBadge';

export enum BadgeType {
  DEV = 'Dev Preview',
  TECH = 'Tech Preview',
}

export const getBadgeFromType = (badge: BadgeType): React.ReactElement => {
  switch (badge) {
    case BadgeType.DEV:
      return <DevPreviewBadge />;
    case BadgeType.TECH:
      return <TechPreviewBadge />;
    default:
      return null;
  }
};

export const getInlineBadgeFromType = (badge: BadgeType): React.ReactElement => {
  switch (badge) {
    case BadgeType.DEV:
      return <InlineDevPreviewBadge />;
    case BadgeType.TECH:
      return <InlineTechPreviewBadge />;
    default:
      return null;
  }
};
