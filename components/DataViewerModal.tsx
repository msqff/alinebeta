import React, { useState, useMemo } from 'react';
import { Collection, ItemSlot, GalleryAsset, TechPackAsset, ProductReviewAsset, getDisplaySrc, MultiViewAsset } from '../types';

interface DataViewerModalProps {
    collections: Collection[];
    itemSlots: ItemSlot[];
    ideationGalleryItems: GalleryAsset[];
    finalGalleryItems: GalleryAsset[];
    collectionGalleryItems: GalleryAsset[];
    onClose: () => void;
}

interface TableRow {
    id: string;
    collectionName: string;
    collectionId: string;
    slotName: string;
    slotId: string;
    thumbnail: string | undefined;
    tag: string;
    stage: 'Ideation' | 'Final' | 'Collection';
    prompt: string;
    rawData: any;
    designAttributes?: Record<string, string>;
    parentItem?: GalleryAsset;
}

export const DataViewerModal: React.FC<DataViewerModalProps> = ({
    collections,
    itemSlots,
    ideationGalleryItems,
    finalGalleryItems,
    collectionGalleryItems,
    onClose
}) => {
    const [selectedJsonRow, setSelectedJsonRow] = useState<any | null>(null);
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [isItemSlotDropdownOpen, setIsItemSlotDropdownOpen] = useState(false);

    const handleFilterChange = (col: string, val: string) => {
        setFilters(prev => ({ ...prev, [col]: val }));
    };

    const rows = useMemo(() => {
        let allItems: TableRow[] = [];
        
        const allAssets = [...ideationGalleryItems, ...finalGalleryItems, ...collectionGalleryItems];
        const assetMap = new Map(allAssets.map(a => [a.id, a]));

        const processItems = (items: GalleryAsset[], stage: TableRow['stage']) => {
            items.forEach(item => {
                const collection = collections.find(c => c.id === item.collectionId);
                const slot = itemSlots.find(s => s.id === item.itemSlotId);
                const parentItem = item.parentId ? assetMap.get(item.parentId) : undefined;
                
                allItems.push({
                    id: item.id,
                    collectionName: collection ? collection.name : 'Unknown Collection',
                    collectionId: item.collectionId || '',
                    slotName: slot ? slot.name : (stage === 'Collection' ? 'Collection Level' : 'Unknown Slot'),
                    slotId: item.itemSlotId || '',
                    thumbnail: getDisplaySrc((item as any).source) || (item as any).src,
                    tag: item.tag,
                    stage: stage,
                    prompt: (item as any).prompt || '',
                    rawData: item,
                    designAttributes: (item as any).designAttributes,
                    parentItem: parentItem
                });
            });
        };

        processItems(ideationGalleryItems, 'Ideation');
        processItems(finalGalleryItems, 'Final');
        processItems(collectionGalleryItems, 'Collection');

        // Apply filters
        if (filters.collection) {
            allItems = allItems.filter(r => r.collectionName.toLowerCase().includes(filters.collection.toLowerCase()) || (filters.collection === 'all'));
        }
        if (filters.stage && filters.stage !== 'all') {
            allItems = allItems.filter(r => r.stage.toLowerCase() === filters.stage.toLowerCase());
        }
        if (filters.type && filters.type !== 'all') {
            allItems = allItems.filter(r => r.tag.toLowerCase() === filters.type.toLowerCase());
        }
        if (filters.itemSlot) {
            allItems = allItems.filter(r => r.slotName.toLowerCase().includes(filters.itemSlot.toLowerCase()));
        }
        if (filters.context) {
            allItems = allItems.filter(r => r.prompt.toLowerCase().includes(filters.context.toLowerCase()));
        }

        // Sort by collectionId, then slotId, then stage
        allItems.sort((a, b) => {
            if (a.collectionId !== b.collectionId) {
                return a.collectionId.localeCompare(b.collectionId);
            }
            if (a.slotId !== b.slotId) {
                return a.slotId.localeCompare(b.slotId);
            }
            return a.stage.localeCompare(b.stage);
        });

        return allItems;
    }, [collections, itemSlots, ideationGalleryItems, finalGalleryItems, collectionGalleryItems, filters]);

    // Compute alternate background for slots
    const rowsWithStyles = useMemo(() => {
        let currentSlotId: string | null = null;
        let useAlternateBg = false;

        return rows.map((row) => {
            if (row.slotId !== currentSlotId) {
                useAlternateBg = !useAlternateBg;
                currentSlotId = row.slotId;
            }
            return {
                ...row,
                useAlternateBg
            };
        });
    }, [rows]);

    const getPayloadPillText = (row: TableRow) => {
        if (row.tag === 'Tech Pack') {
            const data = (row.rawData as TechPackAsset).data || [];
            return `[Tech Pack: ${data.length} Sections]`;
        }
        if (row.tag === 'Product Review') {
             const data = (row.rawData as ProductReviewAsset).data;
             const issuesNum = (data?.legal_audit?.issues?.length || 0) + (data?.safety_audit?.issues?.length || 0) + (data?.fabrication_audit?.issues?.length || 0);
             return `[Audit: ${issuesNum} Issues]`;
        }
        return '[Asset Data]';
    };
    
    // Extract unique values for dropdowns
    const uniqueCollections = Array.from(new Set(collections.map(c => c.name)));
    const uniqueTypes = Array.from(new Set(ideationGalleryItems.concat(finalGalleryItems).concat(collectionGalleryItems).map(r => r.tag)));
    const uniqueSlots = Array.from(new Set(['Collection Level', ...itemSlots.map(s => s.name)]));

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl flex flex-col font-sans">
            {/* Header */}
             <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900">
                <div className="flex items-center space-x-6 w-full">
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center">
                        <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mr-3 border border-indigo-500/30 font-mono text-sm">
                           {'{}'}
                        </span>
                        Data Viewer
                    </h2>
                </div>

                <div className="flex items-center justify-end w-48">
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
            
            {/* Table */}
            <div className="flex-1 overflow-auto p-6 flex">
                 <div className={`flex-1 transition-all duration-300 ${selectedJsonRow ? 'pr-96 mr-6' : ''}`}>
                    <div className="rounded-xl border border-white/10 overflow-hidden bg-slate-900">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider sticky top-0  backdrop-blur-md z-10">
                                <tr className="border-b border-white/10">
                                    <th className="px-6 py-4 font-bold">Collection</th>
                                    <th className="px-6 py-4 font-bold">Item / Slot</th>
                                    <th className="px-6 py-4 font-bold">Image</th>
                                    <th className="px-6 py-4 font-bold">Source</th>
                                    <th className="px-6 py-4 font-bold">Type</th>
                                    <th className="px-6 py-4 font-bold">Stage</th>
                                    <th className="px-6 py-4 font-bold w-64">Context (Prompt)</th>
                                    <th className="px-6 py-4 font-bold">Design Attributes</th>
                                    <th className="px-6 py-4 font-bold text-right">Data Payload</th>
                                </tr>
                                <tr className="border-b border-white/10 bg-slate-900/50">
                                    <th className="px-4 py-2">
                                        <select 
                                            value={filters.collection || 'all'}
                                            onChange={e => handleFilterChange('collection', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="all">All</option>
                                            {uniqueCollections.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </th>
                                    <th className="px-4 py-2 relative">
                                        <input 
                                            type="text" 
                                            placeholder="Filter..." 
                                            value={filters.itemSlot || ''}
                                            onChange={e => {
                                                handleFilterChange('itemSlot', e.target.value);
                                                setIsItemSlotDropdownOpen(true);
                                            }}
                                            onFocus={() => setIsItemSlotDropdownOpen(true)}
                                            onBlur={() => setTimeout(() => setIsItemSlotDropdownOpen(false), 200)}
                                            className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                                        />
                                        {isItemSlotDropdownOpen && (
                                            <div className="absolute top-full left-4 mt-1 w-64 bg-slate-800 border border-slate-700 rounded-md shadow-xl max-h-60 overflow-y-auto z-[300]">
                                                {uniqueSlots.filter(s => s.toLowerCase().includes((filters.itemSlot || '').toLowerCase())).length > 0 ? (
                                                    uniqueSlots.filter(s => s.toLowerCase().includes((filters.itemSlot || '').toLowerCase())).map(s => (
                                                        <div 
                                                            key={s} 
                                                            className="px-3 py-2 text-xs text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-300 cursor-pointer border-b border-white/5 last:border-0"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault(); // Prevent onBlur from running before onClick
                                                                handleFilterChange('itemSlot', s);
                                                                setIsItemSlotDropdownOpen(false);
                                                            }}
                                                        >
                                                            {s}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-2 text-xs text-slate-500 italic">No matches</div>
                                                )}
                                            </div>
                                        )}
                                    </th>
                                    <th className="px-4 py-2"></th>
                                    <th className="px-4 py-2"></th>
                                    <th className="px-4 py-2">
                                        <select 
                                            value={filters.type || 'all'}
                                            onChange={e => handleFilterChange('type', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="all">All</option>
                                            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </th>
                                    <th className="px-4 py-2">
                                        <select 
                                            value={filters.stage || 'all'}
                                            onChange={e => handleFilterChange('stage', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="all">All</option>
                                            <option value="ideation">Ideation</option>
                                            <option value="final">Final</option>
                                            <option value="collection">Collection</option>
                                        </select>
                                    </th>
                                    <th className="px-4 py-2">
                                        <input 
                                            type="text" 
                                            placeholder="Filter..." 
                                            value={filters.context || ''}
                                            onChange={e => handleFilterChange('context', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                                        />
                                    </th>
                                    <th className="px-4 py-2"></th>
                                    <th className="px-4 py-2"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {rowsWithStyles.map((row, index) => {
                                    const prevRow = index > 0 ? rowsWithStyles[index - 1] : null;
                                    const isCollectionBreak = row.collectionId && prevRow && row.collectionId !== prevRow.collectionId;
                                    
                                    return (
                                        <React.Fragment key={row.id}>
                                            {isCollectionBreak && (
                                                <tr className="border-b-2 border-indigo-500/50 bg-slate-950/60">
                                                    <td colSpan={9} className="h-1 py-0"></td>
                                                </tr>
                                            )}
                                            <tr className={`hover:bg-slate-700/50 transition-colors ${row.useAlternateBg ? 'bg-slate-800/30' : 'bg-transparent'}`}>
                                                <td className="px-6 py-3 text-sm text-slate-300 font-medium">{row.collectionName}</td>
                                                <td className="px-6 py-3 text-sm text-slate-400">{row.slotName}</td>
                                                <td className="px-6 py-3">
                                                    {row.tag === 'Multi-View' && row.rawData.views ? (
                                                        <div className="grid grid-cols-2 gap-px w-10 h-10 overflow-hidden rounded bg-slate-800">
                                                            {row.rawData.views.slice(0, 4).map((view: any, i: number) => (
                                                                <img key={i} src={getDisplaySrc(view.source)} className="w-full h-full object-cover" />
                                                            ))}
                                                        </div>
                                                    ) : row.thumbnail ? (
                                                        <img src={row.thumbnail} alt={row.tag} className="w-10 h-10 object-cover rounded border border-slate-700 bg-slate-800" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded bg-slate-800/50 border border-slate-700 flex items-center justify-center">
                                                            <span className="text-xs text-slate-500">N/A</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3">
                                                    {row.parentItem && (
                                                        <div className="flex items-center text-slate-400 text-xs">
                                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                                            {(getDisplaySrc((row.parentItem as any).source) || (row.parentItem as any).src) && 
                                                                <img src={getDisplaySrc((row.parentItem as any).source) || (row.parentItem as any).src} className="w-5 h-5 object-cover rounded mr-2 opacity-80" />
                                                            }
                                                            <span className="opacity-70">{row.parentItem.tag}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-sm text-slate-300">{row.tag}</td>
                                                <td className="px-6 py-3 text-sm text-slate-400">
                                                    <span className={`px-2 py-1 flex-inline justify-center w-24 text-center rounded text-xs border ${row.stage === 'Ideation' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : row.stage === 'Final' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                                        {row.stage}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-sm text-slate-400 max-w-xs truncate overflow-hidden" title={row.prompt}>
                                                    {row.prompt || <span className="text-slate-600 italic">No prompt</span>}
                                                </td>
                                                <td className="px-6 py-3">
                                                    {row.designAttributes && Object.keys(row.designAttributes).length > 0 ? (
                                                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                            {Object.entries(row.designAttributes).map(([key, value]) => (
                                                                <span key={key} className="text-[9px] bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-slate-300 whitespace-nowrap">
                                                                    {key}: {value}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : <span className="text-xs text-slate-600">-</span>}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <button 
                                                        onClick={() => setSelectedJsonRow(row.rawData)}
                                                        className="inline-flex items-center justify-center min-w-[140px] px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-full text-xs font-semibold transition-colors border border-indigo-500/30"
                                                    >
                                                        {getPayloadPillText(row)}
                                                    </button>
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    );
                                })}
                                {rows.length === 0 && (
                                     <tr>
                                         <td colSpan={9} className="px-6 py-12 text-center text-slate-500 text-sm">
                                             No data available to display.
                                         </td>
                                     </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Slide-out Drawer */}
             {selectedJsonRow && (
                <div className="fixed top-0 right-0 bottom-0 w-[500px] bg-slate-900 border-l border-white/10 shadow-2xl flex flex-col z-[210] transform transition-transform duration-300 translate-x-0">
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-950/50">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Raw Asset Data</h3>
                            <button onClick={() => setSelectedJsonRow(null)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4 bg-[#0d1117]">
                             <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap break-all leading-relaxed">
                                 {JSON.stringify(selectedJsonRow, null, 2)}
                             </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

