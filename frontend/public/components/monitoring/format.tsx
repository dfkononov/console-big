import * as _ from 'lodash-es';

import {
  humanizeBinaryBytes,
  humanizeDecimalBytesPerSec,
  humanizeNumber,
  humanizePacketsPerSec,
  humanizeSeconds,
} from '../utils';

export const formatNumber = (s: string, decimals = 2, format = 'short'): string => {
  const value = Number(s);
  if (_.isNil(s) || isNaN(value)) {
    return s || '-';
  }

  switch (format) {
    case 'percentunit':
      return Intl.NumberFormat(undefined, {
        style: 'percent',
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      }).format(value);
    case 'bytes':
      return humanizeBinaryBytes(value).string;
    case 'Bps':
      return humanizeDecimalBytesPerSec(value).string;
    case 'pps':
      return humanizePacketsPerSec(value).string;
    case 'ms':
      return humanizeSeconds(value, 'ms').string;
    case 's':
      return humanizeSeconds(value * 1000, 'ms').string;
    case 'short':
    // fall through
    default:
      return humanizeNumber(value).string;
  }
};
