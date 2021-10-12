import { UiSchema } from '@rjsf/core';
import { getSchemaType, getUiOptions } from '@rjsf/core/dist/cjs/utils';
import * as Immutable from 'immutable';
import { JSONSchema7 } from 'json-schema';
import * as _ from 'lodash';
import { THOUSAND, MILLION, BILLION } from './const';
import { DynamicFormSchemaError, JSONSchemaType } from './types';

const UNSUPPORTED_SCHEMA_PROPERTIES = ['allOf', 'anyOf', 'oneOf'];

// Transform a path string to a JSON schema path array
export const stringPathToUISchemaPath = (path: string): string[] =>
  (_.toPath(path) ?? []).map((subPath) => {
    return /^\d+$/.test(subPath) ? 'items' : subPath;
  });

export const useSchemaLabel = (schema: JSONSchema7, uiSchema: UiSchema, defaultLabel?: string) => {
  const options = getUiOptions(uiSchema ?? {});
  const showLabel = options?.label ?? true;
  const label = (options?.title || schema?.title) as string;
  return [showLabel, label || _.startCase(defaultLabel)] as [boolean, string];
};

export const useSchemaDescription = (
  schema: JSONSchema7,
  uiSchema: UiSchema,
  defaultDescription?: string,
) =>
  (getUiOptions(uiSchema ?? {})?.description ||
    schema?.description ||
    defaultDescription) as string;

export const getSchemaErrors = (schema: JSONSchema7): DynamicFormSchemaError[] => {
  return [
    ...(_.isEmpty(schema)
      ? [
          {
            title: 'Empty Schema',
            message: 'Schema is empty.',
          },
        ]
      : []),
    ..._.map(
      _.intersection(_.keys(schema), UNSUPPORTED_SCHEMA_PROPERTIES),
      (unsupportedProperty) => ({
        title: 'Unsupported Property',
        message: `Cannot generate form fields for JSON schema with ${unsupportedProperty} property.`,
      }),
    ),
  ];
};

// Determine if a schema will produce no form fields.
export const hasNoFields = (jsonSchema: JSONSchema7 = {}, uiSchema: UiSchema = {}): boolean => {
  // If schema is empty or has unsupported properties, it will not render any fields on the form
  if (getSchemaErrors(jsonSchema).length > 0) {
    return true;
  }

  const type = getSchemaType(jsonSchema) ?? '';
  const noUIFieldOrWidget = !uiSchema?.['ui:field'] && !uiSchema?.['ui:widget'];
  switch (type) {
    case JSONSchemaType.array:
      return noUIFieldOrWidget && hasNoFields(jsonSchema.items as JSONSchema7, uiSchema?.items);
    case JSONSchemaType.object:
      return (
        noUIFieldOrWidget &&
        _.every(jsonSchema?.properties, (property, propertyName) =>
          hasNoFields(property as JSONSchema7, uiSchema?.[propertyName]),
        )
      );
    case JSONSchemaType.boolean:
    case JSONSchemaType.integer:
    case JSONSchemaType.number:
    case JSONSchemaType.string:
      return false;
    default:
      return noUIFieldOrWidget;
  }
};

// Recursively find the minimum ui:sortOrder property found within this uiSchema or it's children.
const getUISortOrder = (uiSchema: UiSchema, fallback: number): number => {
  return Number(
    uiSchema?.['ui:sortOrder'] ??
      _.min(
        _.keys(uiSchema).map((key) => {
          return !key.includes(':') && _.isObject(uiSchema?.[key])
            ? getUISortOrder(uiSchema?.[key], fallback)
            : fallback;
        }),
      ) ??
      fallback,
  );
};

// Return an array of dependency control field names that exist within uiSchema at the specified
// path.
const getControlFieldsAtPath = (uiSchema: UiSchema, path: string[]): string[] => {
  if (!_.isObject(uiSchema)) {
    return [];
  }
  const { 'ui:dependency': dependency } = uiSchema;
  const dependencyMatchesPath =
    dependency && _.isEqual(dependency.controlFieldPath.slice(0, -1), path ?? []);
  return [
    ...(dependencyMatchesPath ? [dependency.controlFieldName] : []),
    ..._.flatMap(uiSchema, (childUISchema) => getControlFieldsAtPath(childUISchema, path)),
  ];
};

/**
 * Give a property name a sort wieght based on whether it has ui schema, is required, or is a
 * control field for a property with a field dependency. A lower weight means higher sort order.
 * Fields are weighted according to the following tiers:
 *  Tier 1 (negative 10^9 - 10^6 magnitude):  Required fields with ui schema
 *  Tier 2 (negative 10^9 magnitude):         Required fields without ui schema
 *  Tier 3 (negative 10^6 magnitude):         Optional fields with ui schema
 *  Tier 4 (positive 10^3 maginitude):        Control fields that don't fit any above
 *  Tier 5 (Infinity):                        All other fields
 *
 * Within each of the above tiers, fields are further weighted based on field dependency and ui
 * schema defined sort order:
 *   - Fields without dependency: base weight + ui schema sort order
 *   - Control field:             base weight + ui schema sort order * 1000
 *   - Dependent field:           control field weight + ui schema sort order
 *
 * These weight numbers are arbitrary, but spaced far enough apart to prevent collisions.
 */
const getJSONSchemaPropertySortWeight = (
  property: string,
  jsonSchema: JSONSchema7,
  uiSchema: UiSchema,
  currentPath?: string[],
): number => {
  const isRequired = (jsonSchema?.required ?? []).includes(property);
  const propertyUISchema = uiSchema?.[property];

  // All control fields that exist within uiSchema and match this path
  const controlFields = getControlFieldsAtPath(propertyUISchema, currentPath);

  // Any sibling has a dependency with this as the control field.
  const isControlField = _.some(uiSchema, ({ 'ui:dependency': siblingDependency }) =>
    _.isEqual(siblingDependency?.controlFieldPath, [...(currentPath ?? []), property]),
  );

  // Minimum'ui:sortOrder' for this property and it's children. Use propertyNames.length as a fallback,
  // which ensures that properties without a "ui:sortOrder" have highest weight.
  const uiSortOrder = getUISortOrder(propertyUISchema, _.keys(jsonSchema?.properties).length);

  // A small offset that is added to the base weight so that control fields get sorted
  // below other fields in the same 'tier', and allows for depenendt fields to be sorted
  // directly after their control field.
  const controlFieldOffset = isControlField ? uiSortOrder * THOUSAND : 0;

  // Total offset to be added to base tier
  const offset = controlFieldOffset + uiSortOrder;

  // If this property or it's children have a control field at the current path, it's weight is
  // based on the highest weight control field.
  if (controlFields?.length) {
    return (
      Math.max(
        ...controlFields.map((controlField) =>
          getJSONSchemaPropertySortWeight(controlField, jsonSchema, uiSchema, currentPath),
        ),
      ) + offset
    );
  }

  // Tier 1 = -1001000000 (negative one billion one million) + offset
  // Tier 2 = -1000000000 (negagive one billion) + offset
  // Tier 3 = -1000000 (negative one million) + offset
  // Tier 4 = 0 + offset
  // Tier 5 = Infinity
  return (
    // Doesn't meet any sorting criteria, set to infinity
    (!isRequired && !propertyUISchema && !controlFieldOffset ? Infinity : 0) -
    (isRequired ? BILLION : 0) -
    (propertyUISchema ? MILLION : 0) +
    offset
  );
};

// Given a JSONSchema and associated uiSchema, create the appropriate ui schema order property.
// Orders properties according to the following rules:
//  - required properties with an associated ui schema come first,
//  - required properties without an associated ui schema next,
//  - optional fields with an associated ui schema next,
//  - field dependency properties (control then dependent)
//  - all other properties
export const getJSONSchemaOrder = (
  jsonSchema: JSONSchema7,
  uiSchema: UiSchema,
  currentPath?: string[],
) => {
  const type = getSchemaType(jsonSchema ?? {});
  const handleArray = () => {
    const descendantOrder = getJSONSchemaOrder(jsonSchema?.items as JSONSchema7, uiSchema?.items, [
      ...(currentPath ?? []),
      'items',
    ]);
    return !_.isEmpty(descendantOrder) ? { items: descendantOrder } : {};
  };

  const handleObject = () => {
    const propertyNames = _.keys(jsonSchema?.properties ?? {});
    if (_.isEmpty(propertyNames)) {
      return {};
    }

    const uiOrder = Immutable.Set(propertyNames)
      .sortBy((property) =>
        getJSONSchemaPropertySortWeight(property, jsonSchema, uiSchema, currentPath ?? []),
      )
      .toJS();

    return {
      ...(uiOrder.length > 1 && { 'ui:order': uiOrder }),
      ..._.reduce(
        jsonSchema?.properties ?? {},
        (orderAccumulator, propertySchema, propertyName) => {
          const descendantOrder = getJSONSchemaOrder(
            propertySchema as JSONSchema7,
            uiSchema?.[propertyName],
            [...(currentPath ?? []), propertyName],
          );
          if (_.isEmpty(descendantOrder)) {
            return orderAccumulator;
          }
          return {
            ...orderAccumulator,
            [propertyName]: descendantOrder,
          };
        },
        {},
      ),
    };
  };

  switch (type) {
    case JSONSchemaType.array:
      return handleArray();
    case JSONSchemaType.object:
      return handleObject();
    default:
      return {};
  }
};

// Returns true if a value is not nil and is empty
const definedAndEmpty = (value) => !_.isNil(value) && _.isEmpty(value);

// Helper function for prune
// TODO (jon) Make this pure
const pruneRecursive = (current: any, sample: any): any => {
  const valueIsEmpty = (value, key) =>
    _.isNil(value) ||
    _.isNaN(value) ||
    (_.isString(value) && _.isEmpty(value)) ||
    (_.isObject(value) && _.isEmpty(pruneRecursive(value, sample?.[key])));

  // Value should be pruned if it is empty and the correspondeing sample is not explicitly
  // defined as an empty value.
  const shouldPrune = (value, key) => valueIsEmpty(value, key) && !definedAndEmpty(sample?.[key]);

  // Prune each property of current value that meets the pruning criteria
  _.forOwn(current, (value, key) => {
    if (shouldPrune(value, key)) {
      delete current[key];
    }
  });

  // remove any leftover undefined values from the delete operation on an array
  if (_.isArray(current)) {
    _.pull(current, undefined);
  }

  return current;
};

// Deeply remove all empty, NaN, null, or undefined values from an object or array. If a value meets
// the above criteria, but the corresponding sample is explicitly defined as an empty vaolue, it
// will not be pruned.
// Based on https://stackoverflow.com/a/26202058/8895304
export const prune = (obj: any, sample?: any): any => {
  return pruneRecursive(_.cloneDeep(obj), sample);
};
