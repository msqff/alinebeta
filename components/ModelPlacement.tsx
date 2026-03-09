import React, { useState, useEffect } from 'react';
import { GalleryItem, ImageSource } from '../types';
import { FileUpload } from './common/FileUpload';
import { fileToBase64 } from '../services/geminiService';

interface ModelPlacementProps {
    onPlace: (productImage: ImageSource, prompt: string) => void;
    onBack: () => void;
    inputImage: GalleryItem | null;
}

export const ModelPlacement: React.FC<ModelPlacementProps> = ({ onPlace, onBack, inputImage }) => {
    const [prompt, setPrompt] = useState('');
    const [productImage, setProductImage] = useState<ImageSource | null>(inputImage?.source || null);
    const [productImagePreview, setProductImagePreview] = useState<string | null>(inputImage?.src || null);

    useEffect(() => {
        if (inputImage) {
            setProductImage(inputImage.source);
            setProductImagePreview(inputImage.src);
        }
    }, [inputImage]);

    const handleImageUpload = async (file: File) => {
        const imageSource = await fileToBase64(file);
        setProductImage(imageSource);
        setProductImagePreview(`data:${imageSource.mimeType};base64,${imageSource.data}`);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim() && productImage) {
            onPlace(productImage, prompt);
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="flex items-center mb-8 border-b border-white/5 pb-6">
                 <button onClick={onBack} className="mr-6 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Model Placement</h2>
                    <p className="text-slate-400 mt-1 font-light">Showcase your garment on a professional AI model.</p>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="flex flex-col bg-slate-950/40 p-6 rounded-2xl border border-white/5 shadow-inner">
                    <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-slate-400 flex items-center"><span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center mr-3 border border-indigo-500/30">1</span> Product Source</h3>
                    {productImagePreview ? (
                         <div className="relative group flex-grow flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden p-4">
                            <img src={productImagePreview} alt="Product" className="max-w-full max-h-[450px] object-contain drop-shadow-xl" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                <button onClick={() => { setProductImage(null); setProductImagePreview(null); }} className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors text-sm font-medium">
                                    Change Image
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col justify-center">
                            <FileUpload onFilesUpload={(files) => files[0] && handleImageUpload(files[0])} />
                        </div>
                    )}
                </div>

                <div className="flex flex-col bg-slate-950/40 p-6 rounded-2xl border border-white/5 shadow-inner">
                    <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-slate-400 flex items-center"><span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center mr-3 border border-indigo-500/30">2</span> Scene & Model</h3>
                     <div className="relative group flex-grow mb-6">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl opacity-10 group-focus-within:opacity-50 transition duration-500 blur"></div>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the model and the setting (e.g., A diverse female model walking confidently on a Paris street, sunlit, shallow depth of field)..."
                            className="relative w-full h-full p-6 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none transition-all text-white text-lg placeholder-slate-600 resize-none leading-relaxed"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!prompt.trim() || !productImage}
                        className="w-full px-8 py-5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold rounded-xl hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-lg shadow-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed text-lg tracking-wide transform hover:-translate-y-0.5"
                    >
                        Generate Model Shot
                    </button>
                </div>
            </form>
        </div>
    );
};