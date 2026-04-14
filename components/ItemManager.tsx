import React, { useState, useEffect } from 'react';
import { ItemSlot, GalleryAsset, Collection, getDisplaySrc } from '../types';
import { generateItemSuggestions } from '../services/geminiService';

interface ItemManagerProps {
    slots: ItemSlot[];
    assets: GalleryAsset[]; // All assets in this collection
    finalAssets: GalleryAsset[]; // Final assets in this collection
    onAddItem: (name: string) => void;
    onSelectItem: (slotId: string, type: 'sketch' | 'studio' | 'techpack') => void;
    onOpenTool: (tool: 'sketch' | 'visualiser' | 'techpack', slotId: string) => void;
    onEnterItem: (slotId: string) => void;
    collection: Collection;
}

export const ItemManager: React.FC<ItemManagerProps> = ({ slots, assets, finalAssets, onAddItem, onSelectItem, onOpenTool, onEnterItem, collection }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [suggestedItems, setSuggestedItems] = useState<{ name: string; reasoning: string }[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

    // Fetch suggestions on mount or when slot count changes significantly (though we mostly want stable suggestions)
    useEffect(() => {
        const fetchSuggestions = async () => {
            setIsLoadingSuggestions(true);
            try {
                // Get existing names to avoid duplicates
                const existingNames = slots.map(s => s.name);
                const suggestions = await generateItemSuggestions(collection.name, collection.styleDna, existingNames);
                setSuggestedItems(suggestions.slice(0, 3)); // Keep top 3
            } catch (e) {
                console.error("Failed to fetch suggestions in manager", e);
            } finally {
                setIsLoadingSuggestions(false);
            }
        };

        // Fetch if we don't have suggestions yet or if this is a fresh mount
        if (suggestedItems.length === 0) {
            fetchSuggestions();
        }
    }, []); // Only run once on mount to keep UI stable, user can refresh if they really want by re-entering

    // Helper to find asset by ID
    const getAsset = (id?: string) => assets.find(a => a.id === id);

    const getAssetDisplaySrc = (asset: GalleryAsset): string => {
        if ('src' in asset) {
            return asset.src;
        }
        if (asset.tag === 'Mood Board' && asset.sources.length > 0) {
             return getDisplaySrc(asset.sources[0]);
        }
        if (asset.tag === 'Multi-View' && asset.views.length > 0) {
             return getDisplaySrc(asset.views[0].source);
        }
        return '';
    }

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto custom-scrollbar pb-20 items-stretch">
                {(() => {
                    const reversedFinalAssets = [...finalAssets].reverse();
                    return slots.map((slot) => {
                        // Check if there are any promoted (final) assets for this slot (get the most recent one)
                        const finalStudio = reversedFinalAssets.find(a => a.itemSlotId === slot.id && a.tag === 'Studio Image');
                        const finalSketch = reversedFinalAssets.find(a => a.itemSlotId === slot.id && a.tag === 'Sketch');
                        const finalTechpack = reversedFinalAssets.find(a => a.itemSlotId === slot.id && a.tag === 'Tech Pack');

                    const sketch = finalSketch || getAsset(slot.sketchId);
                    const studio = finalStudio || getAsset(slot.studioImageId);
                    const techpack = finalTechpack || getAsset(slot.techPackId);
                    
                    // Priority: Studio -> Sketch
                    const heroAsset = studio || sketch;
                    const heroType = studio ? 'studio' : 'sketch';

                    // Determine if the hero asset is actually a final render or just a draft
                    const isFinalRender = !!finalStudio;
                    const isFinalSketch = !!finalSketch;
                    const heroLabel = heroType === 'studio' 
                        ? (isFinalRender ? 'Final Render' : 'Draft Render') 
                        : (isFinalSketch ? 'Final Sketch' : 'Initial Sketch');

                    return (
                        <div key={slot.id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex flex-col h-full relative group hover:bg-slate-900/60 transition-colors w-full">
                            <div className="mb-3 flex justify-between items-center min-h-[28px] flex-shrink-0">
                                <span 
                                    onClick={() => onEnterItem(slot.id)}
                                    className="font-bold text-white text-sm bg-slate-800 px-3 py-1 rounded-full cursor-pointer hover:bg-slate-700 hover:text-indigo-300 transition-colors truncate max-w-[150px]"
                                >
                                    {slot.name}
                                </span>
                                <button 
                                    onClick={() => onEnterItem(slot.id)}
                                    className="text-xs text-indigo-400 hover:text-white font-medium flex items-center transition-colors flex-shrink-0"
                                >
                                    Open Workspace
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Hero Slot */}
                            <div 
                                onClick={() => heroAsset ? onSelectItem(slot.id, heroType) : onOpenTool('sketch', slot.id)}
                                className={`aspect-square mb-3 rounded-xl relative overflow-hidden transition-all bg-slate-900 w-full ${heroAsset ? 'cursor-pointer' : 'border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/10 cursor-pointer'}`}
                            >
                                {heroAsset ? (
                                    <img src={getAssetDisplaySrc(heroAsset)} alt={slot.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                                        <span className="text-xs uppercase font-bold">Generate Sketch</span>
                                    </div>
                                )}
                                {heroAsset && (
                                    <div className={`absolute bottom-0 left-0 right-0 ${isFinalRender || isFinalSketch ? 'bg-indigo-600/90' : 'bg-black/60'} text-white text-[10px] font-bold uppercase py-1 text-center backdrop-blur-sm`}>
                                        {heroLabel}
                                    </div>
                                )}
                            </div>

                            {/* Action Slots */}
                            <div className="grid grid-cols-3 gap-2 mt-auto w-full flex-shrink-0">
                                {/* Sketch Link */}
                                <div 
                                    onClick={() => sketch ? onSelectItem(slot.id, 'sketch') : onOpenTool('sketch', slot.id)}
                                    className={`aspect-square rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all ${sketch ? 'border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800'}`}
                                    title={sketch ? "View Sketch" : "Generate Sketch"}
                                >
                                    {sketch ? (
                                        <img src={getAssetDisplaySrc(sketch)} className="w-full h-full object-cover rounded-lg opacity-60 hover:opacity-100 transition-opacity" alt="Sketch" />
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                                    )}
                                </div>

                                {/* Render Link */}
                                <div 
                                    onClick={() => studio ? onSelectItem(slot.id, 'studio') : (sketch ? onOpenTool('visualiser', slot.id) : null)}
                                    className={`aspect-square rounded-lg border flex flex-col items-center justify-center transition-all ${studio ? 'border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 cursor-pointer' : (sketch ? 'border-slate-700 hover:border-slate-500 hover:bg-slate-800 cursor-pointer' : 'border-slate-800 opacity-30 pointer-events-none')}`}
                                    title={studio ? "View Render" : "Visualise Product"}
                                >
                                     {studio ? (
                                        <img src={getAssetDisplaySrc(studio)} className="w-full h-full object-cover rounded-lg opacity-60 hover:opacity-100 transition-opacity" alt="Render" />
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1.586-1.586a2 2 0 00-2.828 0L6 14m6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    )}
                                </div>

                                {/* Tech Pack Link */}
                                <div 
                                    onClick={() => techpack ? onSelectItem(slot.id, 'techpack') : (studio ? onOpenTool('techpack', slot.id) : null)}
                                    className={`aspect-square rounded-lg border flex flex-col items-center justify-center transition-all ${techpack ? 'border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 cursor-pointer' : (studio ? 'border-slate-700 hover:border-slate-500 hover:bg-slate-800 cursor-pointer' : 'border-slate-800 opacity-30 pointer-events-none')}`}
                                    title={techpack ? "View Tech Pack" : "Generate Tech Pack"}
                                >
                                     {techpack ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                    });
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
        </div>
    );
};