import React from 'react';
import { Collection } from '../types';

interface HeaderProps {
    onShowPatterns: () => void;
    hasGeneratedPatterns: boolean;
    activeCollection: Collection | null;
    onExitCollection: () => void;
    activeItemName?: string;
    onExitItem?: () => void;
    onShowPromptLibrary: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
    onShowPatterns, 
    hasGeneratedPatterns, 
    activeCollection,
    onExitCollection,
    activeItemName,
    onExitItem,
    onShowPromptLibrary
}) => {
    return (
        <header className="px-6 py-3 border-b border-white/5 bg-slate-950/40 backdrop-blur-lg sticky top-0 z-30 flex-shrink-0">
            <div className="max-w-screen-2xl mx-auto flex justify-between items-center w-full">
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-4 cursor-pointer" onClick={onExitCollection}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold tracking-tight text-white leading-none mb-1">
                                A-LINE AI
                            </h1>
                            <p className="text-slate-400 text-[10px] font-semibold tracking-widest uppercase">Professional Design Suite</p>
                        </div>
                    </div>

                    {/* Project Bar */}
                    {activeCollection && (
                        <>
                            <div className="h-8 w-px bg-white/10 mx-2"></div>
                            <div className="flex items-center space-x-4 animate-fade-in">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Active Collection</span>
                                    <div className="flex items-center">
                                        <span className="text-sm font-bold text-white cursor-pointer hover:text-indigo-400 transition-colors" onClick={onExitItem}>{activeCollection.name}</span>
                                        {activeItemName && (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                                <span className="text-sm font-bold text-indigo-300">{activeItemName}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {!activeItemName && (
                                    <div className="flex space-x-1">
                                        {activeCollection.extractedPalette.map((color, i) => (
                                            <div key={i} className="w-6 h-6 rounded-full border border-white/10 shadow-sm" style={{ backgroundColor: color }} title={color}></div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center space-x-3">
                    {activeItemName && (
                         <button 
                            onClick={onExitItem}
                            className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all mr-2 flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Line Sheet
                        </button>
                    )}
                    {activeCollection && !activeItemName && (
                         <button 
                            onClick={onExitCollection}
                            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors mr-2"
                        >
                            Switch Collection
                        </button>
                    )}
                    {!activeItemName && (
                        <>
                            <button 
                                onClick={onShowPromptLibrary}
                                className="px-4 py-2 text-xs font-medium bg-white/5 border border-white/10 text-slate-300 rounded-lg hover:bg-white/10 hover:text-white transition-all"
                            >
                                Prompt Library
                            </button>
                        </>
                    )}
                    {hasGeneratedPatterns && (
                         <button 
                            onClick={onShowPatterns}
                            className="px-4 py-2 text-xs font-medium text-indigo-300 hover:text-indigo-100 transition-colors"
                        >
                            View Patterns
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};