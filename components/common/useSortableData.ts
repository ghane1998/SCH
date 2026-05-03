import { useState, useMemo } from 'react';

export type SortDirection = 'ascending' | 'descending';

export interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

export const useSortableData = <T extends object>(
  items: T[], 
  initialConfig: SortConfig<T>[] = []
) => {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>[]>(initialConfig);

  const sortedItems = useMemo(() => {
    if (!items || !Array.isArray(items)) return [];
    let sortableItems = [...items];
    if (sortConfig.length > 0) {
      sortableItems.sort((a, b) => {
        for (const config of sortConfig) {
          const aValue = a[config.key];
          const bValue = b[config.key];

          if (aValue === undefined || aValue === null) return 1;
          if (bValue === undefined || bValue === null) return -1;

          let comparison = 0;
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            comparison = aValue.localeCompare(bValue, 'fa');
          } else {
            if (aValue < bValue) comparison = -1;
            if (aValue > bValue) comparison = 1;
          }

          if (comparison !== 0) {
            return config.direction === 'ascending' ? comparison : -comparison;
          }
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: keyof T) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.length === 1 && sortConfig[0].key === key && sortConfig[0].direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig([{ key, direction }]);
  };

  return { items: sortedItems, requestSort, sortConfig };
};