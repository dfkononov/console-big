import { testHook } from '../../../../../__tests__/utils/hooks-utils';
import { useSearchFilter } from '../useSearchFilter';

jest.mock('../filter-utils', () => ({
  getTopologySearchQuery: jest.fn(),
}));

let mockCurrentSearchQuery = '';

jest.mock('@console/shared', () => {
  const ActualShared = require.requireActual('@console/shared');
  return {
    ...ActualShared,
    useQueryParams: () => new Map().set('searchQuery', mockCurrentSearchQuery),
  };
});

const testUseSearchFilter = (
  text: string | null | undefined,
  searchQuery: string | undefined,
): ReturnType<typeof useSearchFilter> => {
  mockCurrentSearchQuery = searchQuery;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSearchFilter(text);
};

describe('useSearchFilter', () => {
  it('should handle null | undefined text', () => {
    testHook(() => {
      expect(testUseSearchFilter(null, 'test')[0]).toBe(false);
      expect(testUseSearchFilter(null, '')[0]).toBe(false);
      expect(testUseSearchFilter(null, undefined)[0]).toBe(false);
      expect(testUseSearchFilter(undefined, 'test')[0]).toBe(false);
      expect(testUseSearchFilter(undefined, '')[0]).toBe(false);
      expect(testUseSearchFilter(undefined, undefined)[0]).toBe(false);
    });
  });

  it('should fuzzy match text to search query', () => {
    testHook(() => {
      expect(testUseSearchFilter('testing', 'testing')[0]).toBe(true);
      expect(testUseSearchFilter('testing', 'ei')[0]).toBe(true);
      expect(testUseSearchFilter('testing', 'foobar')[0]).toBe(false);
      expect(testUseSearchFilter('testing', 'z')[0]).toBe(false);
      expect(testUseSearchFilter('testing', undefined)[0]).toBe(false);
    });
  });

  it('should match case insensitive', () => {
    testHook(() => {
      expect(testUseSearchFilter('testing', 'TEST')[0]).toBe(true);
      expect(testUseSearchFilter('testing', 'EI')[0]).toBe(true);
    });
  });

  it('should return search query', () => {
    testHook(() => {
      expect(testUseSearchFilter(null, undefined)[1]).toBe(undefined);
      expect(testUseSearchFilter(null, null)[1]).toBe(null);
      expect(testUseSearchFilter(null, 'test')[1]).toBe('test');
    });
  });
});
