import React, { useState } from 'react';
import { getDisplaySrc,  ProductReviewAsset, AuditSection } from '../types';

interface ProductReviewModalProps {
    asset: ProductReviewAsset;
    onClose: () => void;
    onNavigateToVisualizer?: (baseAssetId: string, prePopulatedPrompt: string) => void;
}

const RiskBadge: React.FC<{ level: 'Low' | 'Medium' | 'High' }> = ({ level }) => {
    const colors = {
        'Low': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        'Medium': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        'High': 'bg-red-500/20 text-red-300 border-red-500/30',
    };

    return (
        <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${colors[level]}`}>
            {level} Risk
        </span>
    );
};

const AuditSectionDisplay: React.FC<{ title: string; data: AuditSection; icon: React.ReactNode; selectedFixes: string[]; onToggleFix: (fix: string) => void; }> = ({ title, data, icon, selectedFixes, onToggleFix }) => (
    <div className="mb-6 bg-slate-900/50 p-5 rounded-xl border border-slate-700/50">
        <div className="flex justify-between items-center mb-4">
            <h4 className="flex items-center text-slate-200 font-bold">
                <span className="p-1.5 bg-slate-800 rounded-lg mr-3 text-indigo-400">{icon}</span>
                {title}
            </h4>
            <RiskBadge level={data.risk_level} />
        </div>
        
        {data.issues && data.issues.length > 0 ? (
            <div className="space-y-4 ml-2">
                {data.issues.map((issue, idx) => {
                    // Fallbacks for backwards compatibility if recommendation is still used temporarily during transition
                    const targetPrompt = issue.target_state_prompt || (issue as any).recommendation;
                    const changeDesc = issue.change_description || (issue as any).recommendation;
                    const isSelected = selectedFixes.includes(targetPrompt);
                    return (
                        <div 
                            key={idx} 
                            onClick={() => onToggleFix(targetPrompt)}
                            className={`relative rounded-xl p-4 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-indigo-500 bg-indigo-900/20 border-indigo-500 shadow-lg shadow-indigo-500/10' : 'bg-slate-800/40 border border-slate-700 hover:bg-slate-800/70'}`}
                        >
                            {/* Custom Checkmark Icon */}
                            <div className="absolute top-4 right-4">
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-500 bg-slate-800'}`}>
                                    {isSelected && <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                </div>
                            </div>
                            
                            {/* Problem */}
                            <div className="flex items-start pr-8">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                <p className="text-sm text-red-400/90 leading-relaxed font-medium">{issue.flag}</p>
                            </div>
                            
                            {/* Divider */}
                            <div className="border-t border-white/10 my-3 ml-8"></div>
                            
                            {/* Solution */}
                            <div className="flex items-start ml-8">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                <p className="text-sm font-medium text-indigo-300 leading-relaxed">{changeDesc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : (data.flags && data.flags.length > 0) ? (
            <ul className="space-y-2 ml-2">
                {data.flags.map((flag, idx) => (
                    <li key={idx} className="text-sm text-slate-400 flex items-start">
                        <span className="text-red-400 mr-2 mt-0.5">•</span>
                        {flag}
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-sm text-slate-500 italic ml-11">No specific issues flagged.</p>
        )}
    </div>
);

export const ProductReviewModal: React.FC<ProductReviewModalProps> = ({ asset, onClose, onNavigateToVisualizer }) => {
    
    const [selectedFixes, setSelectedFixes] = useState<string[]>([]);

    const toggleFix = (fix: string) => {
        setSelectedFixes(prev => 
            prev.includes(fix) ? prev.filter(f => f !== fix) : [...prev, fix]
        );
    };

    const handleApplyFixes = () => {
        if (!onNavigateToVisualizer) return;
        const prompt = selectedFixes.join(" AND ");
        onNavigateToVisualizer(asset.parentId, prompt);
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400 border-emerald-500/50 shadow-emerald-500/20';
        if (score >= 50) return 'text-amber-400 border-amber-500/50 shadow-amber-500/20';
        return 'text-red-500 border-red-500/50 shadow-red-500/20';
    };

    const reviewResult = asset.data;
    const scoreColorClass = getScoreColor(reviewResult.compliance_score);

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="glass-panel rounded-2xl shadow-2xl border border-slate-700 w-full max-w-6xl m-4 h-[85vh] flex flex-col md:flex-row overflow-hidden animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Left: Image */}
                <div className="w-full md:w-5/12 bg-slate-900/80 p-8 flex flex-col items-center border-b md:border-b-0 md:border-r border-slate-700 relative overflow-y-auto custom-scrollbar">
                     <div className="w-full flex flex-col items-center justify-center min-h-[50%]">
                        <img 
                            src={asset.src || undefined} 
                            alt="Audited Design" 
                            className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl border border-slate-700" 
                        />
                        <div className="mt-6 text-center">
                            <p className="text-slate-400 text-sm font-medium">Compliance Audit Asset</p>
                        </div>
                     </div>

                     {asset.additionalSources && asset.additionalSources.length > 0 && (
                        <div className="w-full mt-8 border-t border-white/5 pt-6">
                            <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-bold text-center">Reference Angles</p>
                            <div className="grid grid-cols-2 gap-3">
                                {asset.additionalSources.map((source, idx) => (
                                    <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
                                        <img src={getDisplaySrc(source) || undefined} className="w-full h-full object-cover" alt={`Ref ${idx}`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Report */}
                <div className="w-full md:w-7/12 flex flex-col h-full bg-slate-950/60 relative">
                    <div className="p-8 border-b border-white/5 flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">A-LINE AI Basic Audit</h2>
                            <p className="text-slate-400 text-sm">Automated analysis for IP & Safety compliance.</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-grow overflow-y-auto custom-scrollbar relative flex flex-col">
                        <div className="p-8 flex-grow">
                            {/* Score Card */}
                            <div className="flex items-center mb-8 bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
                                 <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center text-3xl font-bold shadow-[0_0_20px_rgba(0,0,0,0.3)] bg-slate-900 ${scoreColorClass}`}>
                                    {reviewResult.compliance_score}
                                </div>
                                <div className="ml-6">
                                    <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-1">Compliance Score</h3>
                                    <p className={`text-sm font-bold ${reviewResult.status === 'PASS' ? 'text-emerald-400' : 'text-red-400'}`}>
                                        Status: {reviewResult.status}
                                    </p>
                                    <p className="text-slate-500 text-xs mt-2 max-w-xs">
                                        Score based on combined risk assessment of intellectual property and physical safety factors.
                                    </p>
                                </div>
                            </div>

                            <AuditSectionDisplay 
                                title="Legal Audit (IP & Copyright)" 
                                data={reviewResult.legal_audit}
                                selectedFixes={selectedFixes}
                                onToggleFix={toggleFix}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>}
                            />

                            <AuditSectionDisplay 
                                title="Safety Audit (Hazards)" 
                                data={reviewResult.safety_audit}
                                selectedFixes={selectedFixes}
                                onToggleFix={toggleFix}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                            />

                            <AuditSectionDisplay 
                                title="Fabrication Audit (Feasibility)" 
                                data={reviewResult.fabrication_audit}
                                selectedFixes={selectedFixes}
                                onToggleFix={toggleFix}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                            />

                            <p className="text-[10px] text-slate-500 uppercase tracking-wide text-center mt-4">
                                Disclaimer: AI analysis is for guidance only and does not constitute professional legal or safety certification.
                            </p>
                        </div>

                        {selectedFixes.length > 0 && onNavigateToVisualizer && (
                            <div className="sticky bottom-0 p-6 bg-slate-950/80 backdrop-blur-md border-t border-slate-800 flex justify-end animate-in fade-in slide-in-from-bottom-4 duration-300 z-10 w-full">
                                <button 
                                    onClick={handleApplyFixes}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center"
                                >
                                    Apply {selectedFixes.length} Fix{selectedFixes.length > 1 ? 'es' : ''} to Visualizer
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};