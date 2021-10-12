import { convertToBaseValue } from '@console/internal/components/utils';
import { VolumeSnapshotKind } from '@console/internal/module/k8s';

export const snapshotSize = (snapshot: VolumeSnapshotKind): number => {
  const size = snapshot?.status?.restoreSize;
  return size ? convertToBaseValue(size) : 0;
};

export const snapshotSource = (snapshot: VolumeSnapshotKind): string =>
  snapshot.spec?.source?.persistentVolumeClaimName ??
  snapshot.spec?.source?.volumeSnapshotContentName;
