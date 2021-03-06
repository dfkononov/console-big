import * as React from 'react';
import { RowFunctionArgs, TableData } from '@console/internal/components/factory';
import { asAccessReview, Kebab, KebabOption } from '@console/internal/components/utils';
import { TemplateModel } from '@console/internal/models';
import { PENDING_RESTART_LABEL } from '../../constants';
import { VirtualMachineModel } from '../../models';
import { getDeletetionTimestamp } from '../../selectors';
import { isVM, isVMI } from '../../selectors/check-type';
import { isVMRunningOrExpectedRunning } from '../../selectors/vm/selectors';
import { asVM } from '../../selectors/vm/vm';
import { VMIKind } from '../../types';
import { VMLikeEntityKind } from '../../types/vmLike';
import { DASH, dimensifyRow } from '../../utils';
import { deleteNICModal } from '../modals/delete-nic-modal/delete-nic-modal';
import { nicModalEnhanced } from '../modals/nic-modal/nic-modal-enhanced';
import { ValidationCell } from '../table/validation-cell';
import {
  NetworkBundle,
  NetworkSimpleData,
  NetworkSimpleDataValidation,
  VMNicRowActionOpts,
  VMNicRowCustomData,
} from './types';

const menuActionEdit = (
  nic,
  network,
  vmLikeEntity: VMLikeEntityKind,
  { withProgress }: VMNicRowActionOpts,
): KebabOption => ({
  // t('kubevirt-plugin~Edit')
  labelKey: 'kubevirt-plugin~Edit',
  callback: () =>
    withProgress(
      nicModalEnhanced({
        isEditing: true,
        blocking: true,
        vmLikeEntity,
        nic,
        network,
      }).result,
    ),
  accessReview: asAccessReview(
    isVM(vmLikeEntity) ? VirtualMachineModel : TemplateModel,
    vmLikeEntity,
    'patch',
  ),
});

const menuActionDelete = (
  nic,
  network,
  vmLikeEntity: VMLikeEntityKind,
  { withProgress }: VMNicRowActionOpts,
): KebabOption => ({
  // t('kubevirt-plugin~Delete')
  labelKey: 'kubevirt-plugin~Delete',
  callback: () => withProgress(deleteNICModal({ nic, vmLikeEntity }).result),
  accessReview: asAccessReview(
    isVM(vmLikeEntity) ? VirtualMachineModel : TemplateModel,
    vmLikeEntity,
    'patch',
  ),
});

const getActions = (
  nic,
  network,
  vmLikeEntity: VMLikeEntityKind,
  vmi: VMIKind,
  opts: VMNicRowActionOpts,
) => {
  if (isVMI(vmLikeEntity) || isVMRunningOrExpectedRunning(asVM(vmLikeEntity), vmi)) {
    return [];
  }
  const actions = [menuActionEdit, menuActionDelete];
  return actions.map((a) => a(nic, network, vmLikeEntity, opts));
};

export type VMNicSimpleRowProps = {
  data: NetworkSimpleData;
  validation?: NetworkSimpleDataValidation;
  columnClasses: string[];
  actionsComponent: React.ReactNode;
  isPendingRestart?: boolean;
};

export const NicSimpleRow: React.FC<VMNicSimpleRowProps> = ({
  data: { name, model, networkName, interfaceType, macAddress },
  validation = {},
  columnClasses,
  actionsComponent,
  isPendingRestart,
}) => {
  const dimensify = dimensifyRow(columnClasses);

  return (
    <>
      <TableData className={dimensify()}>
        <ValidationCell
          validation={validation.name}
          additionalLabel={isPendingRestart ? PENDING_RESTART_LABEL : null}
        >
          {name}
        </ValidationCell>
      </TableData>
      <TableData className={dimensify()}>
        <ValidationCell validation={validation.model}>{model || DASH}</ValidationCell>
      </TableData>
      <TableData className={dimensify()}>
        <ValidationCell validation={validation.network}>{networkName || DASH}</ValidationCell>
      </TableData>
      <TableData className={dimensify()}>
        <ValidationCell validation={validation.interfaceType}>
          {interfaceType || DASH}
        </ValidationCell>
      </TableData>
      <TableData className={dimensify()}>
        <ValidationCell validation={validation.macAddress}>{macAddress || DASH}</ValidationCell>
      </TableData>
      <TableData className={dimensify(true)}>{actionsComponent}</TableData>
    </>
  );
};

export const NicRow: React.FC<RowFunctionArgs<NetworkBundle, VMNicRowCustomData>> = ({
  obj: { name, nic, network, ...restData },
  customData: { isDisabled, withProgress, vmLikeEntity, vmi, columnClasses, pendingChangesNICs },
}) => (
  <NicSimpleRow
    data={{ ...restData, name }}
    columnClasses={columnClasses}
    isPendingRestart={!!pendingChangesNICs?.has(name)}
    actionsComponent={
      <Kebab
        options={getActions(nic, network, vmLikeEntity, vmi, { withProgress })}
        isDisabled={
          isDisabled ||
          isVMI(vmLikeEntity) ||
          !!getDeletetionTimestamp(vmLikeEntity) ||
          isVMRunningOrExpectedRunning(asVM(vmLikeEntity), vmi)
        }
        id={`kebab-for-${name}`}
      />
    }
  />
);
