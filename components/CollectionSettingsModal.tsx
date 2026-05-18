import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Collection } from '../types';
import { Spinner } from './common/Spinner';

interface CollectionSettingsModalProps {
    collection: Collection;
    onClose: () => void;
    onSave: (updatedCollection: Collection) => void;
}

export const CollectionSettingsModal: React.FC<CollectionSettingsModalProps> = ({ collection, onClose, onSave }) => {
    const [name, setName] = useState(collection.name);
    const [targetAudience, setTargetAudience] = useState(collection.targetAudience);
    const [styleDna, setStyleDna] = useState(collection.styleDna);
    const [extractedPalette, setExtractedPalette] = useState([...collection.extractedPalette]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = () => {
        if (!name.trim()) {
            setError('Collection name is required');
            return;
        }

        const updatedCollection: Collection = {
            ...collection,
            name: name.trim(),
            targetAudience: targetAudience.trim(),
            styleDna: styleDna.trim(),
            extractedPalette,
        };

        onSave(updatedCollection);
        onClose();
    };

    const handleRemoveColor = (index: number) => {
        setExtractedPalette(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddColor = () => {
        setExtractedPalette(prev => [...prev, '#FFFFFF']);
    };

    const handleColorChange = (index: number, newColor: string) => {
         const newPalette = [...extractedPalette];
         newPalette[index] = newColor;
         setExtractedPalette(newPalette);
    };

    return createPortal(
        <div className="fixed inset-0 bg-slate-950/80 p-4 md:p-8 flex items-center justify-center z-[100] overflow-auto">
            <div className="bg-slate-900 rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-2xl font-bold text-white mb-6">Collection Settings</h2>
                
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Collection Name</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. Summer Essentials 2025"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                    
                    <div>
                         <label className="block text-sm font-medium text-slate-300 mb-2">Target Audience</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. Gen Z Urban Shoppers"
                            value={targetAudience}
                            onChange={e => setTargetAudience(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Style DNA / Description</label>
                        <textarea 
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
                            placeholder="Describe the aesthetic..."
                            value={styleDna}
                            onChange={e => setStyleDna(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2 flex justify-between items-center">
                            <span>Color Palette</span>
                            <button onClick={handleAddColor} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Color
                            </button>
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {extractedPalette.map((color, idx) => (
                                <div key={idx} className="flex items-center space-x-2 bg-slate-800 p-2 rounded-lg border border-slate-700">
                                    <input 
                                        type="color" 
                                        value={color}
                                        onChange={(e) => handleColorChange(idx, e.target.value)}
                                        className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                    />
                                    <input 
                                        type="text"
                                        value={color}
                                        onChange={(e) => handleColorChange(idx, e.target.value)}
                                        className="w-20 bg-transparent text-sm text-white focus:outline-none"
                                    />
                                    <button 
                                        onClick={() => handleRemoveColor(idx)}
                                        className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 font-medium text-slate-300 hover:text-white transition-colors border border-transparent hover:border-slate-700 rounded-xl"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all flex items-center"
                    >
                        {isLoading && <Spinner size="sm" className="mr-2" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
