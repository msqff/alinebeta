import React, { useState, useMemo } from 'react';
import { Collection, ItemSlot, GalleryAsset, TechPackAsset, ProductReviewAsset, getDisplaySrc } from '../types';

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
    const [filterCollectionId, setFilterCollectionId] = useState<string>('all');
    const [filterStage, setFilterStage] = useState<string>('all');

    const rows = useMemo(() => {
        let allItems: TableRow[] = [];

        const processItems = (items: GalleryAsset[], stage: TableRow['stage']) => {
            items.forEach(item => {
                const collection = collections.find(c => c.id === item.collectionId);
                const slot = itemSlots.find(s => s.id === item.itemSlotId);
                
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
                    rawData: item
                });
            });
        };

        processItems(ideationGalleryItems, 'Ideation');
        processItems(finalGalleryItems, 'Final');
        processItems(collectionGalleryItems, 'Collection');

        // Apply filters
        if (filterCollectionId !== 'all') {
            allItems = allItems.filter(r => r.collectionId === filterCollectionId);
        }
        if (filterStage !== 'all') {
            allItems = allItems.filter(r => r.stage.toLowerCase() === filterStage.toLowerCase());
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
    }, [collections, itemSlots, ideationGalleryItems, finalGalleryItems, collectionGalleryItems, filterCollectionId, filterStage]);

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
                    
                    <div className="flex space-x-4">
                        <select 
                            value={filterCollectionId}
                            onChange={e => setFilterCollectionId(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-sm text-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                            <option value="all">All Collections</option>
                            {collections.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        
                        <select 
                            value={filterStage}
                            onChange={e => setFilterStage(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-sm text-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                            <option value="all">All Stages</option>
                            <option value="ideation">Ideation</option>
                            <option value="final">Final</option>
                            <option value="collection">Collection</option>
                        </select>
                    </div>
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
                            <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider sticky top-0  backdrop-blur-md z-10 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Collection</th>
                                    <th className="px-6 py-4 font-bold">Item / Slot</th>
                                    <th className="px-6 py-4 font-bold">Image</th>
                                    <th className="px-6 py-4 font-bold">Type</th>
                                    <th className="px-6 py-4 font-bold">Stage</th>
                                    <th className="px-6 py-4 font-bold w-1/3">Context (Prompt)</th>
                                    <th className="px-6 py-4 font-bold text-right">Data Payload</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {rowsWithStyles.map((row, index) => {
                                    const prevRow = index > 0 ? rowsWithStyles[index - 1] : null;
                                    const isCollectionBreak = prevRow && row.collectionId !== prevRow.collectionId;
                                    
                                    return (
                                        <React.Fragment key={row.id}>
                                            {isCollectionBreak && (
                                                <tr className="border-b-2 border-indigo-500/50 bg-slate-950/60">
                                                    <td colSpan={7} className="h-1 py-0"></td>
                                                </tr>
                                            )}
                                            <tr className={`hover:bg-slate-700/50 transition-colors ${row.useAlternateBg ? 'bg-slate-800/30' : 'bg-transparent'}`}>
                                                <td className="px-6 py-3 text-sm text-slate-300 font-medium">{row.collectionName}</td>
                                                <td className="px-6 py-3 text-sm text-slate-400">{row.slotName}</td>
                                                <td className="px-6 py-3">
                                                    {row.thumbnail ? (
                                                        <img src={row.thumbnail} alt={row.tag} className="w-10 h-10 object-cover rounded border border-slate-700 bg-slate-800" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded bg-slate-800/50 border border-slate-700 flex items-center justify-center">
                                                            <span className="text-xs text-slate-500">N/A</span>
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
                                         <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">
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
                <div className="fixed top-0 right-0 bottom-0 w-96 bg-slate-900 border-l border-white/10 shadow-2xl flex flex-col z-[210] transform transition-transform duration-300 translate-x-0">
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
                             <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all leading-relaxed">
                                 {JSON.stringify(selectedJsonRow, null, 2)}
                             </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
