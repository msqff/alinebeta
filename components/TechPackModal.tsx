import React, { useState, useRef, useEffect } from 'react';
import { TechPackAsset, TechPackSection, TechPackItem } from '../types';

interface TechPackModalProps {
    techPack: TechPackAsset;
    onClose: () => void;
    onSaveChanges: (newData: TechPackSection[]) => void;
}

const TechPackRow: React.FC<{
    item: TechPackItem;
    onUpdate: (newItem: TechPackItem) => void;
    onDelete: () => void;
}> = ({ item, onUpdate, onDelete }) => {
    const [showOptions, setShowOptions] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Local state for inputs to prevent history spam on every keystroke
    const [localLabel, setLocalLabel] = useState(item.label);
    const [localValue, setLocalValue] = useState(item.value);

    // Sync local state when parent state changes (e.g. Undo/Redo)
    useEffect(() => {
        setLocalLabel(item.label);
    }, [item.label]);

    useEffect(() => {
        setLocalValue(item.value);
    }, [item.value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowOptions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectOption = (option: string) => {
        // Swap current value with selected option
        const oldValue = item.value;
        const newOptions = item.options.filter(o => o !== option);
        newOptions.push(oldValue);
        
        // Immediate update for dropdown selection
        onUpdate({
            ...item,
            value: option,
            options: newOptions
        });
        setShowOptions(false);
    };

    const handleLabelBlur = () => {
        if (localLabel !== item.label) {
            onUpdate({ ...item, label: localLabel });
        }
    };

    const handleValueBlur = () => {
        if (localValue !== item.value) {
            onUpdate({ ...item, value: localValue });
        }
    };

    return (
        <div className="flex items-start space-x-4 mb-3 group relative">
            <div className="flex-1">
                <input
                    type="text"
                    value={localLabel}
                    onChange={(e) => setLocalLabel(e.target.value)}
                    onBlur={handleLabelBlur}
                    className="w-full bg-transparent border-b border-slate-700/50 focus:border-indigo-500 text-slate-400 text-sm py-1.5 outline-none transition-colors"
                    placeholder="Label"
                />
            </div>
            <div className="flex-[2] relative" ref={dropdownRef}>
                <div className="relative">
                     <input
                        type="text"
                        value={localValue}
                        onChange={(e) => setLocalValue(e.target.value)}
                        onBlur={handleValueBlur}
                        onFocus={() => item.options.length > 0 && setShowOptions(true)}
                        className={`w-full bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 text-sm py-1.5 px-3 outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${item.options.length > 0 ? 'pr-8' : ''}`}
                        placeholder="Value"
                    />
                    {item.options.length > 0 && (
                        <div 
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-indigo-400"
                            onClick={() => setShowOptions(!showOptions)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showOptions ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                </div>

                {showOptions && item.options.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden animate-fade-in">
                        <div className="px-3 py-2 text-xs font-bold text-slate-500 bg-slate-900/50 border-b border-slate-700">AI Suggestions</div>
                        {item.options.map((option, idx) => (
                            <div 
                                key={idx}
                                onClick={() => handleSelectOption(option)}
                                className="px-3 py-2 text-sm text-slate-300 hover:bg-indigo-600 hover:text-white cursor-pointer transition-colors"
                            >
                                {option}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <button 
                onClick={onDelete}
                className="mt-1.5 p-1 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-all"
                title="Remove Item"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
    );
};

const TechPackSectionRenderer: React.FC<{
    section: TechPackSection;
    onUpdateSection: (newSection: TechPackSection) => void;
    onDeleteSection: () => void;
}> = ({ section, onUpdateSection, onDeleteSection }) => {
    
    // Local state for title
    const [localTitle, setLocalTitle] = useState(section.title);

    useEffect(() => {
        setLocalTitle(section.title);
    }, [section.title]);

    const handleTitleBlur = () => {
        if (localTitle !== section.title) {
            onUpdateSection({ ...section, title: localTitle });
        }
    };

    const handleUpdateItem = (updatedItem: TechPackItem) => {
        const newItems = section.items.map(i => i.id === updatedItem.id ? updatedItem : i);
        onUpdateSection({ ...section, items: newItems });
    };

    const handleDeleteItem = (itemId: string) => {
        const newItems = section.items.filter(i => i.id !== itemId);
        onUpdateSection({ ...section, items: newItems });
    };

    const handleAddItem = () => {
        const newItem: TechPackItem = {
            id: self.crypto.randomUUID(),
            label: '',
            value: '',
            options: []
        };
        onUpdateSection({ ...section, items: [...section.items, newItem] });
    };

    return (
        <div className="mb-8 bg-slate-900/30 rounded-xl p-5 border border-white/5 relative group/section">
             <button 
                onClick={onDeleteSection}
                className="absolute top-4 right-4 text-slate-600 hover:text-red-400 opacity-0 group-hover/section:opacity-100 transition-all p-1 hover:bg-slate-800 rounded"
                title="Delete Section"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
            <input 
                type="text" 
                value={localTitle} 
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="text-lg font-bold text-indigo-300 bg-transparent border-b border-transparent hover:border-indigo-500/50 focus:border-indigo-500 outline-none mb-4 w-full transition-colors"
                placeholder="Section Title"
            />
            
            <div className="space-y-1">
                {section.items.map(item => (
                    <TechPackRow 
                        key={item.id} 
                        item={item} 
                        onUpdate={handleUpdateItem} 
                        onDelete={() => handleDeleteItem(item.id)}
                    />
                ))}
            </div>
            
            <button 
                onClick={handleAddItem}
                className="mt-4 text-xs font-bold text-slate-500 hover:text-indigo-400 flex items-center transition-colors uppercase tracking-wide"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Field
            </button>
        </div>
    );
};

export const TechPackModal: React.FC<TechPackModalProps> = ({ techPack, onClose, onSaveChanges }) => {
    // Current State
    const [sections, setSections] = useState<TechPackSection[]>(techPack.data || []);
    // History Management
    const [history, setHistory] = useState<TechPackSection[][]>([]);
    const [future, setFuture] = useState<TechPackSection[][]>([]);
    
    const [copyButtonText, setCopyButtonText] = useState('Copy Markdown');

    // Central update handler that pushes to history
    const updateData = (newSections: TechPackSection[]) => {
        setHistory([...history, sections]);
        setFuture([]); // Clear future on new action
        setSections(newSections);
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        
        const previous = history[history.length - 1];
        const newHistory = history.slice(0, history.length - 1);
        
        setFuture([sections, ...future]);
        setSections(previous);
        setHistory(newHistory);
    };

    const handleRedo = () => {
        if (future.length === 0) return;

        const next = future[0];
        const newFuture = future.slice(1);

        setHistory([...history, sections]);
        setSections(next);
        setFuture(newFuture);
    };

    const handleAddSection = () => {
        const newSection: TechPackSection = {
            id: self.crypto.randomUUID(),
            title: 'New Section',
            items: [{
                id: self.crypto.randomUUID(),
                label: 'Field',
                value: 'Value',
                options: []
            }]
        };
        updateData([...sections, newSection]);
    };

    const handleUpdateSection = (updatedSection: TechPackSection) => {
        updateData(sections.map(s => s.id === updatedSection.id ? updatedSection : s));
    };

    const handleDeleteSection = (sectionId: string) => {
        updateData(sections.filter(s => s.id !== sectionId));
    };

    const formatAsMarkdown = () => {
        let md = `# A-LINE AI Technical Pack\n\n`;
        sections.forEach(section => {
            md += `## ${section.title}\n`;
            section.items.forEach(item => {
                md += `- **${item.label}**: ${item.value}\n`;
            });
            md += `\n`;
        });
        return md;
    };

    const handleCopy = () => {
        const md = formatAsMarkdown();
        navigator.clipboard.writeText(md);
        setCopyButtonText('Copied!');
        setTimeout(() => setCopyButtonText('Copy Markdown'), 2000);
    };
    
    const handleSave = () => {
        onSaveChanges(sections);
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40"
            onClick={onClose}
        >
            <div 
                className="glass-panel rounded-2xl shadow-2xl border border-slate-700 p-6 md:p-8 w-full max-w-5xl m-4 flex flex-col animate-fade-in"
                style={{maxHeight: '90vh'}}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6 flex-shrink-0 border-b border-white/10 pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">A-LINE AI Tech Pack</h2>
                        <p className="text-slate-400 text-sm">Review AI suggestions and finalize your specifications.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                         <div className="mr-4 flex space-x-1">
                            <button 
                                onClick={handleUndo} 
                                disabled={history.length === 0}
                                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 transition-colors border border-slate-700"
                                title="Undo"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                            </button>
                            <button 
                                onClick={handleRedo} 
                                disabled={future.length === 0}
                                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 transition-colors border border-slate-700"
                                title="Redo"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                                </svg>
                            </button>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 overflow-hidden h-full">
                    <div className="md:col-span-4 flex flex-col items-center overflow-y-auto custom-scrollbar pr-2">
                        <div className="bg-slate-800 rounded-xl p-2 w-full shadow-lg border border-slate-700">
                             <img src={techPack.src} alt="Tech pack source image" className="w-full h-auto max-h-[50vh] object-contain rounded-lg" />
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-center uppercase tracking-wider font-bold mb-4">Source Asset</p>
                        
                        {techPack.additionalSources && techPack.additionalSources.length > 0 && (
                            <div className="w-full mb-6">
                                <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-bold text-center">Reference Views</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {techPack.additionalSources.map((source, idx) => (
                                        <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
                                            <img src={`data:${source.mimeType};base64,${source.data}`} className="w-full h-full object-cover" alt={`Ref ${idx}`} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                         <div className="w-full bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                            <h4 className="text-indigo-400 font-bold text-xs uppercase mb-2">Tips</h4>
                            <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                                <li>Click value fields to see AI alternatives.</li>
                                <li>Edit any text directly.</li>
                                <li>Use the &quot;Add Field&quot; button to expand sections.</li>
                                <li>Use Undo/Redo in top right for mistakes.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="md:col-span-8 flex flex-col h-full overflow-hidden">
                        <div className="flex-grow overflow-y-auto custom-scrollbar pr-4 pb-20">
                            {sections.length === 0 ? (
                                <div className="text-center py-20 text-slate-500">No data available. Add a section to start.</div>
                            ) : (
                                sections.map(section => (
                                    <TechPackSectionRenderer 
                                        key={section.id} 
                                        section={section} 
                                        onUpdateSection={handleUpdateSection}
                                        onDeleteSection={() => handleDeleteSection(section.id)}
                                    />
                                ))
                            )}
                            
                            <button 
                                onClick={handleAddSection}
                                className="w-full py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:border-indigo-500 hover:text-indigo-400 transition-colors font-bold flex items-center justify-center uppercase tracking-wide text-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add New Section
                            </button>
                        </div>
                        
                         <div className="flex items-center space-x-4 pt-4 border-t border-white/10 mt-auto bg-slate-950/80 z-10">
                             <button
                                onClick={handleSave}
                                className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20"
                            >
                                Save Changes
                            </button>
                            <button
                                onClick={handleCopy}
                                className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-colors border border-slate-700 flex items-center justify-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                                {copyButtonText}
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};