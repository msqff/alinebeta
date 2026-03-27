import React, { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { TechPackDocument, ExportConfig } from './TechPackDocument';
import { TechPackAsset, TechPackSection, SizingRow, CostingRow, PlacementPin, BOMRow } from '../types';

interface PdfExportModalProps {
    techPack: TechPackAsset;
    sections: TechPackSection[];
    sizingData: SizingRow[];
    costingData: CostingRow[];
    placementData: PlacementPin[];
    bomData: BOMRow[];
    onClose: () => void;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({ techPack, sections, sizingData, costingData, placementData, bomData, onClose }) => {
    const [config, setConfig] = useState<ExportConfig>({
        styleName: techPack.name || 'Untitled Style',
        styleNumber: Math.random().toString(36).substring(2, 8).toUpperCase(),
        season: 'SS26',
        designerName: 'Design Team',
        includeCover: true,
        includeDetails: true,
        includeBom: true,
        includeSizing: true,
        includeCosting: false,
        includePlacement: true,
        includeRefs: true,
    });

    const [profile, setProfile] = useState<'factory' | 'internal'>('factory');

    useEffect(() => {
        if (profile === 'factory') {
            setConfig(prev => ({ ...prev, includeCosting: false }));
        } else {
            setConfig(prev => ({ ...prev, includeCosting: true }));
        }
    }, [profile]);

    const handleToggle = (key: keyof ExportConfig) => {
        setConfig(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Export PDF Tech Pack</h2>
                        <p className="text-slate-400 text-sm mt-1">Configure your export settings and metadata.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
                    {/* Metadata Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Style Name</label>
                            <input 
                                type="text" 
                                value={config.styleName} 
                                onChange={e => setConfig({...config, styleName: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Style Number</label>
                            <input 
                                type="text" 
                                value={config.styleNumber} 
                                onChange={e => setConfig({...config, styleNumber: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Season</label>
                            <input 
                                type="text" 
                                value={config.season} 
                                onChange={e => setConfig({...config, season: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Designer Name</label>
                            <input 
                                type="text" 
                                value={config.designerName} 
                                onChange={e => setConfig({...config, designerName: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Export Profiles */}
                    <div className="mb-8">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Export Profile</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setProfile('factory')}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${profile === 'factory' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}
                            >
                                <div className="font-bold text-white mb-1">Factory Mode</div>
                                <div className="text-xs text-slate-400">Excludes sensitive costing data. Safe for external manufacturers.</div>
                            </button>
                            <button 
                                onClick={() => setProfile('internal')}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${profile === 'internal' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}
                            >
                                <div className="font-bold text-white mb-1">Internal / Buyer Mode</div>
                                <div className="text-xs text-slate-400">Includes all data, including wholesale cost estimates.</div>
                            </button>
                        </div>
                    </div>

                    {/* Section Toggles */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Included Sections</label>
                        <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input type="checkbox" checked={config.includeCover} onChange={() => handleToggle('includeCover')} className="form-checkbox h-5 w-5 text-indigo-500 rounded border-slate-600 bg-slate-900" />
                                <span className="text-slate-300">Cover Page & Primary Image</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input type="checkbox" checked={config.includeDetails} onChange={() => handleToggle('includeDetails')} className="form-checkbox h-5 w-5 text-indigo-500 rounded border-slate-600 bg-slate-900" />
                                <span className="text-slate-300">Technical Details</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input type="checkbox" checked={config.includeBom} onChange={() => handleToggle('includeBom')} className="form-checkbox h-5 w-5 text-indigo-500 rounded border-slate-600 bg-slate-900" />
                                <span className="text-slate-300">Bill of Materials (BOM)</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input type="checkbox" checked={config.includeSizing} onChange={() => handleToggle('includeSizing')} className="form-checkbox h-5 w-5 text-indigo-500 rounded border-slate-600 bg-slate-900" />
                                <span className="text-slate-300">Sizing & Grading Matrix</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input type="checkbox" checked={config.includeCosting} onChange={() => handleToggle('includeCosting')} className="form-checkbox h-5 w-5 text-indigo-500 rounded border-slate-600 bg-slate-900" />
                                <span className="text-slate-300">Costing Sheet</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input type="checkbox" checked={config.includePlacement} onChange={() => handleToggle('includePlacement')} className="form-checkbox h-5 w-5 text-indigo-500 rounded border-slate-600 bg-slate-900" />
                                <span className="text-slate-300">Placement & Construction Guide</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input type="checkbox" checked={config.includeRefs} onChange={() => handleToggle('includeRefs')} className="form-checkbox h-5 w-5 text-indigo-500 rounded border-slate-600 bg-slate-900" />
                                <span className="text-slate-300">Reference Angles (Multi-views)</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-800 bg-slate-900/80">
                    <PDFDownloadLink 
                        document={<TechPackDocument techPack={techPack} sections={sections} sizingData={sizingData} costingData={costingData} placementData={placementData} bomData={bomData} config={config} />} 
                        fileName={`${config.styleNumber}_TechPack.pdf`}
                        className="w-full block"
                    >
                        {({ loading }) => (
                            <button 
                                disabled={loading}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-900/20 disabled:opacity-50 flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Generating PDF...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Generate & Download PDF
                                    </>
                                )}
                            </button>
                        )}
                    </PDFDownloadLink>
                </div>
            </div>
        </div>
    );
};
