import React from 'react';
import { Tool } from '../types';

interface TopStudioBarProps {
    activeTool: Tool | null;
    onSelectTool: (tool: Tool) => void;
    onExitTool?: () => void;
    activeItemName?: string;
    onExitItem?: () => void;
    onOpenOverview?: () => void;
}

interface ToolConfig {
    id: Tool;
    label: string;
    shortLabel: string;
    description: string;
    icon: (isActive: boolean) => React.ReactElement;
}

const TOOLS: ToolConfig[] = [
    {
        id: 'moodboard',
        label: 'Mood Board',
        shortLabel: 'Mood',
        description: 'Concept & style DNA extraction',
        icon: (active) => (
            <svg className={`w-4 h-4 transition-colors ${active ? 'text-indigo-400' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        id: 'sketch',
        label: 'Sketch Flat',
        shortLabel: 'Sketch',
        description: 'Technical flats from prompt',
        icon: (active) => (
            <svg className={`w-4 h-4 transition-colors ${active ? 'text-indigo-400' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
        ),
    },
    {
        id: 'visualiser',
        label: 'Visualiser',
        shortLabel: 'Render',
        description: 'Photorealistic studio rendering',
        icon: (active) => (
            <svg className={`w-4 h-4 transition-colors ${active ? 'text-indigo-400' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21a4 4 0 01-4-4 5 5 0 015-5 5 5 0 015 5 4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
        ),
    },
    {
        id: 'multiview',
        label: 'Multi-View',
        shortLabel: 'Views',
        description: 'Front, back, side & detail',
        icon: (active) => (
            <svg className={`w-4 h-4 transition-colors ${active ? 'text-indigo-400' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
    },
    {
        id: 'model',
        label: 'Model Placement',
        shortLabel: 'Model',
        description: 'AI model showcase',
        icon: (active) => (
            <svg className={`w-4 h-4 transition-colors ${active ? 'text-indigo-400' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
    },
    {
        id: 'techpack',
        label: 'Tech Pack',
        shortLabel: 'Tech Pack',
        description: 'BOM & manufacturing specs',
        icon: (active) => (
            <svg className={`w-4 h-4 transition-colors ${active ? 'text-indigo-400' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        ),
    },
    {
        id: 'review',
        label: 'Basic Audit',
        shortLabel: 'Audit',
        description: 'IP & garment safety review',
        icon: (active) => (
            <svg className={`w-4 h-4 transition-colors ${active ? 'text-indigo-400' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
    },
    {
        id: 'shopperPulse',
        label: 'Shopper Pulse',
        shortLabel: 'Pulse',
        description: 'UK commercial viability test',
        icon: (active) => (
            <svg className={`w-4 h-4 transition-colors ${active ? 'text-indigo-400' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
        ),
    },
];

export const TopStudioBar: React.FC<TopStudioBarProps> = ({
    activeTool,
    onSelectTool,
    onExitTool,
    activeItemName,
    onExitItem,
    onOpenOverview,
}) => {
    return (
        <aside aria-label="Studio Tools" className="w-full bg-atelier-900/90 border-b border-white/[0.07] backdrop-blur-xl px-4 py-2 flex items-center justify-between gap-4 sticky top-[57px] z-20 shadow-md">
            <div className="flex items-center gap-3 shrink-0">
                {activeItemName && (
                    <div className="flex items-center gap-2 pr-3 border-r border-white/[0.08]">
                        <span className="text-[10px] tracking-[0.18em] uppercase font-semibold text-zinc-500">Slot</span>
                        <button
                            onClick={onExitItem}
                            className="text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] transition-all border border-white/[0.06]"
                            title="Back to Line Sheet"
                        >
                            <span className="truncate max-w-[130px]">{activeItemName}</span>
                            <span className="text-[10px] text-zinc-500">✕</span>
                        </button>
                    </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400 font-medium">Studio</span>
                </div>
            </div>

            {/* Segmented Tools Ribbon */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
                {TOOLS.map((tool) => {
                    const isActive = activeTool === tool.id;
                    return (
                        <button
                            key={tool.id}
                            onClick={() => onSelectTool(tool.id)}
                            title={tool.description}
                            className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap shrink-0 border ${
                                isActive
                                    ? 'bg-indigo-600/20 text-white border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                                    : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-white/[0.04] hover:border-white/[0.06]'
                            }`}
                        >
                            {tool.icon(isActive)}
                            <span className="tracking-tight">{tool.label}</span>
                            {isActive && (
                                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-500 rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Quick Actions (Overview / Close Tool) */}
            <div className="flex items-center gap-2 shrink-0">
                {onOpenOverview && (
                    <button
                        onClick={onOpenOverview}
                        title="View Full Tool Selector Overview"
                        className="px-2.5 py-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-all flex items-center gap-1"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        <span className="hidden sm:inline">Overview</span>
                    </button>
                )}
                {activeTool && onExitTool && (
                    <button
                        onClick={onExitTool}
                        title="Close active tool view"
                        className="px-2.5 py-1 text-[11px] font-medium text-zinc-400 hover:text-red-300 rounded-md bg-white/[0.03] hover:bg-red-500/10 border border-white/[0.06] hover:border-red-500/20 transition-all flex items-center gap-1"
                    >
                        <span>Close</span>
                        <span className="text-[10px]">✕</span>
                    </button>
                )}
            </div>
        </aside>
    );
};
