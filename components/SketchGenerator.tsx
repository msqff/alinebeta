import React, { useState } from 'react';
import { TechPackItem, ImageSource, getDisplaySrc } from '../types';
import { FileUpload } from './common/FileUpload';
import { InteractiveAttributeRow } from './InteractiveAttributeRow';
import { fileToBase64, analyzeReferenceImage } from '../services/geminiService';
import { Spinner } from './common/Spinner';

interface SketchGeneratorProps {
    onGenerate: (prompt: string, imageCount: number) => void;
    onBack: () => void;
}

export const SketchGenerator: React.FC<SketchGeneratorProps> = ({ onGenerate, onBack }) => {
    const [mode, setMode] = useState<'text' | 'reference'>('text');
    const [prompt, setPrompt] = useState('');
    const [imageCount, setImageCount] = useState(4);
    
    // Reference Analysis State
    const [referenceImage, setReferenceImage] = useState<ImageSource | null>(null);
    const [referenceFile, setReferenceFile] = useState<File | null>(null);
    const [referenceDescription, setReferenceDescription] = useState('');
    const [attributes, setAttributes] = useState<TechPackItem[]>([]);
    const [additionalInstructions, setAdditionalInstructions] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzeError, setAnalyzeError] = useState<string | null>(null);

    const handleFileSelect = async (files: File[]) => {
        if (files[0]) {
            const file = files[0];
            setReferenceFile(file);
            setAnalyzeError(null);
            
            try {
                const source = await fileToBase64(file);
                setReferenceImage(source);
                
                setIsAnalyzing(true);
                const results = await analyzeReferenceImage(source);
                
                setReferenceDescription(results.description || '');
                
                const initialAttributes: TechPackItem[] = Object.entries(results.attributes || {}).map(([key, data]) => ({
                    id: self.crypto.randomUUID(),
                    label: key,
                    value: data.value,
                    options: data.alternatives || []
                }));
                
                setAttributes(initialAttributes);
            } catch (err: any) {
                setAnalyzeError(err.message || 'Failed to analyze image.');
            } finally {
                setIsAnalyzing(false);
            }
        }
    };

    const handleUpdateAttribute = (updated: TechPackItem) => {
        setAttributes(prev => prev.map(a => a.id === updated.id ? updated : a));
    };

    const handleDeleteAttribute = (id: string) => {
        setAttributes(prev => prev.filter(a => a.id !== id));
    };

    const handleAddAttribute = () => {
        setAttributes(prev => [...prev, {
            id: self.crypto.randomUUID(),
            label: '',
            value: '',
            options: []
        }]);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        let finalPrompt = '';
        
        if (mode === 'text') {
            finalPrompt = prompt.trim();
        } else {
            const compiledAttributes = attributes
                .filter(a => a.label.trim() && a.value.trim())
                .map(a => `${a.label}: ${a.value}`)
                .join(', ');
                
            const baseDesc = referenceDescription.trim() || 'A garment design';
            finalPrompt = compiledAttributes ? `${baseDesc} with ${compiledAttributes}.` : `${baseDesc}.`;
            
            if (additionalInstructions.trim()) {
                finalPrompt += ` Additional details: ${additionalInstructions.trim()}`;
            }
        }
        
        if (finalPrompt) {
            onGenerate(finalPrompt, imageCount);
        }
    };

    const isSubmitDisabled = mode === 'text' ? !prompt.trim() : (attributes.length === 0 && !additionalInstructions.trim());

    return (
        <div className="flex flex-col h-full animate-fade-in relative">
            <div className="flex items-center mb-8 border-b border-white/5 pb-6">
                <button onClick={onBack} className="mr-6 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Sketch Generator</h2>
                    <p className="text-slate-400 mt-1 font-light">Turn your concepts into professional fashion flats.</p>
                </div>
            </div>

            <div className="flex justify-center mb-6">
                <div className="bg-slate-900/50 p-1 rounded-xl flex items-center border border-white/5 shadow-inner">
                    <button 
                        onClick={() => setMode('text')} 
                        className={`px-6 py-2 rounded-lg text-sm font-bold tracking-wide transition-all ${mode === 'text' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                    >
                        Text Brief
                    </button>
                    <button 
                        onClick={() => setMode('reference')} 
                        className={`px-6 py-2 rounded-lg text-sm font-bold tracking-wide transition-all ${mode === 'reference' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                    >
                        Reference Analysis
                    </button>
                </div>
            </div>

            {mode === 'text' ? (
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col max-w-4xl mx-auto w-full">
                    <div className="flex-grow mb-8">
                        <label htmlFor="prompt" className="block text-xs font-bold uppercase text-slate-500 mb-3 ml-1">Design Description</label>
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-20 group-focus-within:opacity-100 transition duration-500 blur"></div>
                            <textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the garment in detail (e.g., A structured wool blazer with peaked lapels, double-breasted closure, and flap pockets)..."
                                className="relative w-full h-72 p-6 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none text-lg text-white placeholder-slate-600 resize-none leading-relaxed"
                            />
                        </div>
                    </div>
                </form>
            ) : (
                <div className="flex-grow flex flex-col md:flex-row gap-6 max-w-6xl mx-auto w-full">
                    <div className="flex-1 flex flex-col min-h-[400px]">
                        {!referenceImage ? (
                            <div className="flex-grow flex flex-col justify-center bg-slate-900/40 border border-white/5 rounded-2xl p-6">
                                <FileUpload onFilesUpload={handleFileSelect} multiple={false} />
                            </div>
                        ) : (
                            <div className="flex-grow bg-slate-900/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-center items-center relative overflow-hidden group">
                                <img src={getDisplaySrc(referenceImage)} alt="Reference" className="max-h-[300px] w-auto object-contain rounded-lg shadow-xl" />
                                
                                <div className="absolute top-4 left-4 right-4 bg-orange-500/20 border border-orange-500/50 text-orange-200 text-xs p-3 rounded-lg flex items-start backdrop-blur-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p>Reference image used for visual analysis only. It is not saved to your asset history or database.</p>
                                </div>

                                <button 
                                    onClick={() => {
                                        setReferenceImage(null);
                                        setReferenceFile(null);
                                        setReferenceDescription('');
                                        setAttributes([]);
                                    }}
                                    className="absolute bottom-4 bg-slate-800/80 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold backdrop-blur transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    Replace Image
                                </button>
                            </div>
                        )}
                        {analyzeError && (
                            <div className="mt-4 bg-red-500/20 text-red-200 text-sm p-3 rounded-lg text-center">
                                {analyzeError}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1 flex flex-col min-h-[400px]">
                        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 flex-grow flex flex-col">
                            <h3 className="text-lg font-bold text-white mb-4">Design Profile</h3>
                            
                            {!referenceImage && !isAnalyzing ? (
                                <div className="flex-grow flex items-center justify-center text-slate-500 text-center flex-col">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    <p>Upload a reference image to extract structured attributes.</p>
                                </div>
                            ) : isAnalyzing ? (
                                <div className="flex-grow flex items-center justify-center flex-col">
                                    <Spinner size="lg" />
                                    <p className="mt-4 text-slate-400 font-medium">Analyzing design & construction...</p>
                                </div>
                            ) : (
                                <div className="flex-grow flex flex-col">
                                    <div className="mb-6">
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Generic Description</label>
                                        <input
                                            type="text"
                                            value={referenceDescription}
                                            onChange={(e) => setReferenceDescription(e.target.value)}
                                            placeholder="What is this product? (e.g. A long sleeve knit sweater)"
                                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg text-slate-200 text-sm py-2 px-3 outline-none focus:border-indigo-500 transition-colors"
                                        />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Attributes</h4>
                                    <div className="overflow-y-auto max-h-[300px] custom-scrollbar pr-2 flex-grow">
                                        {attributes.map(item => (
                                            <InteractiveAttributeRow 
                                                key={item.id} 
                                                item={item} 
                                                onUpdate={handleUpdateAttribute} 
                                                onDelete={() => handleDeleteAttribute(item.id)} 
                                            />
                                        ))}
                                    </div>
                                    <button 
                                        onClick={handleAddAttribute}
                                        className="mt-4 mb-6 text-xs font-bold text-slate-500 hover:text-indigo-400 flex items-center transition-colors uppercase tracking-wide self-start"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Custom Field
                                    </button>

                                    <div className="mt-auto border-t border-slate-800 pt-4">
                                        <label htmlFor="additional" className="block text-xs font-bold uppercase text-slate-500 mb-2">Additional Instructions / Creative Notes</label>
                                        <textarea
                                            id="additional"
                                            value={additionalInstructions}
                                            onChange={(e) => setAdditionalInstructions(e.target.value)}
                                            placeholder="e.g. Add a bold horizontal stripe pattern, or add neon green piping along the seams..."
                                            className="w-full h-24 p-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:border-indigo-500 outline-none text-sm text-slate-300 placeholder-slate-600 resize-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col bg-slate-900/50 p-6 rounded-2xl border border-white/5 max-w-4xl mx-auto w-full mt-6">
                <div className="flex items-center justify-between w-full mb-6 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                    <label htmlFor="imageCount" className="text-xs font-bold uppercase text-slate-500 mr-4 whitespace-nowrap">Variations to Generate</label>
                    <input
                        id="imageCount"
                        type="range"
                        min="1"
                        max="4"
                        step="1"
                        value={imageCount}
                        onChange={(e) => setImageCount(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <span className="ml-4 text-white font-mono text-sm w-8 text-right">{imageCount}</span>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0 flex items-center text-slate-400 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Generates {imageCount} distinct variation{imageCount !== 1 ? 's' : ''} per request.
                    </div>
                    <button
                        type="button"
                        onClick={() => handleSubmit()}
                        disabled={isSubmitDisabled}
                        className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold rounded-xl hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-lg shadow-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                    >
                        Generate Sketches
                    </button>
                </div>
            </div>
        </div>
    );
};
