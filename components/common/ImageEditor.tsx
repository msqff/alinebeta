import React, { useState, useRef } from 'react';
import { GalleryItem, ImageSource } from '../../types';
import InpaintingCanvas, { InpaintingCanvasRef } from './InpaintingCanvas';

interface ImageEditorProps {
    title: string;
    description: string;
    placeholder: string;
    submitButtonText: string;
    onGenerate: (baseImage: ImageSource, prompt: string, maskImage?: ImageSource) => void;
    onBack: () => void;
    inputImage: GalleryItem;
}

const dataUrlToImageSource = (dataUrl: string): ImageSource => {
    const [header, data] = dataUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
    return { data, mimeType };
};

export const ImageEditor: React.FC<ImageEditorProps> = ({ 
    title, description, placeholder, submitButtonText, onGenerate, onBack, inputImage 
}) => {
    const [prompt, setPrompt] = useState('');
    const [brushSize, setBrushSize] = useState(40);
    const canvasRef = useRef<InpaintingCanvasRef>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim() && inputImage) {
            const maskDataUrl = canvasRef.current?.getMaskDataUrl();
            const maskImage = maskDataUrl ? dataUrlToImageSource(maskDataUrl) : undefined;
            onGenerate(inputImage.source, prompt, maskImage);
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
             <div className="flex items-center mb-8 border-b border-white/5 pb-6">
                <button onClick={onBack} className="mr-6 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">{title}</h2>
                    <p className="text-slate-400 mt-1 font-light">{description}</p>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="flex flex-col bg-slate-950/40 p-6 rounded-2xl border border-white/5 shadow-inner items-center">
                     <div className="flex items-center justify-between w-full mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                        <label htmlFor="brushSize" className="text-xs font-bold uppercase text-slate-500 mr-4 whitespace-nowrap">Brush Size</label>
                        <input
                            id="brushSize"
                            type="range"
                            min="5"
                            max="100"
                            value={brushSize}
                            onChange={(e) => setBrushSize(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <span className="ml-4 text-white font-mono text-sm w-8 text-right">{brushSize}</span>
                    </div>
                    <InpaintingCanvas 
                        ref={canvasRef}
                        imageSrc={inputImage.src}
                        brushSize={brushSize}
                    />
                    <div className="flex items-center space-x-4 mt-6 w-full">
                        <button type="button" onClick={() => canvasRef.current?.undo()} className="flex-1 px-4 py-3 text-sm font-bold uppercase tracking-wide bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors border border-slate-700">Undo</button>
                        <button type="button" onClick={() => canvasRef.current?.clear()} className="flex-1 px-4 py-3 text-sm font-bold uppercase tracking-wide bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors border border-slate-700">Clear Mask</button>
                    </div>
                </div>

                <div className="flex flex-col bg-slate-950/40 p-6 rounded-2xl border border-white/5 shadow-inner">
                    <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-slate-400 flex items-center">Instruction Prompt</h3>
                    <div className="relative group flex-grow mb-6">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl opacity-10 group-focus-within:opacity-50 transition duration-500 blur"></div>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={placeholder}
                            className="relative w-full h-full p-6 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none transition-all text-white text-lg placeholder-slate-600 resize-none leading-relaxed"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!prompt.trim() || !inputImage}
                        className="w-full px-8 py-5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold rounded-xl hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-lg shadow-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed text-lg tracking-wide transform hover:-translate-y-0.5"
                    >
                        {submitButtonText}
                    </button>
                </div>
            </form>
        </div>
    );
};