import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ItemSlot, GalleryAsset, Collection, getDisplaySrc } from '../types';
import { generateItemSuggestions } from '../services/geminiService';

import { CollectionVisualizerModal } from './CollectionVisualizerModal';
import { DesignAssistantPanel } from './DesignAssistantPanel';

interface ItemManagerProps {
    slots: ItemSlot[];
    assets: GalleryAsset[]; // All assets in this collection
    finalAssets: GalleryAsset[]; // Final assets in this collection
    onAddItem: (name: string) => void;
    onSelectItem: (slotId: string, type: 'sketch' | 'studio' | 'techpack') => void;
    onOpenTool: (tool: 'sketch' | 'visualiser' | 'techpack', slotId: string, variantId?: string) => void;
    onEnterItem: (slotId: string) => void;
    onRenameItemSlot: (slotId: string, newName: string) => void;
    onDeleteItemSlot: (slotId: string) => void;
    onDuplicateItem?: (item: GalleryAsset) => void;
    onGenerateRangeVisual?: (base64Image: string, prompt: string) => void;
    onShowTraceability: (item: GalleryAsset) => void;
    collection: Collection;
    onReorderItemSlot?: (slotId: string, direction: 'left' | 'right') => void;
    onSaveCopilotAsset: (imageUrl: string, gallery: 'ideation' | 'final', type: 'Sketch' | 'Studio Image', parentId: string, prompt?: string, designAttributes?: Record<string, string>) => Promise<void>;
    onApplyCopilotTechPack: (itemId: string, newAttributes: any) => void;
}

const suggestionsCache: Record<string, { name: string; reasoning: string }[]> = {};

export const ItemManager: React.FC<ItemManagerProps> = ({ slots, assets, finalAssets, onAddItem, onSelectItem, onOpenTool, onEnterItem, onRenameItemSlot, onDeleteItemSlot, onDuplicateItem, onGenerateRangeVisual, onShowTraceability, collection, onReorderItemSlot, onSaveCopilotAsset, onApplyCopilotTechPack }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [suggestedItems, setSuggestedItems] = useState<{ name: string; reasoning: string }[]>(suggestionsCache[collection.id] || []);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [slotToDelete, setSlotToDelete] = useState<ItemSlot | null>(null);
    const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
    const [copilotAsset, setCopilotAsset] = useState<GalleryAsset | null>(null);

    // Fetch suggestions on mount or when slot count changes significantly (though we mostly want stable suggestions)
    useEffect(() => {
        if (suggestionsCache[collection.id]) {
            setSuggestedItems(suggestionsCache[collection.id]);
            return; // Use cached suggestions for this session
        }

        const fetchSuggestions = async () => {
            setIsLoadingSuggestions(true);
            try {
                // Get existing names to avoid duplicates
                const existingNames = slots.map(s => s.name);
                const suggestions = await generateItemSuggestions(collection.name, collection.styleDna, existingNames);
                const topSuggestions: { name: string; reasoning: string }[] = suggestions.slice(0, 3).map(s => ({
                    name: s.name,
                    reasoning: (s as any).reasoning || s.description || ''
                }));
                setSuggestedItems(topSuggestions); // Keep top 3
                suggestionsCache[collection.id] = topSuggestions;
            } catch (e) {
                console.error("Failed to fetch suggestions in manager", e);
            } finally {
                setIsLoadingSuggestions(false);
            }
        };

        fetchSuggestions();
    }, [collection.id, collection.name, collection.styleDna]); // Run when collection changes


    // Helper to find asset by ID
    const getAsset = (id?: string) => assets.find(a => a.id === id);

const ItemSlotCard: React.FC<{
    slot: ItemSlot;
    assets: GalleryAsset[];
    finalAssets: GalleryAsset[];
    onEnterItem: (id: string) => void;
    onRenameItemSlot: (id: string, newName: string) => void;
    onDuplicateItem?: (item: GalleryAsset) => void;
    onDeleteItemSlot: (id: string) => void;
    onSelectItem: (slotId: string, type: 'sketch' | 'studio' | 'techpack') => void;
    onOpenTool: (tool: 'sketch' | 'visualiser' | 'techpack', slotId: string, variantId?: string) => void;
    onOpenCopilot: (asset: GalleryAsset) => void;
    onReorderItemSlot?: (id: string, direction: 'left' | 'right') => void;
    isFirst?: boolean;
    isLast?: boolean;
}> = ({ slot, assets, finalAssets, onEnterItem, onRenameItemSlot, onDuplicateItem, onDeleteItemSlot, onSelectItem, onOpenTool, onOpenCopilot, onReorderItemSlot, isFirst, isLast }) => {
    const getAsset = (id?: string) => assets.find(a => a.id === id);
    const reversedFinalAssets = [...finalAssets].reverse();
    
    // Find tech pack
    const finalTechpack = reversedFinalAssets.find(a => a.itemSlotId === slot.id && a.tag === 'Tech Pack');
    const techpack = finalTechpack || getAsset(slot.techPackId);
    
    // Filter root vs children for THIS slot
    const slotAssets = [...assets, ...finalAssets].filter(a => a.itemSlotId === slot.id && ['Studio Image', 'Sketch', 'Model Shot'].includes(a.tag));
    
    // Unique deduplication since items might be in both assets (ideation) and finalAssets
    const uniqueSlotAssets = Array.from(new Map(slotAssets.map(item => [item.id, item])).values());
    
    // Find all Final Render Studio Images for this slot
    const finalStudioAssets = uniqueSlotAssets.filter(a => a.tag === 'Studio Image' && finalAssets.some(fa => fa.id === a.id));
    
    // Determine the initial hero asset based on requirements
    let initialHeroAsset: GalleryAsset | undefined = undefined;
    if (finalStudioAssets.length > 0) {
        // Show the most recent Final Render Studio Image
        initialHeroAsset = finalStudioAssets[finalStudioAssets.length - 1];
    } else if (uniqueSlotAssets.length > 0) {
        // Show the most recent image asset created
        initialHeroAsset = uniqueSlotAssets[uniqueSlotAssets.length - 1];
    }
    
    const finalRenderStudioCount = finalStudioAssets.length;
    
    const [activeVariantId, setActiveVariantId] = useState<string | undefined>(initialHeroAsset?.id);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(slot.name);
    
    const handleRenameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editedName.trim() && editedName !== slot.name) {
            onRenameItemSlot(slot.id, editedName.trim());
        }
        setIsEditingName(false);
    };

    // Maintain sync if initialHeroAsset changes externally
    useEffect(() => {
        if (initialHeroAsset?.id) {
             setActiveVariantId(prev => uniqueSlotAssets.find(a => a.id === prev) ? prev : initialHeroAsset.id);
        }
    }, [initialHeroAsset?.id, uniqueSlotAssets.length]);

    const activeAsset = uniqueSlotAssets.find(a => a.id === activeVariantId) || initialHeroAsset;
    
    // Show all image assets for this slot in order of creation
    const variants = uniqueSlotAssets;

    const heroType = activeAsset?.tag === 'Studio Image' ? 'studio' : 'sketch';

    const isFinalRender = activeAsset ? finalAssets.some(a => a.id === activeAsset.id && a.tag === 'Studio Image') : false;
    const isFinalSketch = activeAsset ? finalAssets.some(a => a.id === activeAsset.id && a.tag === 'Sketch') : false;
    
    const heroLabel = heroType === 'studio' 
        ? (isFinalRender ? 'Final Render' : 'Draft Render') 
        : (isFinalSketch ? 'Final Sketch' : 'Initial Sketch');
        
    const getAssetDisplaySrc = (asset: GalleryAsset): string | undefined => {
        if ('src' in asset) return asset.src;
        if (asset.tag === 'Mood Board' && asset.sources.length > 0) return getDisplaySrc(asset.sources[0]);
        if (asset.tag === 'Multi-View' && asset.views.length > 0) return getDisplaySrc(asset.views[0].source);
        return undefined;
    };

    return (
        <div className="bg-atelier-900/90 border border-white/[0.08] hover:border-white/[0.16] rounded-xl p-4 flex flex-col h-full relative group hover:bg-atelier-850/80 transition-all shadow-md hover:shadow-xl w-full">
            <div className="mb-3 w-full relative h-[30px] flex items-center justify-between gap-2 overflow-hidden">
                {isEditingName && (
                    <>
                        <div className="fixed inset-0 z-[190]" onClick={() => setIsEditingName(false)} />
                        <div className="absolute top-10 left-0 z-[200] bg-atelier-900 border border-indigo-500/40 rounded-xl p-4 shadow-2xl w-64 backdrop-blur-xl">
                            <h3 className="text-xs font-semibold text-white mb-2 font-mono uppercase tracking-wider">Rename Item</h3>
                            <form onSubmit={handleRenameSubmit}>
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    className="w-full bg-atelier-800 text-white px-3 py-1.5 rounded-lg border border-white/[0.1] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 mb-3 text-xs"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setIsEditingName(false)} className="px-2.5 py-1 rounded-md text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors">Cancel</button>
                                    <button type="submit" className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors text-xs font-medium">Save</button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
                
                <button 
                    onClick={() => {
                        setEditedName(slot.name);
                        setIsEditingName(true);
                    }}
                    className="flex-1 min-w-0 font-semibold text-zinc-100 text-xs bg-atelier-800/80 px-2.5 py-1 rounded-md border border-white/[0.06] cursor-pointer hover:border-indigo-500/40 hover:text-white transition-colors truncate text-left mr-2"
                    title="Click to Rename Item"
                >
                    {slot.name}
                </button>
                
                <button 
                    onClick={() => onEnterItem(slot.id)}
                    className="flex-shrink-0 text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors px-2 py-0.5 rounded hover:bg-indigo-500/10"
                >
                    <span>Studio</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Hero Slot */}
            <div 
                onClick={() => activeAsset ? onSelectItem(slot.id, heroType) : onOpenTool('sketch', slot.id, activeAsset?.id)}
                className={`aspect-square mb-2.5 rounded-lg relative overflow-hidden transition-all bg-atelier-950 w-full group/hero ${activeAsset ? 'cursor-pointer border border-white/[0.06]' : 'border border-dashed border-zinc-700/60 hover:border-indigo-500/50 hover:bg-indigo-500/5 cursor-pointer'}`}
            >
                {activeAsset ? (
                    <img src={getAssetDisplaySrc(activeAsset) || undefined} alt={slot.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 hover:text-indigo-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                        <span className="text-[11px] font-mono uppercase tracking-wider">Generate Flat</span>
                    </div>
                )}
                
                {/* Hover Overlay */}
                {activeAsset && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/hero:opacity-100 transition-opacity">
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                            {onDuplicateItem && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDuplicateItem(activeAsset);
                                    }}
                                    className="text-white hover:text-blue-300 transition-colors bg-slate-900/60 hover:bg-slate-800 rounded-full p-1.5 backdrop-blur-sm"
                                    title="Duplicate Hero Asset"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                    </svg>
                                </button>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteItemSlot(slot.id);
                                }}
                                className="text-white hover:text-red-400 transition-colors bg-slate-900/60 hover:bg-slate-800 rounded-full p-1.5 backdrop-blur-sm"
                                title="Delete Item Slot"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                        
                        {onReorderItemSlot && !isFirst && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReorderItemSlot(slot.id, 'left');
                                }}
                                className="absolute top-1/2 left-2 -translate-y-1/2 text-white bg-slate-900/60 hover:bg-slate-800 rounded-full p-1.5 backdrop-blur-sm transition-colors"
                                title="Move Left"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                        )}
                        
                        {onReorderItemSlot && !isLast && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReorderItemSlot(slot.id, 'right');
                                }}
                                className="absolute top-1/2 right-2 -translate-y-1/2 text-white bg-slate-900/60 hover:bg-slate-800 rounded-full p-1.5 backdrop-blur-sm transition-colors"
                                title="Move Right"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        )}
                    </div>
                )}

                {activeAsset && (
                    <div className={`absolute bottom-0 left-0 right-0 ${isFinalRender || isFinalSketch ? 'bg-indigo-600/90' : 'bg-black/60'} text-white text-[10px] font-bold uppercase py-1 text-center backdrop-blur-sm`}>
                        {heroLabel}
                    </div>
                )}
                {finalRenderStudioCount > 1 && (
                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-md border border-slate-900 z-10" title={`${finalRenderStudioCount} Final Renders Available`}>
                        {finalRenderStudioCount}
                    </div>
                )}
            </div>

            {/* Variants Strip */}
            {variants.length > 1 && (
                <div className="flex gap-1.5 mb-3 overflow-x-auto custom-scrollbar pb-1">
                    {variants.map(variant => (
                        <button
                            key={variant.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveVariantId(variant.id);
                            }}
                            className={`flex-shrink-0 w-9 h-9 rounded-md overflow-hidden border transition-all ${activeVariantId === variant.id ? 'border-indigo-500 ring-1 ring-indigo-500/50 scale-105' : 'border-white/[0.08] hover:border-zinc-500'}`}
                            title={variant.tag}
                        >
                            <img src={getAssetDisplaySrc(variant)} alt="Variant thumbnail" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}

            {/* Action Slots */}
            <div className="grid grid-cols-4 gap-2 mt-auto w-full flex-shrink-0">
                {/* Sketch Link */}
                <div 
                    onClick={() => activeAsset?.tag === 'Sketch' ? onSelectItem(slot.id, 'sketch') : onOpenTool('sketch', slot.id, activeAsset?.id)}
                    className={`aspect-square rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all ${activeAsset?.tag === 'Sketch' ? 'border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20' : 'border-white/[0.07] bg-atelier-800/50 hover:border-zinc-500 hover:bg-atelier-750'}`}
                    title={activeAsset?.tag === 'Sketch' ? "View Sketch" : "Generate Flat"}
                >
                    {activeAsset?.tag === 'Sketch' ? (
                        <img src={getAssetDisplaySrc(activeAsset) || undefined} className="w-full h-full object-cover rounded-lg opacity-70 hover:opacity-100 transition-opacity" alt="Sketch" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                    )}
                </div>

                {/* Render Link */}
                <div 
                    onClick={() => activeAsset?.tag === 'Studio Image' ? onSelectItem(slot.id, 'studio') : (activeAsset ? onOpenTool('visualiser', slot.id, activeAsset?.id) : null)}
                    className={`aspect-square rounded-lg border flex flex-col items-center justify-center transition-all ${activeAsset?.tag === 'Studio Image' ? 'border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 cursor-pointer' : (activeAsset ? 'border-white/[0.07] bg-atelier-800/50 hover:border-zinc-500 hover:bg-atelier-750 cursor-pointer' : 'border-white/[0.03] opacity-25 pointer-events-none')}`}
                    title={activeAsset?.tag === 'Studio Image' ? "View Render" : "Visualise Product"}
                >
                     {activeAsset?.tag === 'Studio Image' ? (
                        <img src={getAssetDisplaySrc(activeAsset) || undefined} className="w-full h-full object-cover rounded-lg opacity-70 hover:opacity-100 transition-opacity" alt="Render" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    )}
                </div>

                {/* Tech Pack Link */}
                <div 
                    onClick={() => techpack ? onSelectItem(slot.id, 'techpack') : (activeAsset ? onOpenTool('techpack', slot.id, activeAsset?.id) : null)}
                    className={`aspect-square rounded-lg border flex flex-col items-center justify-center transition-all ${techpack ? 'border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 cursor-pointer' : (activeAsset ? 'border-white/[0.07] bg-atelier-800/50 hover:border-zinc-500 hover:bg-atelier-750 cursor-pointer' : 'border-white/[0.03] opacity-25 pointer-events-none')}`}
                    title={techpack ? "View Tech Pack" : "Generate Tech Pack"}
                >
                     {techpack ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    )}
                </div>
                
                {/* Copilot Link */}
                <div 
                    onClick={() => activeAsset ? onOpenCopilot(activeAsset) : null}
                    className={`aspect-square rounded-lg border flex flex-col items-center justify-center transition-all ${activeAsset ? 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer' : 'border-white/[0.03] opacity-25 pointer-events-none'}`}
                    title={activeAsset ? "Ask Design Assistant" : "Generate an asset first"}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${activeAsset ? 'text-amber-400' : 'text-zinc-600'}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                </div>
            </div>
        </div>
    );
};

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItemName.trim()) {
            onAddItem(newItemName.trim());
            setIsAdding(false);
            setNewItemName('');
        }
    };

    const handleAcceptSuggestion = (name: string) => {
        onAddItem(name);
        setSuggestedItems(prev => prev.filter(i => i.name !== name));
    };

    return (
        <div className="w-full h-full flex flex-col animate-fade-in">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Collection Line Sheet</h2>
                    <p className="text-zinc-400 text-xs mt-0.5">Manage your garment item slots. All styles inherit Master Style DNA.</p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => setIsVisualizerOpen(true)}
                        className="px-3.5 py-2 bg-atelier-800 hover:bg-atelier-750 text-zinc-200 text-xs font-medium rounded-lg border border-white/[0.08] transition-all flex items-center gap-1.5 shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Range Visualisation
                    </button>
                    {!isAdding && (
                        <button 
                            onClick={() => setIsAdding(true)}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg shadow-sm shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add New Item Slot
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar pb-20 items-stretch">
                {(() => {
                    const sortedSlots = [...slots].sort((a, b) => (b.created || 0) - (a.created || 0));
                    return sortedSlots.map((slot, index) => (
                        <ItemSlotCard 
                             key={slot.id}
                             slot={slot}
                             assets={assets}
                             finalAssets={finalAssets}
                             onEnterItem={onEnterItem}
                             onRenameItemSlot={onRenameItemSlot}
                             onDuplicateItem={onDuplicateItem}
                             onDeleteItemSlot={(id) => setSlotToDelete(slots.find(s => s.id === id) || null)}
                             onSelectItem={onSelectItem}
                             onOpenTool={onOpenTool}
                             onOpenCopilot={(asset) => setCopilotAsset(asset)}
                             onReorderItemSlot={onReorderItemSlot}
                             isFirst={index === 0}
                             isLast={index === sortedSlots.length - 1}
                        />
                    ));
                })()}

                {/* Suggestions */}
                {suggestedItems.map((item, idx) => (
                    <div 
                        key={`suggestion-${idx}`}
                        onClick={() => handleAcceptSuggestion(item.name)}
                        className="bg-atelier-900/60 border border-dashed border-indigo-500/30 hover:border-indigo-500/70 hover:bg-indigo-950/20 rounded-xl p-4 flex flex-col h-full relative group transition-all w-full cursor-pointer"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                AI Suggestion
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">0{idx + 1}</span>
                        </div>

                        {/* Main Content mimicking Aspect Ratio */}
                        <div className="aspect-square mb-3 w-full flex flex-col items-center justify-center text-center p-3">
                            <h4 className="text-white font-semibold text-sm mb-1.5 group-hover:text-indigo-300 transition-colors line-clamp-2">{item.name}</h4>
                            <p className="text-xs text-zinc-400 leading-relaxed max-w-[95%] line-clamp-4">{item.reasoning}</p>
                        </div>

                        {/* Footer Spacer to match Action Bar */}
                        <div className="h-10 mt-auto w-full flex items-center justify-center bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-300 text-xs font-medium tracking-wide group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add to Line
                        </div>
                    </div>
                ))}

                {/* Add Slot Card (or Form) */}
                {isAdding ? (
                    <form onSubmit={handleCreate} className="bg-slate-900/40 border-2 border-indigo-500 rounded-2xl p-4 flex flex-col h-full relative w-full">
                        <div className="mb-3 min-h-[28px] flex-shrink-0"></div>
                        <div className="aspect-square mb-3 w-full flex flex-col justify-center">
                            <label className="text-xs font-bold uppercase text-indigo-400 mb-2">Item Name</label>
                            <input 
                                type="text"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                placeholder="e.g. Boxy Denim Jacket"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm mb-4 focus:border-indigo-500 outline-none"
                                autoFocus
                            />
                            <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-500 transition-colors mb-2">
                                Create Workspace
                            </button>
                            <button type="button" onClick={() => setIsAdding(false)} className="w-full py-2 bg-transparent text-slate-400 rounded-lg text-sm hover:text-white transition-colors">
                                Cancel
                            </button>
                        </div>
                        <div className="h-14 mt-auto w-full flex-shrink-0"></div>
                    </form>
                ) : (
                    <div 
                        onClick={() => setIsAdding(true)}
                        className="bg-slate-900/20 border-2 border-dashed border-slate-800 hover:border-indigo-500 rounded-2xl p-4 flex flex-col h-full relative group transition-all w-full cursor-pointer"
                    >
                        <div className="mb-3 min-h-[28px] flex-shrink-0"></div>
                        <div className="aspect-square mb-3 w-full flex flex-col items-center justify-center">
                            <div className="p-4 bg-slate-900 rounded-full mb-4 group-hover:scale-110 transition-transform group-hover:bg-indigo-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <span className="text-slate-500 font-bold group-hover:text-white">New Item Slot</span>
                        </div>
                        <div className="h-14 mt-auto w-full flex-shrink-0"></div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {slotToDelete && createPortal(
                <div className="fixed inset-0 bg-slate-950/80 p-4 md:p-8 flex items-center justify-center z-[100] overflow-auto">
                    <div className="bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full border border-white/10 shadow-2xl animate-fade-in relative">
                        <div className="flex items-center gap-3 mb-4 text-red-400">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h2 className="text-2xl font-bold">Delete Item Slot?</h2>
                        </div>
                        <p className="text-slate-300 mb-6">
                            Are you sure you want to delete <span className="font-bold text-white">{slotToDelete.name}</span> and all associated assets? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button 
                                onClick={() => setSlotToDelete(null)}
                                className="px-4 py-2 font-medium text-slate-300 hover:text-white transition-colors border border-transparent hover:border-slate-700 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => {
                                    onDeleteItemSlot(slotToDelete.id);
                                    setSlotToDelete(null);
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors border border-red-500"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            
            {isVisualizerOpen && (
                <CollectionVisualizerModal 
                    finalAssets={finalAssets.filter(a => a.tag === 'Studio Image' && slots.some(s => s.id === a.itemSlotId))} 
                    onClose={() => setIsVisualizerOpen(false)} 
                    onGenerate={onGenerateRangeVisual!}
                />
            )}

            {copilotAsset && (
                <DesignAssistantPanel 
                    asset={copilotAsset} 
                    itemName={slots.find(s => s.id === copilotAsset.itemSlotId)?.name || 'Design Asset'}
                    contextAssets={[...assets, ...finalAssets]}
                    onClose={() => setCopilotAsset(null)} 
                    onOpenLineage={(asset) => {
                        setCopilotAsset(null);
                        onShowTraceability(asset);
                    }}
                    onSaveCopilotAsset={onSaveCopilotAsset}
                    onApplyCopilotTechPack={onApplyCopilotTechPack}
                />
            )}
        </div>
    );
};