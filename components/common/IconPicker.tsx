import React, { useState, useMemo, useEffect, useRef, CSSProperties } from 'react';
import { FixedSizeGrid } from 'react-window';

const ICON_SIZE = 40;
const ICON_MARGIN = 8;
const CELL_SIZE = ICON_SIZE + ICON_MARGIN * 2;

type IconSetId = 'fa' | 'md' | 'bs';

const iconSets: { id: IconSetId; name: string; loader: () => Promise<any> }[] = [
    { id: 'fa', name: 'Font Awesome', loader: () => import('react-icons/fa') },
    { id: 'md', name: 'Material (Google)', loader: () => import('react-icons/md') },
    { id: 'bs', name: 'Bootstrap', loader: () => import('react-icons/bs') },
];

const Cell = ({ columnIndex, rowIndex, style, data }: { columnIndex: number; rowIndex: number; style: CSSProperties; data: any }) => {
    const { filteredIcons, columnCount, onIconSelect, icons } = data;
    const index = rowIndex * columnCount + columnIndex;
    if (index >= filteredIcons.length) {
        return null;
    }
    const iconName = filteredIcons[index];
    const IconComponent = icons[iconName];

    if (!IconComponent) {
        return null;
    }

    const handleClick = () => {
        onIconSelect(iconName);
    };

    return (
        <div style={style}>
            <button
                type="button"
                onClick={handleClick}
                className="w-full h-full flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors"
                title={iconName}
                aria-label={iconName}
            >
                <IconComponent size={ICON_SIZE / 2} className="text-gray-700" />
            </button>
        </div>
    );
};

interface IconPickerProps {
    onIconSelect: (iconName: string) => void;
    onClose: () => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ onIconSelect, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSet, setActiveSet] = useState<IconSetId>('fa');
    const [loadedIcons, setLoadedIcons] = useState<Record<string, React.ComponentType<any>>>({});
    const [loading, setLoading] = useState(true);

    const pickerRef = useRef<HTMLDivElement>(null);
    const gridContainerRef = useRef<HTMLDivElement>(null);
    const [gridSize, setGridSize] = useState({ width: 0, height: 0 });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        setLoading(true);
        const currentSet = iconSets.find(s => s.id === activeSet);
        if (currentSet) {
            currentSet.loader().then(module => {
                setLoadedIcons(module);
                setLoading(false);
            }).catch(err => {
                console.error("Failed to load icon set:", err);
                setLoading(false);
            });
        }
    }, [activeSet]);

    const allIconNames = useMemo(() => Object.keys(loadedIcons), [loadedIcons]);

    const filteredIcons = useMemo(() =>
        allIconNames.filter(name =>
            name.toLowerCase().includes(searchTerm.toLowerCase())
        ), [allIconNames, searchTerm]
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const container = gridContainerRef.current;
        if (!container) return;
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                setGridSize({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        });
        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, [isMobile]);

    const columnCount = Math.max(1, Math.floor(gridSize.width / CELL_SIZE));
    const rowCount = Math.ceil(filteredIcons.length / columnCount);

    const pickerContent = (
        <>
            {isMobile && (
                <div className="flex-shrink-0 flex justify-between items-center mb-3 pb-3 border-b">
                    <h3 className="font-bold text-lg">انتخاب آیکون</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
                </div>
            )}
            <div className="flex-shrink-0">
                <div className="bg-gray-100 p-1 rounded-lg grid grid-cols-3 mb-3">
                    {iconSets.map(set => (
                        <button
                            key={set.id}
                            type="button"
                            onClick={() => {
                                if (activeSet !== set.id) {
                                    setSearchTerm('');
                                    setActiveSet(set.id);
                                }
                            }}
                            className={`px-2 py-1 text-xs sm:text-sm font-semibold rounded-md transition ${activeSet === set.id ? 'bg-white text-[var(--primary-600)] shadow' : 'text-gray-600 hover:bg-white/50'}`}
                        >
                            {set.name}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    placeholder={`جستجو در ${iconSets.find(s => s.id === activeSet)?.name}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 mb-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)]"
                />
            </div>
            <div ref={gridContainerRef} className="flex-grow min-h-0 relative">
                {loading ? (
                     <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-gray-500 animate-pulse">در حال بارگذاری آیکون‌ها...</p>
                    </div>
                ) : gridSize.width > 0 && gridSize.height > 0 && (
                    <FixedSizeGrid
                        columnCount={columnCount}
                        columnWidth={CELL_SIZE}
                        height={gridSize.height}
                        rowCount={rowCount}
                        rowHeight={CELL_SIZE}
                        width={gridSize.width}
                        itemData={{
                            filteredIcons,
                            columnCount,
                            onIconSelect: (iconName: string) => {
                                onIconSelect(iconName);
                                onClose();
                            },
                            icons: loadedIcons,
                        }}
                    >
                        {Cell}
                    </FixedSizeGrid>
                )}
            </div>
        </>
    );

    return (
        <>
            {isMobile && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>}
            <div
                ref={pickerRef}
                className={isMobile
                    ? "fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm h-[80vh] bg-white rounded-lg shadow-2xl p-4 flex flex-col"
                    : "absolute z-50 mt-2 w-96 bg-white rounded-lg shadow-2xl border p-3 flex flex-col"
                }
                style={{ height: isMobile ? '80vh' : '450px' }}
            >
                {pickerContent}
            </div>
        </>
    );
};
