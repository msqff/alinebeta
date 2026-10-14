import React, { useState, useRef, useEffect } from 'react';
import { Collection } from '../types';

interface HeaderProps {
    onShowPatterns: () => void;
    hasGeneratedPatterns: boolean;
    activeCollection: Collection | null;
    onExitCollection: () => void;
    onEditCollection?: () => void;
    activeItemName?: string;
    onExitItem?: () => void;
    onShowPromptLibrary: () => void;
    onShowDataViewer: () => void;
    onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
    onShowPatterns, 
    hasGeneratedPatterns, 
    activeCollection,
    onExitCollection,
    onEditCollection,
    activeItemName,
    onExitItem,
    onShowPromptLibrary,
    onShowDataViewer,
    onSignOut
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="px-6 py-2.5 border-b border-white/[0.07] bg-atelier-950/85 backdrop-blur-xl sticky top-0 z-30 flex-shrink-0">
            <div className="max-w-screen-2xl mx-auto flex justify-between items-center w-full">
                <div className="flex items-center space-x-5">
                    <div 
                        className="flex items-center space-x-3 cursor-pointer group" 
                        onClick={onExitCollection}
                        title="Return to Collections overview"
                    >
                        <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center border border-white/10 group-hover:border-indigo-500/50 shadow-inner transition-colors">
                            <span className="font-mono text-sm font-bold tracking-tighter text-white">A<span className="text-indigo-400">/</span>L</span>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-base font-bold tracking-tight text-white leading-tight flex items-center gap-1.5">
                                A-LINE AI
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-normal">STUDIO</span>
                            </h1>
                            <p className="text-zinc-500 text-[9px] font-mono tracking-[0.2em] uppercase">Fashion Operating System</p>
                        </div>
                    </div>

                    {/* Architectural Breadcrumb Trail */}
                    {activeCollection && (
                        <>
                            <span className="text-zinc-700 select-none">/</span>
                            <div className="flex items-center space-x-3 animate-fade-in">
                                <div className="flex items-center gap-2">
                                    <span 
                                        className="text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                        title="Back to Line Sheet" 
                                        onClick={onExitItem}
                                    >
                                        {activeCollection.name}
                                    </span>
                                    {!activeItemName && onEditCollection && (
                                        <button 
                                            onClick={onEditCollection}
                                            className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 hover:bg-white/[0.04] rounded"
                                            title="Edit Collection Settings"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </button>
                                    )}
                                    {activeItemName && (
                                        <>
                                            <span className="text-zinc-700 select-none">/</span>
                                            <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{activeItemName}</span>
                                        </>
                                    )}
                                </div>
                                {!activeItemName && activeCollection.extractedPalette && activeCollection.extractedPalette.length > 0 && (
                                    <div className="hidden sm:flex items-center space-x-1 pl-2 border-l border-white/[0.08]">
                                        {activeCollection.extractedPalette.slice(0, 5).map((color, i) => (
                                            <div 
                                                key={i} 
                                                className="w-4 h-4 rounded-full border border-white/20 shadow-sm" 
                                                style={{ backgroundColor: color }} 
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center space-x-2.5">
                    {activeItemName && (
                         <button 
                            onClick={onExitItem}
                            className="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] rounded-lg transition-all flex items-center gap-1.5"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Line Sheet</span>
                        </button>
                    )}
                    {activeCollection && !activeItemName && (
                         <button 
                            onClick={onExitCollection}
                            className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                        >
                            Switch Collection
                        </button>
                    )}
                    
                    {/* Atelier Quick Utility Menu */}
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="px-3 py-1.5 flex items-center gap-2 text-xs font-medium bg-white/[0.03] border border-white/[0.08] text-zinc-300 rounded-lg hover:bg-white/[0.08] hover:text-white transition-all"
                        >
                            <span>Studio Options</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-52 bg-atelier-900 border border-white/[0.09] rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl py-1 animate-fade-in">
                                <button 
                                    onClick={() => {
                                        onShowPromptLibrary();
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-xs text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-colors flex items-center gap-2.5"
                                >
                                    <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    Prompt Library
                                </button>
                                <button 
                                    onClick={() => {
                                        onShowDataViewer();
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-xs text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-colors flex items-center gap-2.5"
                                >
                                    <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                    </svg>
                                    Data Viewer
                                </button>
                                {hasGeneratedPatterns && (
                                    <button 
                                        onClick={() => {
                                            onShowPatterns();
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-xs text-indigo-300 hover:bg-indigo-500/10 hover:text-indigo-200 transition-colors flex items-center gap-2.5"
                                    >
                                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                        </svg>
                                        Pattern Library
                                    </button>
                                )}
                                <div className="h-px bg-white/[0.06] my-1" />
                                <button 
                                    onClick={() => {
                                        onSignOut();
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2.5"
                                >
                                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};