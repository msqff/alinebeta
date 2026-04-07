import React, { useState, useEffect } from 'react';
import { getDisplaySrc,  GalleryItem, ImageSource, GeneratedPattern } from '../types';
import { FileUpload } from './common/FileUpload';
import { fileToBase64 } from '../services/geminiService';
import { Spinner } from './common/Spinner';

interface ProductVisualiserProps {
    onVisualise: (baseImage: ImageSource, prompt: string, patternImage?: ImageSource) => void;
    onBack: () => void;
    inputImage: GalleryItem | null;
    onGeneratePattern: (prompt: string) => Promise<GeneratedPattern[]>;
}

export const ProductVisualiser: React.FC<ProductVisualiserProps> = ({ onVisualise, onBack, inputImage, onGeneratePattern }) => {
    const [prompt, setPrompt] = useState('');
    const [baseImage, setBaseImage] = useState<ImageSource | null>(inputImage?.source || null);
    const [patternImage, setPatternImage] = useState<ImageSource | null>(null);
    const [baseImagePreview, setBaseImagePreview] = useState<string | null>(inputImage?.src || null);
    const [patternImagePreview, setPatternImagePreview] = useState<string | null>(null);

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
            onVisualise(baseImage, prompt, patternImage ?? undefined);
        }
    };

    const handleGeneratePattern = async () => {
        if (!patternPrompt.trim()) return;
        setIsGeneratingPattern(true);
        try {
            const newPatterns = await onGeneratePattern(patternPrompt);
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
            <div className="flex items-center mb-8 border-b border-white/5 pb-6">
                <button onClick={onBack} className="mr-6 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Product Visualiser</h2>
                    <p className="text-slate-400 mt-1 font-light">Render sketches with realistic fabrics and textures.</p>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 flex flex-col space-y-6">
                    <div className="bg-slate-950/40 p-6 rounded-2xl border border-white/5 shadow-inner">
                        <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-slate-400 flex items-center"><span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center mr-3 border border-indigo-500/30">1</span> Input Sketch</h3>
                        {baseImagePreview ? (
                             <div className="relative group overflow-hidden rounded-xl border border-slate-700 bg-slate-900/80">
                                <img src={baseImagePreview} alt="Input" className="w-full h-64 object-contain p-4" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                    <button onClick={() => { setBaseImage(null); setBaseImagePreview(null); }} className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors text-sm font-medium">
                                        Change Image
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <FileUpload onFilesUpload={(files) => files[0] && handleBaseImageUpload(files[0])} />
                        )}
                    </div>
                     <div className="bg-slate-950/40 p-6 rounded-2xl border border-white/5 shadow-inner">
                        <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-slate-400 flex items-center"><span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center mr-3 border border-indigo-500/30">2</span> Fabric Pattern <span className="ml-2 text-xs normal-case text-slate-600 font-normal">(Optional)</span></h3>
                        
                        <div className="flex space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 mb-4 w-fit">
                            <button type="button" onClick={() => setPatternMode('upload')} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${patternMode === 'upload' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>Upload</button>
                            <button type="button" onClick={() => setPatternMode('generate')} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${patternMode === 'generate' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>Generate AI</button>
                        </div>
                        
                        {patternImagePreview && (
                            <div className="mb-4 relative group w-full aspect-video rounded-xl overflow-hidden border border-slate-600">
                                <img src={patternImagePreview} alt="Pattern" className="w-full h-full object-cover" />
                                <button onClick={clearPattern} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-sm">
                                    <span className="text-xs font-bold">REMOVE</span>
                                </button>
                            </div>
                        )}

                        {patternMode === 'upload' ? (
                            !patternImagePreview && <FileUpload onFilesUpload={(files) => files[0] && handlePatternImageUpload(files[0])} compact={true} />
                        ) : (
                            <div className="space-y-3">
                                <input 
                                    type="text"
                                    value={patternPrompt}
                                    onChange={(e) => setPatternPrompt(e.target.value)}
                                    placeholder="Describe pattern (e.g., vintage floral chintz)..."
                                    className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-white placeholder-slate-600"
                                />
                                <button
                                    type="button"
                                    onClick={handleGeneratePattern}
                                    disabled={isGeneratingPattern || !patternPrompt.trim()}
                                    className="w-full flex justify-center items-center px-4 py-3 bg-slate-800 text-white font-medium text-sm rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 border border-slate-700"
                                >
                                    {isGeneratingPattern ? <><Spinner/> <span className="ml-2">Generating...</span></> : 'Generate Pattern'}
                                </button>
                                {localPatterns.length > 0 && (
                                    <div className="grid grid-cols-4 gap-2 mt-2">
                                        {localPatterns.map(p => (
                                            <div key={p.id} onClick={() => selectLocalPattern(p)} className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedPatternId === p.id ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-transparent hover:border-slate-600'}`}>
                                                <img src={p.src} alt={p.prompt} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-7 flex flex-col h-full">
                    <div className="bg-slate-950/40 p-8 rounded-2xl border border-white/5 flex-grow flex flex-col shadow-inner relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-30"></div>
                         <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-slate-400 flex items-center"><span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center mr-3 border border-indigo-500/30">3</span> Material & Design Prompt</h3>
                         <div className="relative group flex-grow mb-8">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl opacity-10 group-focus-within:opacity-50 transition duration-500 blur"></div>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the garment's material, texture, and color details (e.g., heavy wool blend in navy blue with gold buttons)..."
                                className="relative w-full h-full min-h-[200px] p-6 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none transition-all text-white text-lg placeholder-slate-600 resize-none leading-relaxed"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!prompt.trim() || !baseImage}
                            className="w-full self-end px-8 py-5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold rounded-xl hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-lg shadow-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed text-lg tracking-wide transform hover:-translate-y-0.5"
                        >
                            Visualise Product
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};