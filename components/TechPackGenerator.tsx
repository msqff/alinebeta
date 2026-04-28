import React from 'react';
import { FileUpload } from './common/FileUpload';
import { GalleryItem } from '../types';

interface TechPackGeneratorProps {
    onGenerate: (file: File) => void;
    onProceedWithImage?: () => void;
    inputImage?: GalleryItem | null;
    onBack: () => void;
}

export const TechPackGenerator: React.FC<TechPackGeneratorProps> = ({ onGenerate, onProceedWithImage, inputImage, onBack }) => {
    const handleFileUpload = (files: File[]) => {
        if (files.length > 0) {
            onGenerate(files[0]);
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
             <div className="flex items-center mb-8 border-b border-white/5 pb-6">
                <button onClick={onBack} className="mr-6 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Tech Pack Generator</h2>
                    <p className="text-slate-400 mt-1 font-light">Create detailed technical specifications from your designs.</p>
                </div>
            </div>

            <div className="flex-grow flex flex-col justify-center items-center max-w-2xl mx-auto w-full">
                <div className="bg-slate-950/40 p-10 rounded-2xl border border-white/5 shadow-inner w-full flex flex-col items-center">
                    <div className="bg-indigo-500/10 p-4 rounded-full mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    
                    {inputImage ? (
                        <div className="w-full flex flex-col items-center">
                            <h3 className="font-bold mb-6 text-sm uppercase tracking-wide text-slate-400 text-center">Selected Garment Image</h3>
                            <div className="relative group overflow-hidden rounded-xl border border-slate-700 bg-slate-900/80 w-full max-w-sm mb-6">
                                <img src={inputImage.src || undefined} alt="Selected" className="w-full h-64 object-contain p-4" />
                            </div>
                            <button 
                                onClick={onProceedWithImage}
                                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold tracking-wide transition-all shadow-lg shadow-indigo-500/20"
                            >
                                Generate Tech Pack
                            </button>
                            <p className="text-xs text-slate-500 mt-6 text-center max-w-md leading-relaxed">
                                Or select a different image from the gallery below.
                            </p>
                        </div>
                    ) : (
                        <>
                            <h3 className="font-bold mb-6 text-sm uppercase tracking-wide text-slate-400 text-center">Upload Finished Garment Image</h3>
                            <div className="w-full h-64">
                                 <FileUpload onFilesUpload={handleFileUpload} />
                            </div>
                            <p className="text-xs text-slate-500 mt-6 text-center max-w-md leading-relaxed">
                                Upload a studio-quality image of your garment, or select one from the gallery below. The AI will analyze features, materials, and construction details to build a comprehensive specification document.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};