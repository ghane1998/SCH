import React from 'react';

const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

// Local ThemedSelect to avoid exporting/importing from other places
const ThemedSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select 
        {...props} 
        className={`w-full pl-3 pr-10 py-2 text-base border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] ${props.className}`}
        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)', ...props.style }}
    >{props.children}</select>
);

interface DateSelectorProps {
    prefix: string;
    year: string;
    month: string;
    day: string;
    onYearChange: (year: string) => void;
    onMonthChange: (month: string) => void;
    onDayChange: (day: string) => void;
    years: string[];
    className?: string;
}

const DateSelector: React.FC<DateSelectorProps> = ({ prefix, year, month, day, onYearChange, onMonthChange, onDayChange, years, className }) => (
    <div className={`flex gap-2 ${className}`}>
        <ThemedSelect value={year} onChange={(e) => onYearChange(e.target.value)} required>
            <option value="">سال</option>
            {years.map(y => <option key={`${prefix}-year-${y}`} value={y}>{y}</option>)}
        </ThemedSelect>
        <ThemedSelect value={month} onChange={(e) => onMonthChange(e.target.value)} required>
            <option value="">ماه</option>
            {months.map(m => <option key={`${prefix}-month-${m}`} value={m}>{m}</option>)}
        </ThemedSelect>
        <ThemedSelect value={day} onChange={(e) => onDayChange(e.target.value)} required>
            <option value="">روز</option>
            {days.map(d => <option key={`${prefix}-day-${d}`} value={d}>{d}</option>)}
        </ThemedSelect>
    </div>
);

export default DateSelector;
