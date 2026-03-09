import React, { useState } from 'react';

interface SketchGeneratorProps {
    onGenerate: (prompt: string) => void;
    onBack: () => void;
}

export const SketchGenerator: React.FC<SketchGeneratorProps> = ({ onGenerate, onBack }) => {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim()) {
            onGenerate(prompt);
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="flex items-center mb-8 border-b border-white/5 pb-6">
                <button onClick={onBack} className="mr-6 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Sketch Generator</h2>
                    <p className="text-slate-400 mt-1 font-light">Turn your concepts into professional fashion flats.</p>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="flex-grow flex flex-col max-w-4xl mx-auto w-full">
                <div className="flex-grow mb-8">
                    <label htmlFor="prompt" className="block text-xs font-bold uppercase text-slate-500 mb-3 ml-1">Design Description</label>
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-20 group-focus-within:opacity-100 transition duration-500 blur"></div>
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the garment in detail (e.g., A structured wool blazer with peaked lapels, double-breasted closure, and flap pockets)..."
                            className="relative w-full h-72 p-6 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none text-lg text-white placeholder-slate-600 resize-none leading-relaxed"
                        />
                    </div>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                    <div className="mb-4 md:mb-0 flex items-center text-slate-400 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Generates 4 distinct variations per request.
                    </div>
                    <button
                        type="submit"
                        disabled={!prompt.trim()}
                        className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold rounded-xl hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-lg shadow-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                    >
                        Generate Sketches
                    </button>
                </div>
            </form>
        </div>
    );
};