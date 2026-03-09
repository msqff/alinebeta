import React from 'react';

interface AuditWarningModalProps {
    onClose: () => void;
    onGenerateTechPack: () => void;
    onProceed: () => void;
}

export const AuditWarningModal: React.FC<AuditWarningModalProps> = ({ onClose, onGenerateTechPack, onProceed }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="glass-panel rounded-2xl shadow-2xl p-8 w-full max-w-md m-4 transform transition-all border border-red-500/30"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center mb-4 text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h2 className="text-xl font-bold text-white">Missing Tech Pack</h2>
                </div>
                
                <p className="text-slate-300 mb-6 leading-relaxed">
                    This design does not have an associated Tech Pack. The audit will be less accurate regarding flammability, material safety, and fabrication feasibility without technical specifications.
                </p>
                
                <div className="flex flex-col space-y-3">
                    <button 
                        onClick={onGenerateTechPack}
                        className="w-full px-5 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20 flex items-center justify-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Generate Tech Pack First
                    </button>
                    <button 
                        onClick={onProceed}
                        className="w-full px-5 py-3 text-sm font-medium bg-transparent border border-slate-700 text-slate-400 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        Proceed with Visual Audit
                    </button>
                </div>
            </div>
        </div>
    );
};