import * as React from 'react';
import { AsyncComponent } from '@console/internal/components/utils';

const QuickStartDrawerAsync: React.FC = ({ children, ...props }) => (
  <AsyncComponent
    loader={() =>
      import('./QuickStartDrawer' /* webpackChunkName: "quick-start" */).then((c) => c.default)
    }
    {...props}
  >
    {children}
  </AsyncComponent>
);

export default QuickStartDrawerAsync;
