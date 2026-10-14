import React from 'react';
import { Tool } from '../types';

interface ToolSelectorProps {
    onSelectTool: (tool: Tool) => void;
    itemName?: string;
}

const ToolCard: React.FC<{ title: string; description: string; icon: React.ReactElement; onClick: () => void; index: number }> = ({ title, description, icon, onClick, index }) => (
    <div
        onClick={onClick}
        className="group relative bg-atelier-900/90 border border-white/[0.08] rounded-xl p-6 flex flex-col items-start text-left cursor-pointer
                   hover:border-indigo-500/40 hover:bg-atelier-850 hover:shadow-xl hover:shadow-indigo-500/5 
                   transition-all duration-200 transform hover:-translate-y-0.5 overflow-hidden"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <div className="w-full flex items-center justify-between mb-5">
            <div className="p-3 bg-atelier-800 rounded-lg border border-white/[0.06] text-zinc-300 group-hover:text-indigo-400 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10 transition-all duration-200">
                {icon}
            </div>
            <span className="font-mono text-[11px] text-zinc-600 group-hover:text-zinc-400 tracking-wider transition-colors">
                0{index + 1}
            </span>
        </div>
        <h3 className="text-base font-semibold text-white mb-1.5 group-hover:text-indigo-200 transition-colors tracking-tight flex items-center gap-2">
            {title}
            <svg className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </h3>
        <p className="text-zinc-400 text-xs leading-relaxed group-hover:text-zinc-300 transition-colors">{description}</p>
    </div>
);

export const ToolSelector: React.FC<ToolSelectorProps> = ({ onSelectTool, itemName }) => {
    const tools = [
        {
            id: 'moodboard' as Tool,
            title: 'Mood Board Analyst',
            description: 'Extract aesthetic DNA, color palettes, and fresh directional concepts from inspiration visuals.',
            icon: <MoodBoardIcon />,
        },
        {
            id: 'sketch' as Tool,
            title: 'Sketch Generator',
            description: 'Create clean, precise technical fashion flat sketches from natural language prompts.',
            icon: <PencilIcon />,
        },
        {
            id: 'visualiser' as Tool,
            title: 'Product Visualiser',
            description: 'Render flat sketches into photorealistic studio-lit luxury apparel photography.',
            icon: <PaletteIcon />,
        },
        {
            id: 'multiview' as Tool,
            title: 'Multi-View Generator',
            description: 'Synthesize consistent back, side profile, and construction detail views from a single front view.',
            icon: <RotationIcon />,
        },
        {
            id: 'model' as Tool,
            title: 'Model Placement',
            description: 'Showcase garments fitted on editorial AI talent in customized atmospheric environments.',
            icon: <UserIcon />,
        },
        {
            id: 'techpack' as Tool,
            title: 'Tech Pack Generator',
            description: 'Auto-generate comprehensive factory-ready technical specifications, BOMs, and measurements.',
            icon: <ClipboardIcon />,
        },
        {
            id: 'review' as Tool,
            title: 'Basic Audit',
            description: 'Screen designs for IP infringement exposure, safety compliance, and production risks.',
            icon: <ShieldCheckIcon />,
        },
        {
            id: 'shopperPulse' as Tool,
            title: 'Shopper Pulse',
            description: 'Evaluate commercial viability, target demographic appeal, and retail price elasticity.',
            icon: <HeartBeatIcon />,
        },
    ];

    return (
        <div className="flex flex-col items-center justify-center py-8 animate-fade-in w-full">
            <div className="text-center mb-10 max-w-2xl">
                {itemName ? (
                    <>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-mono tracking-widest uppercase mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                            Item Workspace
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white tracking-tight">
                            {itemName}
                        </h2>
                    </>
                ) : (
                    <div className="mb-2">
                        <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-zinc-500 block mb-2 font-semibold">
                            Studio Suite
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white tracking-tight">
                            Fashion Design Operations
                        </h2>
                    </div>
                )}
                <p className="text-sm text-zinc-400 font-normal leading-relaxed">
                    {itemName 
                        ? "Select a studio engine below to develop this slot. All generated assets sync directly to this item."
                        : "From initial concept extraction to manufacturing-grade technical specification."
                    }
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-7xl">
                {tools.map((tool, index) => (
                    <ToolCard key={tool.id} {...tool} onClick={() => onSelectTool(tool.id)} index={index} />
                ))}
            </div>
        </div>
    );
};

const MoodBoardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1.586-1.586a2 2 0 00-2.828 0L6 14m6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
    </svg>
);

const PaletteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
);

const RotationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const ClipboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const ShieldCheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const HeartBeatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
);