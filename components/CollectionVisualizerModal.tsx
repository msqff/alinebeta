import React, { useState, useRef } from 'react';
import { GalleryAsset, getDisplaySrc } from '../types';
import { createPortal } from 'react-dom';
import { Spinner } from './common/Spinner';

interface CollectionVisualizerModalProps {
    finalAssets: GalleryAsset[];
    onClose: () => void;
    onGenerate: (base64Image: string, prompt: string) => void;
}

const STAGING_ENVIRONMENTS = [
    "Hanging on an industrial clothes rail",
    "Dressed on white tailoring mannequins",
    "Organized as a top-down flat lay"
];

export const CollectionVisualizerModal: React.FC<CollectionVisualizerModalProps> = ({ finalAssets, onClose, onGenerate }) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [environment, setEnvironment] = useState(STAGING_ENVIRONMENTS[0]);
    const [isGenerating, setIsGenerating] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const toggleSelection = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(selected => selected !== id));
        } else if (selectedIds.length < 4) {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    const handleGenerate = async () => {
        if (selectedIds.length === 0) return;
        setIsGenerating(true);

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Load images
        const imagesToLoad = selectedIds.map(id => {
            const asset = finalAssets.find(a => a.id === id);
            return new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = getDisplaySrc(asset!)!;
            });
        });

        try {
            const loadedImages = await Promise.all(imagesToLoad);

            const maxWidth = 800; // max width per image on composite
            const aspectRatios = loadedImages.map(img => img.width / img.height);
            // We want to stitch them horizontally (side by side)
            const targetHeight = 1000;
            
            let totalWidth = 0;
            const dims = loadedImages.map(img => {
                const height = targetHeight;
                const width = (img.width / img.height) * height;
                totalWidth += width;
                return { width, height, img };
            });

            canvas.width = totalWidth;
            canvas.height = targetHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not get canvas context");

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            let currentX = 0;
            for (const { width, height, img } of dims) {
                ctx.drawImage(img, currentX, 0, width, height);
                currentX += width;
            }

            const base64Image = canvas.toDataURL('image/jpeg', 0.9);
            onGenerate(base64Image, environment);
            onClose();

        } catch (e) {
            console.error("Failed to generate range visual", e);
            setIsGenerating(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col h-[85vh] overflow-hidden animate-fade-in">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Range Visualisation</h2>
                        <p className="text-sm text-slate-400 mt-1">Select up to 4 finalized variants to stage together.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-900/30">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {finalAssets.map(asset => {
                            const isSelected = selectedIds.includes(asset.id);
                            const isDisabled = !isSelected && selectedIds.length >= 4;
                            
                            return (
                                <div 
                                    key={asset.id}
                                    onClick={() => !isDisabled && toggleSelection(asset.id)}
                                    className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                                        isSelected ? 'border-indigo-500 scale-[0.98]' : 
                                        isDisabled ? 'border-slate-800 opacity-40 cursor-not-allowed' : 'border-transparent hover:border-slate-600'
                                    }`}
                                >
                                    <img src={getDisplaySrc(asset)} alt="Variant" className="w-full h-full object-cover bg-slate-800" />
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 bg-indigo-500 text-white rounded-full p-1 shadow-md">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    {finalAssets.length === 0 && (
                        <div className="text-center text-slate-500 py-12">
                            No finalized assets in this collection.
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                    <div className="mb-4">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Staging Environment</label>
                        <select 
                            value={environment}
                            onChange={(e) => setEnvironment(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-colors"
                        >
                            {STAGING_ENVIRONMENTS.map(env => (
                                <option key={env} value={env}>{env}</option>
                            ))}
                        </select>
                    </div>

                    <button 
                        onClick={handleGenerate}
                        disabled={selectedIds.length === 0 || isGenerating}
                        className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 transition-all flex justify-center items-center"
                    >
                        {isGenerating ? (
                            <>
                                <Spinner size="sm" color="white" />
                                <span className="ml-2">Staging...</span>
                            </>
                        ) : (
                            `Generate Range Visual (${selectedIds.length}/4 selected)`
                        )}
                    </button>
                    
                    {/* Hidden canvas for combining images */}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
            </div>
        </div>,
        document.body
    );
}
