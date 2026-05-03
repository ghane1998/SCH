import React from 'react';
import type { SortConfig, SortDirection } from './useSortableData';

interface SortableHeaderProps<T> {
  children: React.ReactNode;
  sortKey: keyof T;
  requestSort: (key: keyof T) => void;
  sortConfig: SortConfig<T>[];
  className?: string;
}

const SortIndicator = ({ direction }: { direction: SortDirection | null }) => {
    if (!direction) return <span className="text-gray-400 opacity-50">↕</span>;
    return direction === 'ascending' ? <span className="text-[var(--primary-500)]">▲</span> : <span className="text-[var(--primary-500)]">▼</span>;
}

export const SortableHeader = <T extends object>({ children, sortKey, requestSort, sortConfig, className }: SortableHeaderProps<T>) => {
  const sortInfo = sortConfig.find(c => c.key === sortKey);
  const direction = sortInfo ? sortInfo.direction : null;
  const sortIndex = sortInfo && sortConfig.length > 1 ? sortConfig.indexOf(sortInfo) + 1 : null;

  return (
    <th className={`cursor-pointer select-none p-0 ${className || ''}`} onClick={() => requestSort(sortKey)}>
      <div className="flex items-center gap-2 px-4 py-3">
        <span>{children}</span>
        {sortIndex && (
          <span 
            className="text-xs font-semibold text-white bg-[var(--primary-400)] rounded-full w-4 h-4 flex items-center justify-center"
            title={`اولویت مرتب‌سازی: ${sortIndex}`}
          >
            {sortIndex}
          </span>
        )}
        <SortIndicator direction={direction} />
      </div>
    </th>
  );
};