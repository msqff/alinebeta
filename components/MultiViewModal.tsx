import React from 'react';
import { getDisplaySrc,  MultiViewAsset } from '../types';

interface MultiViewModalProps {
    asset: MultiViewAsset;
    onClose: () => void;
}

const downloadImage = (src: string, filename: string) => {
    const link = document.createElement('a');
    link.href = src;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const MultiViewModal: React.FC<MultiViewModalProps> = ({ asset, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="glass-panel rounded-2xl shadow-2xl border border-slate-700 w-full max-w-6xl m-4 flex flex-col h-[90vh] animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Multi-View Set</h2>
                        <p className="text-slate-400 text-sm">Generated complementary angles.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {asset.views.map((viewItem, index) => {
                            const src = getDisplaySrc(viewItem.source);
                            return (
                                <div key={index} className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-xl group relative">
                                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 z-10">
                                        <span className="text-xs font-bold text-white uppercase tracking-wider">{viewItem.view}</span>
                                    </div>
                                    <img 
                                        src={src} 
                                        alt={viewItem.view} 
                                        className="w-full h-auto object-contain bg-slate-800"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button 
                                            onClick={() => downloadImage(src, `${viewItem.view.replace(/\s/g, '_')}_${asset.id.slice(0,6)}.png`)}
                                            className="px-6 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg transform hover:scale-105 flex items-center"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Download High-Res
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};