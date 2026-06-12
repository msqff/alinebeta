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
}

const suggestionsCache: Record<string, { name: string; reasoning: string }[]> = {};

export const ItemManager: React.FC<ItemManagerProps> = ({ slots, assets, finalAssets, onAddItem, onSelectItem, onOpenTool, onEnterItem, onRenameItemSlot, onDeleteItemSlot, onDuplicateItem, onGenerateRangeVisual, onShowTraceability, collection, onReorderItemSlot }) => {
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
                const topSuggestions = suggestions.slice(0, 3);
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
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex flex-col h-full relative group hover:bg-slate-900/60 transition-colors w-full">
            <div className="mb-3 flex flex-col gap-2 w-full relative">
                {isEditingName && (
                    <>
                        <div className="fixed inset-0 z-[190]" onClick={() => setIsEditingName(false)} />
                        <div className="absolute top-10 left-0 z-[200] bg-slate-900 border border-indigo-500/50 rounded-xl p-4 shadow-2xl w-64">
                            <h3 className="text-sm font-bold text-white mb-3">Rename Item</h3>
                            <form onSubmit={handleRenameSubmit}>
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 mb-3 text-sm"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setIsEditingName(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
                                    <button type="submit" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-xs font-bold">Save</button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
                
                <div className="w-full">
                    <button 
                        onClick={() => {
                            setEditedName(slot.name);
                            setIsEditingName(true);
                        }}
                        className="font-bold text-white text-sm bg-slate-800 px-3 py-1 rounded-full cursor-pointer hover:bg-slate-700 hover:text-indigo-300 transition-colors truncate w-full text-left"
                        title="Rename Item"
                    >
                        {slot.name}
                    </button>
                </div>
                
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-1">
                        {onReorderItemSlot && (
                            <>
                                <button 
                                    onClick={() => onReorderItemSlot(slot.id, 'left')} 
                                    disabled={isFirst}
                                    className={`p-1 rounded-md transition-colors ${isFirst ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <button 
                                    onClick={() => onReorderItemSlot(slot.id, 'right')} 
                                    disabled={isLast}
                                    className={`p-1 rounded-md transition-colors ${isLast ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => onEnterItem(slot.id)}
                            className="text-xs text-indigo-400 hover:text-white font-medium flex items-center transition-colors flex-shrink-0"
                        >
                            Open
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        {activeAsset && onDuplicateItem && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDuplicateItem(activeAsset);
                                }}
                                className="text-blue-400 hover:text-blue-300 transition-colors bg-slate-800/50 hover:bg-slate-800 rounded-full p-1.5"
                                title="Duplicate Hero Asset"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteItemSlot(slot.id);
                            }}
                            className="text-slate-500 hover:text-red-400 transition-colors bg-slate-800/50 hover:bg-slate-800 rounded-full p-1.5"
                            title="Delete Item Slot"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Hero Slot */}
            <div 
                onClick={() => activeAsset ? onSelectItem(slot.id, heroType) : onOpenTool('sketch', slot.id, activeAsset?.id)}
                className={`aspect-square mb-2 rounded-xl relative overflow-hidden transition-all bg-slate-900 w-full ${activeAsset ? 'cursor-pointer' : 'border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/10 cursor-pointer'}`}
            >
                {activeAsset ? (
                    <img src={getAssetDisplaySrc(activeAsset) || undefined} alt={slot.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                        <span className="text-xs uppercase font-bold">Generate Sketch</span>
                    </div>
                )}
                {activeAsset && (
                    <div className={`absolute bottom-0 left-0 right-0 ${isFinalRender || isFinalSketch ? 'bg-indigo-600/90' : 'bg-black/60'} text-white text-[10px] font-bold uppercase py-1 text-center backdrop-blur-sm`}>
                        {heroLabel}
                    </div>
                )}
                {finalRenderStudioCount > 1 && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-md border border-slate-900 z-10" title={`${finalRenderStudioCount} Final Renders Available`}>
                        {finalRenderStudioCount}
                    </div>
                )}
            </div>

            {/* Variants Strip */}
            {variants.length > 1 && (
                <div className="flex gap-2 mb-3 overflow-x-auto custom-scrollbar pb-1">
                    {variants.map(variant => (
                        <button
                            key={variant.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveVariantId(variant.id);
                            }}
                            className={`flex-shrink-0 w-10 h-10 rounded-md overflow-hidden border-2 transition-all ${activeVariantId === variant.id ? 'border-indigo-500 scale-105' : 'border-slate-700 hover:border-slate-500'}`}
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
                    className={`aspect-square rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all ${activeAsset?.tag === 'Sketch' ? 'border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800'}`}
                    title={activeAsset?.tag === 'Sketch' ? "View Sketch" : "Generate Sketch"}
                >
                    {activeAsset?.tag === 'Sketch' ? (
                        <img src={getAssetDisplaySrc(activeAsset) || undefined} className="w-full h-full object-cover rounded-lg opacity-60 hover:opacity-100 transition-opacity" alt="Sketch" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                    )}
                </div>

                {/* Render Link */}
                <div 
                    onClick={() => activeAsset?.tag === 'Studio Image' ? onSelectItem(slot.id, 'studio') : (activeAsset ? onOpenTool('visualiser', slot.id, activeAsset?.id) : null)}
                    className={`aspect-square rounded-lg border flex flex-col items-center justify-center transition-all ${activeAsset?.tag === 'Studio Image' ? 'border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 cursor-pointer' : (activeAsset ? 'border-slate-700 hover:border-slate-500 hover:bg-slate-800 cursor-pointer' : 'border-slate-800 opacity-30 pointer-events-none')}`}
                    title={activeAsset?.tag === 'Studio Image' ? "View Render" : "Visualise Product"}
                >
                     {activeAsset?.tag === 'Studio Image' ? (
                        <img src={getAssetDisplaySrc(activeAsset) || undefined} className="w-full h-full object-cover rounded-lg opacity-60 hover:opacity-100 transition-opacity" alt="Render" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1.586-1.586a2 2 0 00-2.828 0L6 14m6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    )}
                </div>

                {/* Tech Pack Link */}
                <div 
                    onClick={() => techpack ? onSelectItem(slot.id, 'techpack') : (activeAsset ? onOpenTool('techpack', slot.id, activeAsset?.id) : null)}
                    className={`aspect-square rounded-lg border flex flex-col items-center justify-center transition-all ${techpack ? 'border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 cursor-pointer' : (activeAsset ? 'border-slate-700 hover:border-slate-500 hover:bg-slate-800 cursor-pointer' : 'border-slate-800 opacity-30 pointer-events-none')}`}
                    title={techpack ? "View Tech Pack" : "Generate Tech Pack"}
                >
                     {techpack ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    )}
                </div>
                
                {/* Copilot Link */}
                <div 
                    onClick={() => activeAsset ? onOpenCopilot(activeAsset) : null}
                    className={`aspect-square rounded-lg border flex flex-col items-center justify-center transition-all ${activeAsset ? 'border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer' : 'border-slate-800 opacity-30 pointer-events-none'}`}
                    title={activeAsset ? "Ask Design Assistant" : "Generate an asset first"}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${activeAsset ? 'text-amber-400' : 'text-slate-500'}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
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
             <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Collection Line Sheet</h2>
                    <p className="text-slate-400 mt-1 font-light">Manage your item slots. All items inherit the Master Style DNA.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsVisualizerOpen(true)}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl shadow-lg border border-slate-700 transition-all flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1.586-1.586a2 2 0 00-2.828 0L6 14m6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Range Visualisation
                    </button>
                    {!isAdding && (
                        <button 
                            onClick={() => setIsAdding(true)}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 transition-all flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add New Item Slot
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto custom-scrollbar pb-20 items-stretch">
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
                        className="bg-indigo-900/10 border-2 border-dashed border-indigo-500/30 hover:border-indigo-500 hover:bg-indigo-900/20 rounded-2xl p-4 flex flex-col h-full relative group transition-all w-full cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-bl-lg rounded-tr-xl opacity-80 z-10 shadow-lg">AI Suggestion</div>
                        
                        {/* Header Spacer to match Item Card Title */}
                        <div className="mb-3 min-h-[28px] w-full flex-shrink-0"></div>

                        {/* Main Content mimicking Aspect Ratio */}
                        <div className="aspect-square mb-3 w-full flex flex-col items-center justify-center text-center p-4">
                            <h4 className="text-white font-bold text-lg mb-2 group-hover:text-indigo-300 transition-colors line-clamp-2">{item.name}</h4>
                            <p className="text-xs text-slate-400 leading-relaxed max-w-[90%] line-clamp-4">{item.reasoning}</p>
                        </div>

                        {/* Footer Spacer to match Action Bar */}
                        <div className="h-14 mt-auto w-full flex-shrink-0 flex items-center justify-center bg-indigo-900/40 rounded-xl border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wide group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                />
            )}
        </div>
    );
};