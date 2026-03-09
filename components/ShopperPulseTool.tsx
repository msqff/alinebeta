import React from 'react';
import { FileUpload } from './common/FileUpload';

interface ShopperPulseToolProps {
    onPulse: (file: File) => void;
    onBack: () => void;
}

export const ShopperPulseTool: React.FC<ShopperPulseToolProps> = ({ onPulse, onBack }) => {
    const handleFileUpload = (files: File[]) => {
        if (files.length > 0) {
            onPulse(files[0]);
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
             <div className="flex items-center mb-8 border-b border-white/5 pb-6">
                <button onClick={onBack} className="mr-6 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Shopper Pulse</h2>
                    <p className="text-slate-400 mt-1 font-light">UK High Street commercial viability testing.</p>
                </div>
            </div>

            <div className="flex-grow flex flex-col justify-center items-center max-w-2xl mx-auto w-full">
                <div className="bg-slate-950/40 p-10 rounded-2xl border border-white/5 shadow-inner w-full flex flex-col items-center">
                    <div className="bg-pink-500/10 p-4 rounded-full mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                    <h3 className="font-bold mb-6 text-sm uppercase tracking-wide text-slate-400 text-center">Upload Product Image</h3>
                    <div className="w-full h-64">
                         <FileUpload onFilesUpload={handleFileUpload} />
                    </div>
                    <p className="text-xs text-slate-500 mt-6 text-center max-w-md leading-relaxed">
                        Get instant feedback from AI personas representing "The Value Seeker", "The Quality Conscious", and "The Trend Hunter" shoppers in the UK market.
                    </p>
                </div>
            </div>
        </div>
    );
};