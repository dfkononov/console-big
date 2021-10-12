export const FLAG_KNATIVE_SERVING_CONFIGURATION = 'KNATIVE_SERVING_CONFIGURATION';
export const FLAG_KNATIVE_SERVING = 'KNATIVE_SERVING';
export const FLAG_KNATIVE_EVENTING = 'KNATIVE_EVENTING';
export const FLAG_KNATIVE_SERVING_REVISION = 'KNATIVE_SERVING_REVISION';
export const FLAG_KNATIVE_SERVING_ROUTE = 'KNATIVE_SERVING_ROUTE';
export const FLAG_KNATIVE_SERVING_SERVICE = 'KNATIVE_SERVING_SERVICE';
export const KNATIVE_SERVING_LABEL = 'serving.knative.dev/service';
export const KNATIVE_SERVING_APIGROUP = 'serving.knative.dev';
export const KNATIVE_EVENTING_APIGROUP = 'eventing.knative.dev';
export const KNATIVE_EVENT_MESSAGE_APIGROUP = 'messaging.knative.dev';
export const KNATIVE_EVENT_SOURCE_APIGROUP_DEP = 'sources.eventing.knative.dev';
export const KNATIVE_EVENT_SOURCE_APIGROUP = 'sources.knative.dev';
export const CAMEL_APIGROUP = 'camel.apache.org';
export const STRIMZI_KAFKA_APIGROUP = 'kafka.strimzi.io';
export const EVENT_SOURCE_ICON = 'console.openshift.io/icon';
export const CAMEL_KAMELET_ICON = `${CAMEL_APIGROUP}/kamelet.icon`;
export const CAMEL_SOURCE_INTEGRATION = `${CAMEL_APIGROUP}/integration`;
export const FLAG_KNATIVE_EVENTING_BROKER = 'FLAG_KNATIVE_EVENTING_BROKER';
export const FLAG_KNATIVE_EVENTING_CHANNEL = 'FLAG_KNATIVE_EVENTING_CHANNEL';
export const FLAG_CAMEL_KAMELETS = 'FLAG_CAMEL_KAMELETS';
export const CAMEL_K_PROVIDER_ANNOTATION = `${CAMEL_APIGROUP}/provider`;
export const CAMEL_K_TYPE_LABEL = `${CAMEL_APIGROUP}/kamelet.type`;
export const KNATIVE_AUTOSCALING_APIGROUP = 'autoscaling.knative.dev';
export const KNATIVE_MINSCALE_ANNOTATION = `${KNATIVE_AUTOSCALING_APIGROUP}/minScale`;
export const KNATIVE_MAXSCALE_ANNOTATION = `${KNATIVE_AUTOSCALING_APIGROUP}/maxScale`;
export const KNATIVE_CONCURRENCYTARGET_ANNOTATION = `${KNATIVE_AUTOSCALING_APIGROUP}/target`;
export const KNATIVE_CONCURRENCYUTILIZATION_ANNOTATION = `${KNATIVE_AUTOSCALING_APIGROUP}/targetUtilizationPercentage`;
export const KNATIVE_AUTOSCALEWINDOW_ANNOTATION = `${KNATIVE_AUTOSCALING_APIGROUP}/window`;
export const SERVERLESS_FUNCTION_LABEL = 'boson.dev/function';
export const GLOBAL_OPERATOR_NS = 'openshift-operators';