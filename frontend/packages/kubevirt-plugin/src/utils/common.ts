import * as _ from 'lodash';

export const omitEmpty = (obj, justUndefined = false) => {
  const omit = (o) => {
    if (_.isArray(o)) {
      for (let idx = o.length - 1; idx >= 0; idx--) {
        const item = o[idx];
        if (item === undefined || (!justUndefined && item === null)) {
          o.splice(idx, 1);
        } else {
          omit(item);
        }
      }
    } else if (_.isObject(o)) {
      Object.keys(o).forEach((k) => {
        const value = o[k];
        if (value === undefined || (!justUndefined && value === null)) {
          delete o[k];
        } else {
          omit(value);
        }
      });
    }
  };
  omit(obj);
};

export const isSetEqual = (set: Set<any>, otherSet: Set<any>) =>
  set.size === otherSet.size && [...set].every((s) => otherSet.has(s));

export const isUpstream = () => window.SERVER_FLAGS.branding === 'okd';
