/* eslint-disable lines-between-class-members */
import * as _ from 'lodash';
import { DiskBus, DiskType, ObjectEnum } from '../../../constants';
import { ValidationErrorType } from '../../../selectors';
import { CommonTemplatesValidation } from '../../../types/template';
import { isSetEqual } from '../../common';
import { DiskBusValidationResult } from './disk-bus-validation-result';
import {
  IntervalValidationResult,
  MemoryIntervalValidationResult,
} from './interval-validation-result';

export class ValidationJSONPath extends ObjectEnum<string> {
  static readonly CPU = new ValidationJSONPath('jsonpath::.spec.domain.cpu.cores');
  static readonly MEMORY = new ValidationJSONPath(
    'jsonpath::.spec.domain.resources.requests.memory',
  );
  static readonly DISK_BUS = new ValidationJSONPath(
    'jsonpath::.spec.domain.devices.disks[*].disk.bus',
  );
  static readonly CD_BUS = new ValidationJSONPath(
    'jsonpath::.spec.domain.devices.disks[*].cdrom.bus',
  );

  static getDiskBusPath = (diskType: DiskType) =>
    diskType === DiskType.CDROM ? ValidationJSONPath.CD_BUS : ValidationJSONPath.DISK_BUS;
}

export class TemplateValidations {
  public static areBusesEqual = (a: TemplateValidations, b: TemplateValidations) =>
    // eslint-disable-next-line eqeqeq
    a == b || !!a?.areBusesEqual(b); // check if both null first

  private validations: CommonTemplatesValidation[];

  constructor(validations: CommonTemplatesValidation[] = []) {
    this.validations = _.compact(validations);
  }

  validateMemory = (value: number): IntervalValidationResult => {
    const result = this.validateMemoryByType(value, ValidationErrorType.Error);
    if (!result.isValid) {
      return result;
    }

    return this.validateMemoryByType(value, ValidationErrorType.Warn);
  };

  getAllowedBuses = (
    diskType: DiskType,
    validationErrorType: ValidationErrorType = ValidationErrorType.Error,
  ): Set<DiskBus> => {
    const finalDiskType = diskType || DiskType.DISK;

    let allowedBuses: readonly DiskBus[] = this.getAllowedEnumValues(
      ValidationJSONPath.getDiskBusPath(finalDiskType),
      validationErrorType,
    ).map(DiskBus.fromString);

    if (allowedBuses.length === 0) {
      allowedBuses = DiskBus.getAll();
    }

    return new Set(allowedBuses.filter((bus) => finalDiskType.isBusSupported(bus)));
  };

  getRecommendedBuses = (diskType: DiskType): Set<DiskBus> => {
    const allowedBuses = this.getAllowedBuses(diskType);
    const recommendedBuses = [
      ...this.getAllowedBuses(diskType, ValidationErrorType.Warn),
    ].filter((b) => allowedBuses.has(b));
    return recommendedBuses.length === 0 ? allowedBuses : new Set(recommendedBuses);
  };

  areBusesEqual = (otherTempValidations: TemplateValidations): boolean => {
    if (!otherTempValidations) {
      return false;
    }

    if (this === otherTempValidations) {
      return true;
    }

    // Check if two sets of bus validations are the same - if the allowed and recommended buses are the same
    const allowedBuses = this.getAllowedBuses(DiskType.DISK);
    const otherAllowedBuses = otherTempValidations.getAllowedBuses(DiskType.DISK);
    if (!isSetEqual(allowedBuses, otherAllowedBuses)) {
      return false;
    }

    const recommendedBuses = this.getRecommendedBuses(DiskType.DISK);
    const otherRecommendedBuses = otherTempValidations.getRecommendedBuses(DiskType.DISK);
    if (!isSetEqual(recommendedBuses, otherRecommendedBuses)) {
      return false;
    }

    const allowedCDBuses = this.getAllowedBuses(DiskType.CDROM);
    const otherAllowedCDBuses = otherTempValidations.getAllowedBuses(DiskType.CDROM);
    if (!isSetEqual(allowedCDBuses, otherAllowedCDBuses)) {
      return false;
    }

    const recommendedCDBuses = this.getRecommendedBuses(DiskType.CDROM);
    const otherRecommendedCDBuses = otherTempValidations.getRecommendedBuses(DiskType.CDROM);
    if (!isSetEqual(recommendedCDBuses, otherRecommendedCDBuses)) {
      return false;
    }

    return true;
  };

  validateBus = (
    diskType: DiskType,
    diskBus: DiskBus,
    validationErrorType: ValidationErrorType = ValidationErrorType.Error,
  ): DiskBusValidationResult => {
    const allowedBuses = this.getAllowedBuses(diskType);
    if (allowedBuses.has(diskBus)) {
      const recommededBuses = this.getRecommendedBuses(diskType);
      return new DiskBusValidationResult({
        allowedBuses: recommededBuses,
        type: ValidationErrorType.Warn,
        isValid: recommededBuses.has(diskBus),
      });
    }

    return new DiskBusValidationResult({
      allowedBuses,
      type: validationErrorType,
      isValid: allowedBuses.has(diskBus),
    });
  };

  getDefaultBus = (diskType: DiskType = DiskType.DISK, defaultBus?: DiskBus): DiskBus => {
    let resolvedDefaultBus = defaultBus;

    if (!resolvedDefaultBus) {
      resolvedDefaultBus = diskType === DiskType.CDROM ? DiskBus.SATA : DiskBus.VIRTIO;
    }

    if (!diskType.isBusSupported(resolvedDefaultBus)) {
      resolvedDefaultBus = undefined;
      // eslint-disable-next-line no-console
      console.error(`${resolvedDefaultBus} is not a supported disk bus for ${diskType} disks`);
    }

    const allowedBuses = this.getAllowedBuses(diskType);

    if (allowedBuses.size === 0) {
      return resolvedDefaultBus;
    }

    const recommendedBuses = this.getRecommendedBuses(diskType);

    if (resolvedDefaultBus && recommendedBuses.has(resolvedDefaultBus)) {
      return resolvedDefaultBus;
    }

    if (recommendedBuses.size > 0) {
      return [...recommendedBuses][0];
    }

    return resolvedDefaultBus && allowedBuses.has(resolvedDefaultBus)
      ? resolvedDefaultBus
      : [...allowedBuses][0];
  };

  private validateMemoryByType = (
    value: number,
    type: ValidationErrorType,
  ): IntervalValidationResult =>
    new MemoryIntervalValidationResult(
      this.validateInterval(value, ValidationJSONPath.MEMORY, {
        defaultMin: 0,
        isDefaultMinInclusive: false,
        type,
      }),
    );

  private validateInterval = (
    value: number,
    jsonPath: ValidationJSONPath,
    {
      isDefaultMinInclusive = true,
      isDefaultMaxInclusive = true,
      defaultMin = Number.NEGATIVE_INFINITY,
      defaultMax = Number.POSITIVE_INFINITY,
      type = ValidationErrorType.Error,
    },
  ): IntervalValidationResult => {
    const relevantValidations = this.getRelevantValidations(jsonPath, type);

    // combine validations for single template and make them strict (all integer validations must pass)
    const { min, max, isMinInclusive, isMaxInclusive } = relevantValidations.reduce(
      (
        {
          min: oldMin,
          max: oldMax,
          isMinInclusive: oldIsMinInclusive,
          isMaxInclusive: oldIsMaxInclusive,
        },
        validation,
      ) => {
        let newMin = oldMin;
        let newMax = oldMax;
        let newIsMinInclusive = oldIsMinInclusive;
        let newIsMaxInclusive = oldIsMaxInclusive;

        if ('min' in validation && validation.min >= oldMin) {
          newMin = validation.min;
          newIsMinInclusive = true;
        }
        if ('max' in validation && validation.max <= oldMax) {
          newMax = validation.max;
          newIsMaxInclusive = true;
        }
        return {
          min: newMin,
          max: newMax,
          isMinInclusive: newIsMinInclusive,
          isMaxInclusive: newIsMaxInclusive,
        };
      },
      {
        min: defaultMin,
        max: defaultMax,
        isMinInclusive: isDefaultMinInclusive,
        isMaxInclusive: isDefaultMaxInclusive,
      },
    );

    const isValid =
      (isMinInclusive ? min <= value : min < value) &&
      (isMaxInclusive ? value <= max : value < max);

    return new IntervalValidationResult({
      type,
      isValid,
      min,
      max,
      isMinInclusive,
      isMaxInclusive,
    });
  };

  // Empty array means all values are allowed
  private getAllowedEnumValues = (
    jsonPath: ValidationJSONPath,
    type: ValidationErrorType,
  ): string[] => {
    const relevantValidations = this.getRelevantValidations(jsonPath, type);

    return relevantValidations.reduce(
      (result: string[], validation: CommonTemplatesValidation) => result.concat(validation.values),
      [],
    );
  };

  private getRelevantValidations = (jsonPath: ValidationJSONPath, type: ValidationErrorType) => {
    return this.validations.filter(
      (validation: CommonTemplatesValidation) =>
        validation.path.includes(jsonPath.getValue()) &&
        (type === ValidationErrorType.Warn) === !!validation.justWarning,
    );
  };
}
