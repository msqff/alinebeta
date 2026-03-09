import React, { useState } from 'react';
import { GalleryItem } from '../types';

interface VideoGeneratorProps {
    onGenerate: (baseImage: GalleryItem, prompt: string) => void;
    onBack: () => void;
    inputImage: GalleryItem | null;
}

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onGenerate, onBack, inputImage }) => {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim() && inputImage) {
            onGenerate(inputImage, prompt);
        }
    };
    
    if (!inputImage) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
                <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800 max-w-md">
                    <p className="text-slate-400 text-lg mb-6">Please select a <strong>Model Shot</strong> from the gallery to generate a video.</p>
                     <button onClick={onBack} className="px-8 py-3 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-700 transition-colors border border-slate-700">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="flex items-center mb-8 border-b border-white/5 pb-6">
                 <button onClick={onBack} className="mr-6 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Video Generator</h2>
                    <p className="text-slate-400 mt-1 font-light">Create cinematic motion from your static shots.</p>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="flex flex-col bg-slate-950/40 p-6 rounded-2xl border border-white/5 shadow-inner">
                    <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-slate-400 flex items-center"><span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center mr-3 border border-indigo-500/30">1</span> Reference Image</h3>
                    <div className="w-full flex-grow bg-slate-900/50 rounded-xl border border-slate-800 p-6 flex items-center justify-center overflow-hidden">
                        <img src={inputImage.src} alt="Source Model Shot" className="max-w-full max-h-[450px] object-contain rounded-lg shadow-2xl" />
                    </div>
                </div>

                <div className="flex flex-col bg-slate-950/40 p-6 rounded-2xl border border-white/5 shadow-inner">
                    <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-slate-400 flex items-center"><span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center mr-3 border border-indigo-500/30">2</span> Motion Prompt</h3>
                    <div className="relative group flex-grow mb-6">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl opacity-10 group-focus-within:opacity-50 transition duration-500 blur"></div>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the camera movement and subject action (e.g., A slow cinematic zoom in as the model turns her head to the left)..."
                            className="relative w-full h-full p-6 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none transition-all text-white text-lg placeholder-slate-600 resize-none leading-relaxed"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!prompt.trim() || !inputImage}
                        className="w-full px-8 py-5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold rounded-xl hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-lg shadow-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed text-lg tracking-wide transform hover:-translate-y-0.5"
                    >
                        Generate Video
                    </button>
                </div>
            </form>
        </div>
    );
};