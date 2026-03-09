import React, { useState, useMemo } from 'react';
import { ImageSource } from '../types';
import { FileUpload } from './common/FileUpload';
import { Spinner } from './common/Spinner';
import { fileToBase64, analyzeMoodBoard } from '../services/geminiService';

interface MoodBoardAnalystProps {
    onAnalysisComplete: (moodBoardImages: ImageSource[], summary: string, sketches: ImageSource[]) => void;
    onBack: () => void;
}

export const MoodBoardAnalyst: React.FC<MoodBoardAnalystProps> = ({ onAnalysisComplete, onBack }) => {
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const [generatedSketches, setGeneratedSketches] = useState<ImageSource[]>([]);
    const [error, setError] = useState<string | null>(null);

    const uploadedFilePreviews = useMemo(() => {
        return uploadedFiles.map(file => ({
            name: file.name,
            url: URL.createObjectURL(file)
        }));
    }, [uploadedFiles]);

    const handleFilesAdd = (files: File[]) => {
        setUploadedFiles(prev => [...prev, ...files]);
    };

    const handleFileRemove = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
        URL.revokeObjectURL(uploadedFilePreviews[index].url);
    };

    const handleAnalyze = async () => {
        if (uploadedFiles.length < 2) {
            setError("Please upload at least two images to create a mood board.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setSummary(null);
        setGeneratedSketches([]);

        try {
            const imageSources = await Promise.all(uploadedFiles.map(fileToBase64));
            const result = await analyzeMoodBoard(imageSources, prompt);
            
            setSummary(result.summary);
            setGeneratedSketches(result.sketches);
            
            onAnalysisComplete(imageSources, result.summary, result.sketches);

        } catch (e: any) {
            setError(e.message || "An unexpected error occurred during analysis.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderResults = () => (
        <div className="mt-12 animate-slide-up">
            <h3 className="text-3xl font-bold mb-8 text-center text-white">Analysis Results</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-900/60 p-8 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md">
                    <h4 className="text-xl font-bold mb-6 text-indigo-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Trend Summary
                    </h4>
                    <div className="prose prose-invert max-w-none text-slate-300 custom-scrollbar max-h-[500px] overflow-y-auto pr-4">
                        {summary?.split('\n').map((line, index) => {
                            if (line.startsWith('## ')) {
                                return <h5 key={index} className="text-lg font-semibold mt-6 mb-3 text-white border-b border-slate-700 pb-2">{line.substring(3)}</h5>;
                            }
                            if (line.trim() === '') return null;
                            return <p key={index} className="mb-3 leading-relaxed text-sm">{line}</p>;
                        })}
                    </div>
                </div>
                <div className="bg-slate-900/60 p-8 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md">
                    <h4 className="text-xl font-bold mb-6 text-indigo-400 flex items-center">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1.586-1.586a2 2 0 00-2.828 0L6 14m6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Inspired Sketches
                    </h4>
                     <div className="grid grid-cols-2 gap-6">
                        {generatedSketches.map((sketch, index) => (
                            <img 
                                key={index}
                                src={`data:${sketch.mimeType};base64,${sketch.data}`} 
                                alt={`Generated sketch ${index + 1}`}
                                className="w-full h-auto object-contain rounded-xl bg-white shadow-lg border border-white/20 hover:scale-105 transition-transform duration-300"
                            />
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-6 text-center bg-slate-800/50 py-2 rounded-lg">Sketches saved to Gallery</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full animate-fade-in">
             <div className="flex items-center mb-8 border-b border-white/5 pb-6">
                <button onClick={onBack} className="mr-6 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Mood Board Analyst</h2>
                    <p className="text-slate-400 mt-1 font-light">Upload inspiration to extract trends and generate concepts.</p>
                </div>
            </div>

            <div className="flex-grow">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col bg-slate-950/40 p-6 rounded-2xl border border-white/5 shadow-inner">
                         <h3 className="font-bold text-sm uppercase tracking-wide text-slate-400 mb-4">Mood Board Assets</h3>
                        <div className="flex-grow grid grid-cols-3 sm:grid-cols-4 gap-4 mb-4 overflow-y-auto max-h-96 custom-scrollbar p-2">
                            {uploadedFilePreviews.map((file, index) => (
                                <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-700 shadow-md">
                                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                    <button onClick={() => handleFileRemove(index)} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm hover:bg-red-500/80">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            ))}
                             <FileUpload onFilesUpload={handleFilesAdd} compact={true} multiple={true}/>
                        </div>
                    </div>
                     <div className="flex flex-col p-6 bg-slate-950/40 rounded-2xl border border-white/5 h-full shadow-inner">
                        <h3 className="font-bold text-sm uppercase tracking-wide text-slate-400 mb-4">Analysis Config</h3>
                        <div className="bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/20 mb-6">
                            <h4 className="text-indigo-300 font-bold text-xs uppercase mb-2">How it works</h4>
                            <ol className="list-decimal list-inside text-slate-400 space-y-1 text-xs">
                                <li>Upload at least <span className="text-white font-bold">2</span> images.</li>
                                <li>Provide context hints below.</li>
                                <li>Get a detailed report & rough sketches.</li>
                            </ol>
                        </div>
                        <label htmlFor="moodPrompt" className="text-xs font-bold uppercase text-slate-500 mb-2 ml-1">Context & Focus</label>
                        <textarea
                            id="moodPrompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., Analyze for a Summer 2025 collection focusing on sustainable linen and earthy tones..."
                            className="w-full p-4 bg-slate-950/80 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm mb-6 text-white placeholder-slate-600 resize-none"
                            rows={6}
                        />
                        <button
                            onClick={handleAnalyze}
                            disabled={isLoading || uploadedFiles.length < 2}
                            className="w-full flex justify-center items-center px-8 py-5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold rounded-xl hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-lg shadow-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed mt-auto transform hover:-translate-y-0.5"
                        >
                            {isLoading ? <><Spinner /> <span className="ml-2">Analyzing Mood Board...</span></> : 'Analyze Mood Board'}
                        </button>
                    </div>
                </div>

                {error && <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 text-red-200 rounded-xl text-center animate-fade-in">{error}</div>}
                
                {isLoading && !summary && (
                    <div className="text-center py-12 animate-pulse">
                         <p className="text-indigo-300 text-lg font-light">Synthesizing visual data...</p>
                    </div>
                )}
                
                {summary && generatedSketches.length > 0 && renderResults()}
            </div>
        </div>
    );
};