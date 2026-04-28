import React, { useState, useEffect } from 'react';
import { getDisplaySrc,  GalleryItem, ImageSource } from '../types';
import { FileUpload } from './common/FileUpload';
import { Spinner } from './common/Spinner';
import { fileToBase64 } from '../services/geminiService';

interface MultiViewGeneratorProps {
    onGenerate: (baseImage: ImageSource, views: string[]) => Promise<{view: string, image: ImageSource}[]>;
    onSaveToGallery: (images: {view: string, image: ImageSource}[], sourceImage: ImageSource) => void;
    onBack: () => void;
    inputImage: GalleryItem | null;
}

export const MultiViewGenerator: React.FC<MultiViewGeneratorProps> = ({ onGenerate, onSaveToGallery, onBack, inputImage }) => {
    const [baseImage, setBaseImage] = useState<ImageSource | null>(inputImage?.source || null);
    const [baseImagePreview, setBaseImagePreview] = useState<string | null>(inputImage?.src || null);
    
    const [views, setViews] = useState({
        'Back': true,
        'Side (Left)': true,
        'Side (Right)': true,
        'Detail Zoom': true
    });

    const [generatedResults, setGeneratedResults] = useState<{ [key: string]: string | null }>({});
    const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
    const [globalLoading, setGlobalLoading] = useState(false);
    const [resultSources, setResultSources] = useState<{view: string, image: ImageSource}[]>([]);

    useEffect(() => {
        if (inputImage) {
            setBaseImage(inputImage.source);
            setBaseImagePreview(inputImage.src);
        }
    }, [inputImage]);

    const handleImageUpload = async (file: File) => {
        const imageSource = await fileToBase64(file);
        setBaseImage(imageSource);
        setBaseImagePreview(getDisplaySrc(imageSource));
        setGeneratedResults({});
        setResultSources([]);
    };

    const toggleView = (view: string) => {
        setViews(prev => ({ ...prev, [view as keyof typeof views]: !prev[view as keyof typeof views] }));
    };

    const handleGenerate = async () => {
        if (!baseImage) return;

        const viewsToGenerate = Object.keys(views).filter(k => views[k as keyof typeof views]);
        if (viewsToGenerate.length === 0) return;

        setGlobalLoading(true);
        const newLoadingStates = { ...loadingStates };
        viewsToGenerate.forEach(v => newLoadingStates[v] = true);
        setLoadingStates(newLoadingStates);

        try {
            const results = await onGenerate(baseImage, viewsToGenerate);
            
            const newGeneratedResults = { ...generatedResults };
            const newResultSources = [...resultSources];

            results.forEach(res => {
                newGeneratedResults[res.view] = getDisplaySrc(res.image);
                // Remove existing result for this view if it exists (for regeneration)
                const existingIdx = newResultSources.findIndex(r => r.view === res.view);
                if (existingIdx >= 0) {
                    newResultSources[existingIdx] = res;
                } else {
                    newResultSources.push(res);
                }
            });

            setGeneratedResults(newGeneratedResults);
            setResultSources(newResultSources);

        } catch (e) {
            console.error("Multi-view generation failed", e);
        } finally {
            setGlobalLoading(false);
            setLoadingStates({});
        }
    };

    const handleRegenerateSingle = async (view: string) => {
        if (!baseImage) return;
        setLoadingStates(prev => ({ ...prev, [view]: true }));
        try {
            const results = await onGenerate(baseImage, [view]);
            if (results.length > 0) {
                const res = results[0];
                setGeneratedResults(prev => ({ ...prev, [view]: getDisplaySrc(res.image) }));
                setResultSources(prev => {
                    const idx = prev.findIndex(r => r.view === view);
                    if (idx >= 0) {
                        const newSrcs = [...prev];
                        newSrcs[idx] = res;
                        return newSrcs;
                    }
                    return [...prev, res];
                });
            }
        } catch (e) {
            console.error(`Regenerating ${view} failed`, e);
        } finally {
            setLoadingStates(prev => ({ ...prev, [view]: false }));
        }
    };

    const viewKeys = ['Back', 'Side (Left)', 'Side (Right)', 'Detail Zoom'];

    return (
        <div className="flex flex-col h-full animate-fade-in">
             <div className="flex items-center mb-8 border-b border-white/5 pb-6">
                <button onClick={onBack} className="mr-6 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Multi-View Generator</h2>
                    <p className="text-slate-400 mt-1 font-light">Generate consistent back, side, and detail views from a single image.</p>
                </div>
            </div>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                {/* Left Column: Controls */}
                <div className="lg:col-span-4 flex flex-col space-y-6">
                    <div className="bg-slate-950/40 p-6 rounded-2xl border border-white/5 shadow-inner">
                        <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-slate-400">Source Image (Front)</h3>
                         {baseImagePreview ? (
                             <div className="relative group overflow-hidden rounded-xl border border-slate-700 bg-slate-900/80 mb-4">
                                <img src={baseImagePreview || undefined} alt="Input" className="w-full h-auto max-h-[350px] object-contain p-2" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                    <button onClick={() => { setBaseImage(null); setBaseImagePreview(null); setGeneratedResults({}); setResultSources([]); }} className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors text-sm font-medium">
                                        Change Image
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-64">
                                <FileUpload onFilesUpload={(files) => files[0] && handleImageUpload(files[0])} />
                            </div>
                        )}

                        <div className="mt-6">
                            <h3 className="font-bold mb-3 text-sm uppercase tracking-wide text-slate-400">Views to Generate</h3>
                            <div className="space-y-3">
                                {viewKeys.map(view => (
                                    <label key={view} className="flex items-center space-x-3 cursor-pointer group p-3 rounded-lg hover:bg-slate-800/50 border border-transparent hover:border-slate-700 transition-all">
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${views[view as keyof typeof views] ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600 bg-slate-900'}`}>
                                            {views[view as keyof typeof views] && <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                        </div>
                                        <input type="checkbox" checked={views[view as keyof typeof views]} onChange={() => toggleView(view)} className="hidden" />
                                        <span className={`text-sm font-medium ${views[view as keyof typeof views] ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{view}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                         <button
                            onClick={handleGenerate}
                            disabled={!baseImage || globalLoading || Object.values(views).every(v => !v)}
                            className="w-full mt-6 px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold rounded-xl hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-lg shadow-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed text-lg tracking-wide transform hover:-translate-y-0.5"
                        >
                            {globalLoading ? 'Extrapolating Angles...' : 'Generate Views'}
                        </button>
                    </div>
                </div>

                {/* Right Column: Grid */}
                <div className="lg:col-span-8 flex flex-col">
                    <div className="bg-slate-950/40 p-8 rounded-2xl border border-white/5 h-full flex flex-col shadow-inner">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-sm uppercase tracking-wide text-slate-400">Generated Views</h3>
                            {resultSources.length > 0 && (
                                <button
                                    onClick={() => baseImage && onSaveToGallery(resultSources, baseImage)}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm shadow-lg shadow-emerald-900/20 transition-all"
                                >
                                    Save All to Gallery
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-6 flex-grow">
                             {viewKeys.map(view => (
                                 <div key={view} className="relative rounded-xl border border-slate-700 bg-slate-900 overflow-hidden group min-h-[200px] flex flex-col">
                                     {/* Header */}
                                     <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-start pointer-events-none">
                                        <span className="text-xs font-bold uppercase tracking-wider text-white bg-slate-800/80 px-2 py-1 rounded backdrop-blur-md">{view}</span>
                                     </div>

                                     {/* Content */}
                                     <div className="flex-grow flex items-center justify-center relative bg-slate-900">
                                        {loadingStates[view] ? (
                                            <div className="flex flex-col items-center">
                                                <Spinner />
                                                <span className="text-xs text-slate-400 mt-2 animate-pulse">Processing...</span>
                                            </div>
                                        ) : generatedResults[view] ? (
                                            <img src={generatedResults[view]!} alt={view} className="w-full h-full object-cover absolute inset-0" />
                                        ) : (
                                            <div className="text-slate-600 flex flex-col items-center p-4 text-center">
                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1.586-1.586a2 2 0 00-2.828 0L6 14m6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                 <span className="text-xs font-medium opacity-50">{view} Placeholder</span>
                                            </div>
                                        )}
                                     </div>

                                     {/* Hover Actions */}
                                     {generatedResults[view] && !loadingStates[view] && (
                                         <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4 backdrop-blur-sm z-20">
                                              <button 
                                                onClick={() => {
                                                    const w = window.open('about:blank');
                                                    if (w) {
                                                        const img = new Image();
                                                        img.src = generatedResults[view]!;
                                                        setTimeout(() => {
                                                            w.document.write(img.outerHTML);
                                                            w.document.close();
                                                        }, 0);
                                                    }
                                                }}
                                                className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors" title="Zoom"
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                              </button>
                                              <button 
                                                onClick={() => handleRegenerateSingle(view)}
                                                className="p-3 bg-indigo-600/80 rounded-full text-white hover:bg-indigo-500 transition-colors shadow-lg" title="Regenerate"
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                              </button>
                                         </div>
                                     )}
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};