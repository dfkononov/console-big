export const STORAGE_CLASS_CONFIG_MAP_NAME = 'kubevirt-storage-class-defaults';
// Different releases, different locations. Respect the order when resolving. Otherwise the configMap name/namespace is considered as well-known.
export const STORAGE_CLASS_CONFIG_MAP_NAMESPACES = [
  'kubevirt-hyperconverged',
  'openshift-cnv',
  'openshift',
  'kubevirt-native',
];
export const DEFAULT_SC_ANNOTATION = 'storageclass.kubernetes.io/is-default-class';
