import React from 'react';
import { FileUpload } from './common/FileUpload';

interface ProductReviewToolProps {
    onReview: (file: File) => void;
    onBack: () => void;
}

export const ProductReviewTool: React.FC<ProductReviewToolProps> = ({ onReview, onBack }) => {
    const handleFileUpload = (files: File[]) => {
        if (files.length > 0) {
            onReview(files[0]);
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
             <div className="flex items-center mb-8 border-b border-white/5 pb-6">
                <button onClick={onBack} className="mr-6 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Basic Audit</h2>
                    <p className="text-slate-400 mt-1 font-light">Audit designs for compliance, IP risks, and safety hazards.</p>
                </div>
            </div>

            <div className="flex-grow flex flex-col justify-center items-center max-w-2xl mx-auto w-full">
                <div className="bg-slate-950/40 p-10 rounded-2xl border border-white/5 shadow-inner w-full flex flex-col items-center">
                    <div className="bg-emerald-500/10 p-4 rounded-full mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h3 className="font-bold mb-6 text-sm uppercase tracking-wide text-slate-400 text-center">Upload Design for Audit</h3>
                    <div className="w-full h-64">
                         <FileUpload onFilesUpload={handleFileUpload} />
                    </div>
                    <p className="text-xs text-slate-500 mt-6 text-center max-w-md leading-relaxed">
                        The AI will act as an IP Lawyer and Safety Inspector, checking for potential trademark violations, copyright issues, strangulation risks, and other compliance hazards.
                    </p>
                </div>
            </div>
        </div>
    );
};