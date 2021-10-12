import * as React from 'react';
import { PopoverPosition } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { NodeDashboardContext } from '@console/app/src/components/nodes/node-dashboard/NodeDashboardContext';
import {
  getUtilizationQueries,
  getResourceQutoaQueries,
  NodeQueries,
} from '@console/app/src/components/nodes/node-dashboard/queries';
import {
  CPUPopover,
  PopoverProps,
  MemoryPopover,
} from '@console/app/src/components/nodes/node-dashboard/UtilizationCard';
import {
  humanizeCpuCores,
  humanizeBinaryBytes,
  Humanize,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { MachineModel } from '@console/internal/models';
import {
  referenceForModel,
  MachineKind,
  MachineHealthCheckKind,
} from '@console/internal/module/k8s';
import { DashboardCardPopupLink } from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import { StatusItem } from '@console/shared/src/components/dashboard/status-card/AlertItem';
import AlertsBody from '@console/shared/src/components/dashboard/status-card/AlertsBody';
import { usePrometheusQuery } from '@console/shared/src/components/dashboard/utilization-card/prometheus-hook';
import {
  LIMIT_STATE,
  LimitRequested,
} from '@console/shared/src/components/dashboard/utilization-card/UtilizationItem';
import {
  YellowResourcesAlmostFullIcon,
  RedResourcesFullIcon,
  YellowExclamationTriangleIcon,
} from '@console/shared/src/components/status/icons';
import {
  getNodeAddresses,
  getNodeMachineNameAndNamespace,
} from '@console/shared/src/selectors/node';
import * as msg from './messages';
import { getMachineHealth, HealthChecksPopup, machineHealthChecksResource } from './NodeHealth';

const LimitLink: React.FC<LimitLinkProps> = ({
  humanize,
  currentKey,
  totalKey,
  limitKey,
  requestedKey,
  limitState,
  requestedState,
  Popover,
}) => {
  const { obj } = React.useContext(NodeDashboardContext);
  const nodeName = obj.metadata.name;
  const nodeIp = getNodeAddresses(obj).find((addr) => addr.type === 'InternalIP')?.address;
  const [queries, resourceQuotaQueries] = React.useMemo(
    () => [getUtilizationQueries(nodeName, nodeIp), getResourceQutoaQueries(nodeName)],
    [nodeIp, nodeName],
  );
  const [current, currentError, currentValue] = usePrometheusQuery(queries[currentKey], humanize);
  const [total, totalError, totalValue] = usePrometheusQuery(queries[totalKey], humanize);
  const [limit, limitError] = usePrometheusQuery(resourceQuotaQueries[limitKey], humanize);
  const [requested, requestedError] = usePrometheusQuery(
    resourceQuotaQueries[requestedKey],
    humanize,
  );
  const { t } = useTranslation();
  const available =
    currentValue && totalValue
      ? humanize(totalValue - currentValue).string
      : t('console-app~Not available');

  return (
    <Popover
      title={t('console-app~See breakdown')}
      nodeName={nodeName}
      nodeIp={nodeIp}
      current={currentError ? t('console-app~Not available') : current.string}
      total={totalError ? t('console-app~Not available') : total.string}
      limit={limitError ? t('console-app~Not available') : limit.string}
      requested={requestedError ? t('console-app~Not available') : requested.string}
      available={available}
      limitState={limitState}
      requestedState={requestedState}
      position={PopoverPosition.right}
    />
  );
};

const getMessage: GetMessage = (
  limitState,
  { limReqErr, limReqWarn, limErr, limWarn, reqWarn },
) => {
  const { limit, requested } = limitState || {};
  if (!limitState || (limit === LIMIT_STATE.OK && requested === LIMIT_STATE.OK)) {
    return null;
  }
  if (limit === LIMIT_STATE.ERROR) {
    return {
      Icon: RedResourcesFullIcon,
      message: requested === LIMIT_STATE.OK ? limErr : limReqErr,
    };
  }
  if (limit === LIMIT_STATE.WARN) {
    return {
      Icon: YellowResourcesAlmostFullIcon,
      message: requested === LIMIT_STATE.OK ? limWarn : limReqWarn,
    };
  }
  return {
    Icon: YellowResourcesAlmostFullIcon,
    message: reqWarn,
  };
};

const HealthChecksLink: React.FC = () => {
  const { obj } = React.useContext(NodeDashboardContext);
  const { name, namespace } = getNodeMachineNameAndNamespace(obj);
  const machineResource = React.useMemo(
    () => ({
      kind: referenceForModel(MachineModel),
      name,
      namespace,
    }),
    [name, namespace],
  );
  const machine = useK8sWatchResource<MachineKind>(machineResource);
  const healthChecks = useK8sWatchResource<MachineHealthCheckKind[]>(machineHealthChecksResource);
  const healthState = getMachineHealth(obj, machine, healthChecks);
  const { t } = useTranslation();
  return (
    <DashboardCardPopupLink
      linkTitle={t('console-app~See details')}
      popupTitle={t('console-app~Health checks')}
      className="co-status-card__popup"
    >
      <HealthChecksPopup
        conditions={healthState.conditions}
        machineHealthChecks={healthState.matchingHC}
      />
    </DashboardCardPopupLink>
  );
};

const NodeAlerts: React.FC = ({ children }) => {
  const { cpuLimit, memoryLimit, healthCheck } = React.useContext(NodeDashboardContext);
  const { t } = useTranslation();

  const cpuMessage = getMessage(cpuLimit, {
    limReqErr: msg.CPU_LIMIT_REQ_ERROR,
    limErr: msg.CPU_LIMIT_ERROR,
    limReqWarn: msg.CPU_LIMIT_REQ_WARN,
    limWarn: msg.CPU_LIMIT_WARN,
    reqWarn: msg.CPU_REQ_WARN,
  });
  const memoryMessage = getMessage(memoryLimit, {
    limReqErr: msg.MEM_LIMIT_REQ_ERROR,
    limErr: msg.MEM_LIMIT_ERROR,
    limReqWarn: msg.MEM_LIMIT_REQ_WARN,
    limWarn: msg.MEM_LIMIT_WARN,
    reqWarn: msg.MEM_REQ_WARN,
  });

  return (
    <AlertsBody>
      {!!healthCheck?.failingHealthCheck && (
        <StatusItem
          Icon={YellowExclamationTriangleIcon}
          message={msg.CONDITIONS_WARNING(healthCheck.reboot)}
        >
          <HealthChecksLink />
        </StatusItem>
      )}
      {!!cpuMessage && (
        <StatusItem
          Icon={cpuMessage.Icon}
          message={t('console-app~{{ cpuMessage }}', { cpuMessage: cpuMessage.message })}
        >
          <LimitLink
            humanize={humanizeCpuCores}
            currentKey={NodeQueries.CPU_USAGE}
            totalKey={NodeQueries.CPU_TOTAL}
            limitKey={NodeQueries.POD_RESOURCE_LIMIT_CPU}
            requestedKey={NodeQueries.POD_RESOURCE_REQUEST_CPU}
            limitState={cpuLimit?.limit}
            requestedState={cpuLimit?.requested}
            Popover={CPUPopover}
          />
        </StatusItem>
      )}
      {!!memoryMessage && (
        <StatusItem
          Icon={memoryMessage.Icon}
          message={t('console-app~{{ memoryMessage }}', { memoryMessage: memoryMessage.message })}
        >
          <LimitLink
            humanize={humanizeBinaryBytes}
            currentKey={NodeQueries.MEMORY_USAGE}
            totalKey={NodeQueries.MEMORY_TOTAL}
            limitKey={NodeQueries.POD_RESOURCE_LIMIT_MEMORY}
            requestedKey={NodeQueries.POD_RESOURCE_REQUEST_MEMORY}
            limitState={memoryLimit?.limit}
            requestedState={memoryLimit?.requested}
            Popover={MemoryPopover}
          />
        </StatusItem>
      )}
      {children}
    </AlertsBody>
  );
};

export default NodeAlerts;

type GetMessage = (
  state: LimitRequested,
  messages: {
    limReqErr: string;
    limErr: string;
    limReqWarn: string;
    limWarn: string;
    reqWarn: string;
  },
) => {
  Icon: React.ComponentType;
  message: string;
};

type LimitLinkProps = {
  humanize: Humanize;
  currentKey: string;
  totalKey: string;
  limitKey: string;
  requestedKey: string;
  limitState: LIMIT_STATE;
  requestedState: LIMIT_STATE;
  Popover: React.ComponentType<PopoverProps>;
};
