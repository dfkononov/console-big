import i18next from 'i18next';
import { omit, merge } from 'lodash';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';
import { baseTemplates } from '@console/internal/models/yaml-templates';
import {
  HorizontalPodAutoscalerKind,
  HPAMetric,
  K8sResourceKind,
  referenceForModel,
} from '@console/internal/module/k8s';
import { LimitsData } from '@console/shared/src';
import { safeJSToYAML, safeYAMLToJS } from '@console/shared/src/utils/yaml';
import { HPAFormValues, SupportedMetricTypes } from './types';

export const VALID_HPA_TARGET_KINDS = ['Deployment', 'DeploymentConfig'];

const getResourceLimitsData = (resource: K8sResourceKind): LimitsData => {
  const container = resource?.spec?.template?.spec?.containers?.find((c) => c.resources.limits);

  return container?.resources?.limits || null;
};
const hasCpuLimits = (limits: LimitsData): boolean => !!limits?.cpu;
export const isCpuUtilizationPossible = (resource: K8sResourceKind): boolean =>
  hasCpuLimits(getResourceLimitsData(resource));
const hasMemoryLimits = (limits: LimitsData): boolean => !!limits?.memory;
export const isMemoryUtilizationPossible = (resource: K8sResourceKind): boolean =>
  hasMemoryLimits(getResourceLimitsData(resource));

export const getLimitWarning = (resource: K8sResourceKind): string => {
  const limits = getResourceLimitsData(resource);

  if (!limits) {
    return i18next.t(
      'devconsole~CPU and memory resource limits must be set if you want to use CPU and memory utilization. The HorizontalPodAutoscaler will not have CPU or memory metrics until resource limits are set.',
    );
  }

  if (!hasCpuLimits(limits)) {
    return i18next.t(
      'devconsole~CPU resource limits must be set if you want to use CPU utilization. The HorizontalPodAutoscaler will not have CPU metrics until resource limits are set.',
    );
  }
  if (!hasMemoryLimits(limits)) {
    return i18next.t(
      'devconsole~Memory resource limits must be set if you want to use memory utilization. The HorizontalPodAutoscaler will not have memory metrics until resource limits are set.',
    );
  }

  return null;
};

const defaultHPAYAML = baseTemplates
  .get(referenceForModel(HorizontalPodAutoscalerModel))
  .get('default');

const getDefaultMetric = (type: SupportedMetricTypes): HPAMetric => ({
  type: 'Resource',
  resource: {
    name: type,
    target: {
      averageUtilization: 0,
      type: 'Utilization',
    },
  },
});

const createScaleTargetRef = (resource: K8sResourceKind) => ({
  apiVersion: resource.apiVersion,
  kind: resource.kind,
  name: resource.metadata.name,
});

export const getFormData = (
  resource: K8sResourceKind,
  existingHPA?: HorizontalPodAutoscalerKind,
): HorizontalPodAutoscalerKind => {
  const hpa: HorizontalPodAutoscalerKind = existingHPA || safeYAMLToJS(defaultHPAYAML);
  if (!existingHPA) {
    // If we are working off the default, zero out cpu metrics to make it easier to use non-cpu metrics with the default
    hpa.spec.metrics = [getDefaultMetric('cpu')];
  }

  return {
    ...hpa,
    spec: {
      ...hpa.spec,
      scaleTargetRef: createScaleTargetRef(resource),
    },
  };
};
export const getYAMLData = (
  resource: K8sResourceKind,
  existingHPA?: HorizontalPodAutoscalerKind,
): string => {
  return safeJSToYAML(getFormData(resource, existingHPA));
};

export const getMetricByType = (
  hpa: HorizontalPodAutoscalerKind,
  type: SupportedMetricTypes,
): { metric: HPAMetric; index: number } => {
  const hpaMetrics = hpa.spec.metrics || [];
  const metricIndex = hpaMetrics.findIndex((m) => m.resource.name?.toLowerCase() === type);
  const metric: HPAMetric = hpaMetrics[metricIndex] || getDefaultMetric(type);

  return { metric, index: metricIndex === -1 ? hpaMetrics.length : metricIndex };
};

export const sanitizeHPAToForm = (
  newFormData: Partial<HorizontalPodAutoscalerKind>,
  resource: K8sResourceKind,
): HorizontalPodAutoscalerKind => {
  // Remove the default metrics as the user may be crafting their own custom ones
  const defaultHPA: HorizontalPodAutoscalerKind = omit(getFormData(resource), 'spec.metrics');
  return merge({}, defaultHPA, newFormData);
};

export const sanityForSubmit = (
  targetResource: K8sResourceKind,
  hpa: HorizontalPodAutoscalerKind,
): HorizontalPodAutoscalerKind => {
  const validHPA = merge(
    {},
    hpa,
    // Make sure it's against _this_ namespace
    { metadata: { namespace: targetResource.metadata.namespace } },
    // Make sure we kept the target we started with
    { spec: { scaleTargetRef: createScaleTargetRef(targetResource) } },
  );

  // Remove empty metrics
  validHPA.spec.metrics = validHPA.spec.metrics?.filter(
    (metric: HPAMetric) =>
      !['cpu', 'memory'].includes(metric?.resource?.name?.toLowerCase()) ||
      (metric.resource.target.type === 'Utilization' &&
        metric.resource.target.averageUtilization > 0),
  );

  return validHPA;
};

export const getInvalidUsageError = (
  hpa: HorizontalPodAutoscalerKind,
  formValues: HPAFormValues,
): string => {
  const lackCPULimits = formValues.disabledFields.cpuUtilization;
  const lackMemoryLimits = formValues.disabledFields.memoryUtilization;
  const metricNames = (hpa.spec.metrics || []).map((metric) =>
    metric.resource?.name?.toLowerCase(),
  );
  const invalidCPU = lackCPULimits && metricNames.includes('cpu');
  const invalidMemory = lackMemoryLimits && metricNames.includes('memory');

  if (metricNames.length === 0) {
    return i18next.t('devconsole~Cannot create a HorizontalPodAutoscaler with no valid metrics.');
  }
  if (invalidCPU && invalidMemory) {
    return i18next.t('devconsole~CPU and memory utilization cannot be used currently.');
  }
  if (invalidCPU) {
    return i18next.t('devconsole~CPU utilization cannot be used currently.');
  }
  if (invalidMemory) {
    return i18next.t('devconsole~Memory utilization cannot be used currently.');
  }

  return null;
};

export const hasCustomMetrics = (hpa?: HorizontalPodAutoscalerKind): boolean => {
  const metrics = hpa?.spec?.metrics;
  if (!metrics) {
    return false;
  }

  return !!metrics.find((metric) => !['cpu', 'memory'].includes(metric?.resource?.name));
};
