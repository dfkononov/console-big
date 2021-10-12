import { RootState } from '@console/internal/redux';

export const cloudShellReducerName = 'cloudShell';

export const isCloudShellExpanded = (state: RootState): boolean =>
  !!state.plugins?.console?.[cloudShellReducerName]?.isExpanded;

export const isCloudShellActive = (state: RootState): boolean =>
  !!state.plugins?.console?.[cloudShellReducerName]?.isActive;

export const getCloudShellCommand = (state: RootState): string | null =>
  state.plugins?.console?.[cloudShellReducerName]?.command ?? null;
