import * as React from 'react';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';

export const FooCard: React.FC = () => (
  <DashboardCard>
    <DashboardCardHeader>
      <DashboardCardTitle>Foo Card</DashboardCardTitle>
    </DashboardCardHeader>
    <DashboardCardBody>
      <div>foo content</div>
    </DashboardCardBody>
  </DashboardCard>
);
