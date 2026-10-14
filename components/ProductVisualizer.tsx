import React, { useState, useEffect } from 'react';
import { getDisplaySrc,  GalleryItem, ImageSource, GeneratedPattern } from '../types';
import { FileUpload } from './common/FileUpload';
import { fileToBase64 } from '../services/geminiService';
import { Spinner } from './common/Spinner';

interface ProductVisualiserProps {
    onVisualise: (baseImage: ImageSource, prompt: string, patternImage?: ImageSource, imageCount?: number) => void;
    onBack: () => void;
    inputImage: GalleryItem | null;
    onGeneratePattern: (prompt: string, imageCount?: number) => Promise<GeneratedPattern[]>;
    initialPrompt?: string;
}

export const ProductVisualiser: React.FC<ProductVisualiserProps> = ({ onVisualise, onBack, inputImage, onGeneratePattern, initialPrompt }) => {
    const [prompt, setPrompt] = useState(initialPrompt || '');
    const [baseImage, setBaseImage] = useState<ImageSource | null>(inputImage?.source || null);
    const [patternImage, setPatternImage] = useState<ImageSource | null>(null);
    const [baseImagePreview, setBaseImagePreview] = useState<string | null>(inputImage?.src || null);
    const [patternImagePreview, setPatternImagePreview] = useState<string | null>(null);
    const [imageCount, setImageCount] = useState(4);

    const [patternMode, setPatternMode] = useState<'upload' | 'generate'>('upload');
    const [patternPrompt, setPatternPrompt] = useState('');
    const [localPatterns, setLocalPatterns] = useState<GeneratedPattern[]>([]);
    const [isGeneratingPattern, setIsGeneratingPattern] = useState(false);
    const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);


    useEffect(() => {
        if (inputImage) {
            setBaseImage(inputImage.source);
            setBaseImagePreview(inputImage.src);
        }
    }, [inputImage]);

    const handleBaseImageUpload = async (file: File) => {
        const imageSource = await fileToBase64(file);
        setBaseImage(imageSource);
        setBaseImagePreview(getDisplaySrc(imageSource));
    };
    
    const handlePatternImageUpload = async (file: File) => {
        const imageSource = await fileToBase64(file);
        setPatternImage(imageSource);
        setPatternImagePreview(getDisplaySrc(imageSource));
        setSelectedPatternId(null);
        setLocalPatterns([]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim() && baseImage) {
            onVisualise(baseImage, prompt, patternImage ?? undefined, imageCount);
        }
    };

    const handleGeneratePattern = async () => {
        if (!patternPrompt.trim()) return;
        setIsGeneratingPattern(true);
        try {
            const newPatterns = await onGeneratePattern(patternPrompt, imageCount);
            setLocalPatterns(newPatterns);
        } catch (e) {
            console.error("Failed to generate patterns", e);
        } finally {
            setIsGeneratingPattern(false);
        }
    };
    
    const selectLocalPattern = (pattern: GeneratedPattern) => {
        setPatternImage(pattern.source);
        setPatternImagePreview(pattern.src);
        setSelectedPatternId(pattern.id);
    };

    const clearPattern = () => {
        setPatternImage(null);
        setPatternImagePreview(null);
        setSelectedPatternId(null);
    }

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="flex items-center mb-6 border-b border-white/[0.07] pb-4">
                <button onClick={onBack} className="mr-4 p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors border border-white/[0.06]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Product Visualiser</h2>
                    <p className="text-zinc-400 text-xs font-normal">Render flats into photorealistic studio images with realistic fabrics and textures.</p>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 flex flex-col space-y-4">
                    <div className="bg-atelier-900/90 p-5 rounded-xl border border-white/[0.08]">
                        <h3 className="font-semibold mb-3 text-xs uppercase tracking-wider text-zinc-300 flex items-center font-mono">
                            <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] flex items-center justify-center mr-2.5 border border-indigo-500/20">01</span>
                            Input Technical Flat
                        </h3>
                        {baseImagePreview ? (
                             <div className="relative group overflow-hidden rounded-lg border border-white/[0.08] bg-zinc-900">
                                <img src={baseImagePreview || undefined} alt="Input" className="w-full h-60 object-contain p-3" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                    <button onClick={() => { setBaseImage(null); setBaseImagePreview(null); }} className="px-3.5 py-1.5 bg-white/10 border border-white/20 rounded-md text-white hover:bg-white/20 transition-colors text-xs font-medium">
                                        Change Image
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <FileUpload onFilesUpload={(files) => files[0] && handleBaseImageUpload(files[0])} />
                        )}
                    </div>
                     <div className="bg-atelier-900/90 p-5 rounded-xl border border-white/[0.08]">
                        <h3 className="font-semibold mb-3 text-xs uppercase tracking-wider text-zinc-300 flex items-center font-mono">
                            <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] flex items-center justify-center mr-2.5 border border-indigo-500/20">02</span>
                            Fabric Pattern <span className="ml-2 text-[10px] font-sans normal-case text-zinc-500 font-normal">(Optional)</span>
                        </h3>
                        
                        <div className="flex space-x-1 bg-atelier-950 p-1 rounded-md border border-white/[0.06] mb-3 w-fit">
                            <button type="button" onClick={() => setPatternMode('upload')} className={`px-3 py-1 text-[11px] font-mono uppercase tracking-wider rounded transition-all ${patternMode === 'upload' ? 'bg-atelier-800 text-white border border-white/[0.08] shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Upload</button>
                            <button type="button" onClick={() => setPatternMode('generate')} className={`px-3 py-1 text-[11px] font-mono uppercase tracking-wider rounded transition-all ${patternMode === 'generate' ? 'bg-atelier-800 text-white border border-white/[0.08] shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Generate AI</button>
                        </div>
                        
                        {patternImagePreview && (
                            <div className="mb-3 relative group w-full aspect-video rounded-lg overflow-hidden border border-white/[0.08]">
                                <img src={patternImagePreview || undefined} alt="Pattern" className="w-full h-full object-cover" />
                                <button onClick={clearPattern} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-sm">
                                    <span className="text-xs font-medium">Remove</span>
                                </button>
                            </div>
                        )}

                        {patternMode === 'upload' ? (
                            !patternImagePreview && <FileUpload onFilesUpload={(files) => files[0] && handlePatternImageUpload(files[0])} compact={true} />
                        ) : (
                            <div className="space-y-2.5">
                                <input 
                                    type="text"
                                    value={patternPrompt}
                                    onChange={(e) => setPatternPrompt(e.target.value)}
                                    placeholder="Describe pattern (e.g., houndstooth micro-check)..."
                                    className="w-full p-2.5 bg-atelier-950 border border-white/[0.08] rounded-lg focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 outline-none transition-all text-xs text-white placeholder-zinc-600 font-sans"
                                />
                                <button
                                    type="button"
                                    onClick={handleGeneratePattern}
                                    disabled={isGeneratingPattern || !patternPrompt.trim()}
                                    className="w-full flex justify-center items-center px-3 py-2 bg-atelier-800 text-zinc-200 font-medium text-xs rounded-lg hover:bg-atelier-750 transition-colors disabled:opacity-50 border border-white/[0.08]"
                                >
                                    {isGeneratingPattern ? <><Spinner/> <span className="ml-2">Generating...</span></> : 'Generate Pattern Swatch'}
                                </button>
                                {localPatterns.length > 0 && (
                                    <div className="grid grid-cols-4 gap-2 mt-2">
                                        {localPatterns.map(p => (
                                            <div key={p.id} onClick={() => selectLocalPattern(p)} className={`aspect-square rounded-md overflow-hidden cursor-pointer border transition-all ${selectedPatternId === p.id ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-white/[0.08] hover:border-zinc-500'}`}>
                                                <img src={p.src || undefined} alt={p.prompt} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-7 flex flex-col h-full">
                    <div className="bg-atelier-900/90 p-6 rounded-xl border border-white/[0.08] flex-grow flex flex-col relative overflow-hidden">
                         <h3 className="font-semibold mb-3 text-xs uppercase tracking-wider text-zinc-300 flex items-center font-mono">
                             <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] flex items-center justify-center mr-2.5 border border-indigo-500/20">03</span>
                             Fabric, Lighting & Styling Prompt
                         </h3>
                         <div className="relative flex-grow mb-6">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the garment's material, texture, silhouette drape, and color palette (e.g., tailored heavyweight Italian wool in matte charcoal with satin peak lapels and horn buttons)..."
                                className="w-full h-full min-h-[220px] p-5 bg-atelier-950 border border-white/[0.08] rounded-xl focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all text-zinc-100 text-sm placeholder-zinc-600 resize-none leading-relaxed font-sans"
                            />
                        </div>
                        <div className="flex items-center justify-between w-full mb-4 bg-atelier-950 p-3.5 rounded-lg border border-white/[0.07]">
                            <label htmlFor="imageCount" className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mr-4 whitespace-nowrap">Variations to Generate</label>
                            <input
                                id="imageCount"
                                type="range"
                                min="1"
                                max="4"
                                step="1"
                                value={imageCount}
                                onChange={(e) => setImageCount(Number(e.target.value))}
                                className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <span className="ml-4 text-white font-mono text-xs w-6 text-right">{imageCount}</span>
                        </div>
                        <button
                            type="submit"
                            disabled={!prompt.trim() || !baseImage}
                            className="w-full px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-all shadow-md shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed text-sm tracking-wide"
                        >
                            Visualise Studio Render
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};