import React, { useState } from 'react';
import { Collection, ImageSource } from '../types';
import { FileUpload } from './common/FileUpload';
import { analyzeCollectionIntake, fileToBase64, generateItemSuggestions } from '../services/geminiService';
import { Spinner } from './common/Spinner';

interface CollectionSelectorProps {
    collections: Collection[];
    onSelectCollection: (collection: Collection) => void;
    onCreateCollection: (collection: Collection, initialItems?: string[]) => void;
}

export const CollectionSelector: React.FC<CollectionSelectorProps> = ({ collections, onSelectCollection, onCreateCollection }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [moodBoard, setMoodBoard] = useState<ImageSource | null>(null);
    const [moodBoardPreview, setMoodBoardPreview] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Analysis results
    const [extractedPalette, setExtractedPalette] = useState<string[]>([]);
    const [styleDna, setStyleDna] = useState<string>('');
    const [suggestedItems, setSuggestedItems] = useState<{ name: string; reasoning: string }[]>([]);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    const handleFileUpload = async (files: File[]) => {
        if (files.length === 0) return;
        setIsLoading(true);
        setError(null);
        try {
            const source = await fileToBase64(files[0]);
            setMoodBoard(source);
            setMoodBoardPreview(`data:${source.mimeType};base64,${source.data}`);
            
            // Analyze immediately
            const analysis = await analyzeCollectionIntake(source);
            setExtractedPalette(analysis.palette);
            setStyleDna(analysis.styleDna);
            
            // Trigger suggestions if we have a name (or updated name later)
            // Note: If name is empty, suggestions might be generic, but we can refetch when name updates or just fetch now based on DNA
            fetchSuggestions(analysis.styleDna, name);

        } catch (e: any) {
            setError(e.message || "Failed to analyze mood board.");
            setMoodBoard(null);
            setMoodBoardPreview(null);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSuggestions = async (dna: string, collectionName: string) => {
        if (!dna) return;
        try {
            const suggestions = await generateItemSuggestions(collectionName || "New Collection", dna, []);
            setSuggestedItems(suggestions);
            // Auto-select all by default? Or let user choose. Let's auto-select none.
        } catch (e) {
            console.error("Failed to get suggestions", e);
        }
    };

    // Refetch suggestions if name changes and we already have DNA
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    };
    
    // Add a blur handler to fetch suggestions when name is finalized/entered
    const handleNameBlur = () => {
        if (styleDna && name) {
             fetchSuggestions(styleDna, name);
        }
    }

    const toggleSuggestion = (itemName: string) => {
        setSelectedItems(prev => prev.includes(itemName) ? prev.filter(i => i !== itemName) : [...prev, itemName]);
    };

    const handleCreate = () => {
        if (!name || !moodBoard || !styleDna) return;
        
        const newCollection: Collection = {
            id: self.crypto.randomUUID(),
            name,
            masterMoodBoard: moodBoard,
            extractedPalette,
            styleDna,
            created: Date.now()
        };
        
        onCreateCollection(newCollection, selectedItems);
        setIsCreating(false);
        resetForm();
    };

    const resetForm = () => {
        setName('');
        setMoodBoard(null);
        setMoodBoardPreview(null);
        setExtractedPalette([]);
        setStyleDna('');
        setSuggestedItems([]);
        setSelectedItems([]);
        setError(null);
    };

    const cancelCreation = () => {
        setIsCreating(false);
        resetForm();
    }

    if (isCreating) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in w-full max-w-5xl mx-auto py-10">
                <div className="w-full bg-slate-900/60 p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                        <h2 className="text-2xl font-bold text-white">Create New Collection</h2>
                        <button onClick={cancelCreation} className="text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Master Mood Board</label>
                            {moodBoardPreview ? (
                                <div className="relative group rounded-xl overflow-hidden aspect-[4/3] border border-slate-700 bg-black">
                                    <img src={moodBoardPreview} alt="Mood Board" className="w-full h-full object-contain" />
                                    <button 
                                        onClick={() => { setMoodBoard(null); setMoodBoardPreview(null); }}
                                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="aspect-[4/3]">
                                    {isLoading ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800/50 rounded-xl border border-dashed border-slate-600">
                                            <Spinner />
                                            <p className="mt-4 text-xs text-indigo-300 animate-pulse">Extracting DNA & Palette...</p>
                                        </div>
                                    ) : (
                                        <FileUpload onFilesUpload={handleFileUpload} />
                                    )}
                                </div>
                            )}
                            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                        </div>

                        <div className="flex flex-col">
                             <div className="mb-6">
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Collection Name</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={handleNameChange}
                                    onBlur={handleNameBlur}
                                    placeholder="e.g. SS25 Urban Nomad"
                                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                             </div>

                             {styleDna && (
                                 <div className="flex-grow animate-fade-in">
                                     <div className="mb-6">
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Detected Palette</label>
                                        <div className="flex space-x-2">
                                            {extractedPalette.map((color, i) => (
                                                <div key={i} className="w-10 h-10 rounded-full border border-white/10 shadow-lg" style={{ backgroundColor: color }} title={color}></div>
                                            ))}
                                        </div>
                                     </div>
                                     
                                     {suggestedItems.length > 0 && (
                                         <div className="mb-6">
                                             <label className="block text-xs font-bold uppercase text-slate-500 mb-2 flex justify-between">
                                                 <span>Recommended Line Up</span>
                                                 <span className="text-indigo-400 text-[10px] normal-case">Based on DNA</span>
                                             </label>
                                             <div className="space-y-2">
                                                 {suggestedItems.map((item, idx) => (
                                                     <div 
                                                        key={idx} 
                                                        onClick={() => toggleSuggestion(item.name)}
                                                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start ${selectedItems.includes(item.name) ? 'bg-indigo-900/30 border-indigo-500' : 'bg-slate-900/50 border-slate-800 hover:border-slate-600'}`}
                                                     >
                                                         <div className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 mt-0.5 transition-colors ${selectedItems.includes(item.name) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600'}`}>
                                                             {selectedItems.includes(item.name) && <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                                         </div>
                                                         <div>
                                                             <p className="text-sm font-bold text-white">{item.name}</p>
                                                             <p className="text-xs text-slate-400 leading-snug mt-1">{item.reasoning}</p>
                                                         </div>
                                                     </div>
                                                 ))}
                                             </div>
                                         </div>
                                     )}

                                     <div className="mb-6">
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Style DNA</label>
                                        <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 italic">
                                            "{styleDna}"
                                        </div>
                                     </div>
                                 </div>
                             )}

                             <button
                                onClick={handleCreate}
                                disabled={!name || !moodBoard || !styleDna}
                                className="mt-auto w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/20"
                             >
                                {selectedItems.length > 0 ? `Create Collection with ${selectedItems.length} Items` : 'Create Empty Collection'}
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
            <h2 className="text-4xl font-bold text-white mb-2">Select Collection</h2>
            <p className="text-slate-400 mb-12">Choose a project to begin or create a new line.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl px-4">
                {/* Create New Card */}
                <div 
                    onClick={() => setIsCreating(true)}
                    className="group aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/20 hover:bg-indigo-900/10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300"
                >
                    <div className="p-4 bg-slate-800 rounded-full mb-4 group-hover:scale-110 transition-transform group-hover:bg-indigo-600 group-hover:text-white text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <span className="font-bold text-slate-400 group-hover:text-white transition-colors">Create New Collection</span>
                </div>

                {/* Existing Collections */}
                {collections.map(collection => (
                    <div 
                        key={collection.id}
                        onClick={() => onSelectCollection(collection)}
                        className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-700 hover:border-indigo-500 cursor-pointer shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 bg-slate-900"
                    >
                        <img 
                            src={`data:${collection.masterMoodBoard.mimeType};base64,${collection.masterMoodBoard.data}`} 
                            alt={collection.name}
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-6 flex flex-col justify-end">
                            <h3 className="text-xl font-bold text-white mb-2">{collection.name}</h3>
                            <div className="flex space-x-1 mb-2">
                                {collection.extractedPalette.map((color, i) => (
                                    <div key={i} className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: color }}></div>
                                ))}
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2">{collection.styleDna}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};