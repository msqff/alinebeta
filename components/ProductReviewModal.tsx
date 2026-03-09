import React from 'react';
import { ProductReviewAsset, AuditSection } from '../types';

interface ProductReviewModalProps {
    asset: ProductReviewAsset;
    onClose: () => void;
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

const AuditSectionDisplay: React.FC<{ title: string; data: AuditSection; icon: React.ReactNode }> = ({ title, data, icon }) => (
    <div className="mb-6 bg-slate-900/50 p-5 rounded-xl border border-slate-700/50">
        <div className="flex justify-between items-center mb-4">
            <h4 className="flex items-center text-slate-200 font-bold">
                <span className="p-1.5 bg-slate-800 rounded-lg mr-3 text-indigo-400">{icon}</span>
                {title}
            </h4>
            <RiskBadge level={data.risk_level} />
        </div>
        {data.flags.length === 0 ? (
            <p className="text-sm text-slate-500 italic ml-11">No specific issues flagged.</p>
        ) : (
            <ul className="space-y-2 ml-2">
                {data.flags.map((flag, idx) => (
                    <li key={idx} className="text-sm text-slate-400 flex items-start">
                        <span className="text-red-400 mr-2 mt-0.5">•</span>
                        {flag}
                    </li>
                ))}
            </ul>
        )}
    </div>
);

export const ProductReviewModal: React.FC<ProductReviewModalProps> = ({ asset, onClose }) => {
    
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
                            src={asset.src} 
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
                                        <img src={`data:${source.mimeType};base64,${source.data}`} className="w-full h-full object-cover" alt={`Ref ${idx}`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Report */}
                <div className="w-full md:w-7/12 flex flex-col h-full bg-slate-950/60">
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

                    <div className="flex-grow overflow-y-auto custom-scrollbar p-8">
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
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>}
                        />

                        <AuditSectionDisplay 
                            title="Safety Audit (Hazards)" 
                            data={reviewResult.safety_audit}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                        />

                        <AuditSectionDisplay 
                            title="Fabrication Audit (Feasibility)" 
                            data={reviewResult.fabrication_audit}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                        />
                    </div>

                    <div className="p-4 bg-slate-900 border-t border-white/5 text-center">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                            Disclaimer: AI analysis is for guidance only and does not constitute professional legal or safety certification.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};