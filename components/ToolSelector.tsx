import React from 'react';
import { Tool } from '../types';

interface ToolSelectorProps {
    onSelectTool: (tool: Tool) => void;
    itemName?: string;
}

const ToolCard: React.FC<{ title: string; description: string; icon: React.ReactElement; onClick: () => void; index: number }> = ({ title, description, icon, onClick, index }) => (
    <div
        onClick={onClick}
        className="group relative glass-panel rounded-2xl p-8 flex flex-col items-center text-center cursor-pointer
                   hover:border-indigo-500/50 hover:bg-slate-800/80 hover:shadow-2xl hover:shadow-indigo-500/10 
                   transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
        style={{ animationDelay: `${index * 100}ms` }}
    >
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10 text-indigo-400 mb-6 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300 shadow-inner">
            {icon}
        </div>
        <h3 className="relative z-10 text-lg font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors">{title}</h3>
        <p className="relative z-10 text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">{description}</p>
    </div>
);

export const ToolSelector: React.FC<ToolSelectorProps> = ({ onSelectTool, itemName }) => {
    const tools = [
        {
            id: 'moodboard' as Tool,
            title: 'Mood Board Analyst',
            description: 'Analyze trends and generate fresh concepts from inspiration images.',
            icon: <MoodBoardIcon />,
        },
        {
            id: 'sketch' as Tool,
            title: 'Sketch Generator',
            description: 'Rapidly create detailed professional fashion flats from text.',
            icon: <PencilIcon />,
        },
        {
            id: 'visualiser' as Tool,
            title: 'Product Visualiser',
            description: 'Render sketches into photorealistic studio quality product shots.',
            icon: <PaletteIcon />,
        },
        {
            id: 'multiview' as Tool,
            title: 'Multi-View Generator',
            description: 'Generate consistent back, side, and detail views from a single front-view.',
            icon: <RotationIcon />,
        },
        {
            id: 'model' as Tool,
            title: 'Model Placement',
            description: 'Showcase designs on AI models in customizable environments.',
            icon: <UserIcon />,
        },
        {
            id: 'techpack' as Tool,
            title: 'Tech Pack Generator',
            description: 'Auto-generate comprehensive technical specifications for manufacturing.',
            icon: <ClipboardIcon />,
        },
        {
            id: 'review' as Tool,
            title: 'Basic Audit',
            description: 'Audit designs for IP infringement risks and garment safety hazards.',
            icon: <ShieldCheckIcon />,
        },
        {
            id: 'shopperPulse' as Tool,
            title: 'Shopper Pulse',
            description: 'AI-driven commercial viability testing for the UK High Street.',
            icon: <HeartBeatIcon />,
        },
    ];

    return (
        <div className="flex flex-col items-center justify-center h-full py-12 animate-fade-in">
            <div className="text-center mb-16">
                {itemName ? (
                    <>
                        <p className="text-sm font-bold text-indigo-400 tracking-widest uppercase mb-2">Item Workspace</p>
                        <h2 className="text-5xl font-bold mb-4 text-white tracking-tight">
                            {itemName}
                        </h2>
                    </>
                ) : (
                    <h2 className="text-5xl font-bold mb-4 text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        A-LINE AI
                    </h2>
                )}
                <p className="text-lg text-slate-400 max-w-xl mx-auto font-light">
                    {itemName 
                        ? "Select a tool to develop this item. All assets will be saved to this slot."
                        : "The End-to-End Fashion Operating System. From abstract line to manufacturing specification."
                    }
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 w-full max-w-[90rem]">
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