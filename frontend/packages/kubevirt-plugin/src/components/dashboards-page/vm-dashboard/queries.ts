import * as _ from 'lodash';

export enum VMQueries {
  CPU_USAGE = 'CPU_USAGE',
  MEMORY_USAGE = 'MEMORY_USAGE',
  FILESYSTEM_USAGE = 'FILESYSTEM_USAGE',
  FILESYSTEM_READ_USAGE = 'FILESYSTEM_READ_USAGE',
  FILESYSTEM_WRITE_USAGE = 'FILESYSTEM_WRITE_USAGE',
  NETWORK_USAGE = 'NETWORK_USAGE',
  NETWORK_IN_USAGE = 'NETWORK_IN_USAGE',
  NETWORK_OUT_USAGE = 'NETWORK_OUT_USAGE',
}

const queries = {
  // We don't set namespace explicitly in the PromQL template because it is
  // being injected anyway by prom-label-proxy when we query Thanos.
  [VMQueries.CPU_USAGE]: _.template(
    // TODO verify; use seconds or milicores?
    // `kubevirt_vmi_vcpu_seconds{exported_namespace='<%= namespace %>',name='<%= vmName %>'}`,
    `pod:container_cpu_usage:sum{pod='<%= launcherPodName %>'}`,
  ),
  [VMQueries.MEMORY_USAGE]: _.template(`kubevirt_vmi_memory_resident_bytes{name='<%= vmName %>'}`),
  [VMQueries.FILESYSTEM_READ_USAGE]: _.template(
    `sum(kubevirt_vmi_storage_read_traffic_bytes_total{name='<%= vmName %>'})`,
  ),
  [VMQueries.FILESYSTEM_WRITE_USAGE]: _.template(
    `sum(kubevirt_vmi_storage_write_traffic_bytes_total{name='<%= vmName %>'})`,
  ),
  [VMQueries.NETWORK_IN_USAGE]: _.template(
    `sum(kubevirt_vmi_network_receive_bytes_total{name='<%= vmName %>'})`,
  ),
  [VMQueries.NETWORK_OUT_USAGE]: _.template(
    `sum(kubevirt_vmi_network_transmit_bytes_total{name='<%= vmName %>'})`,
  ),
};

export const getUtilizationQueries = (props: { vmName: string; launcherPodName?: string }) => ({
  [VMQueries.CPU_USAGE]: queries[VMQueries.CPU_USAGE](props),
  [VMQueries.MEMORY_USAGE]: queries[VMQueries.MEMORY_USAGE](props),
});

export const getMultilineUtilizationQueries = (props: {
  vmName: string;
  launcherPodName?: string;
}) => ({
  [VMQueries.FILESYSTEM_USAGE]: [
    {
      query: queries[VMQueries.FILESYSTEM_READ_USAGE](props),
      desc: 'read',
    },
    {
      query: queries[VMQueries.FILESYSTEM_WRITE_USAGE](props),
      desc: 'write',
    },
  ],
  [VMQueries.NETWORK_USAGE]: [
    {
      query: queries[VMQueries.NETWORK_IN_USAGE](props),
      desc: 'in',
    },
    {
      query: queries[VMQueries.NETWORK_OUT_USAGE](props),
      desc: 'out',
    },
  ],
});
