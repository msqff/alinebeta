import React from 'react';
import { GeneratedPattern } from '../types';

interface PatternGalleryModalProps {
    patterns: GeneratedPattern[];
    onClose: () => void;
}

const downloadImage = (src: string, prompt: string) => {
    const link = document.createElement('a');
    link.href = src;
    const safePrompt = prompt.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    link.download = `pattern_${safePrompt}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const PatternGalleryModal: React.FC<PatternGalleryModalProps> = ({ patterns, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40"
            onClick={onClose}
        >
            <div 
                className="glass-panel rounded-2xl shadow-2xl border border-slate-700 p-8 w-full max-w-6xl m-4 flex flex-col animate-fade-in"
                style={{maxHeight: '90vh'}}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-8 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Generated Pattern Library</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="overflow-y-auto pr-2 -mr-2 custom-scrollbar">
                     {patterns.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                            <p className="text-lg font-light">No patterns generated yet.</p>
                        </div>
                     ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {patterns.map((pattern) => (
                                <div key={pattern.id} className="relative group flex-shrink-0 rounded-xl overflow-hidden shadow-lg border border-slate-700">
                                    <img src={pattern.src || undefined} alt={pattern.prompt} className="w-full h-auto aspect-square object-cover" />
                                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col p-4 justify-end backdrop-blur-sm">
                                        <p className="text-xs text-white mb-3 line-clamp-3 font-medium text-center">{pattern.prompt}</p>
                                        <button 
                                            onClick={() => downloadImage(pattern.src, pattern.prompt)}
                                            className="w-full text-xs px-3 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition-colors shadow-md"
                                        >
                                            Download Tile
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
};