import React, { useState, useRef, useEffect } from 'react';
import { getDisplaySrc,  TechPackAsset, TechPackSection, TechPackItem, SizingRow, CostingRow, PlacementPin, BOMRow } from '../types';
import { PdfExportModal } from './PdfExportModal';

interface TechPackModalProps {
    techPack: TechPackAsset;
    onClose: () => void;
    onSaveChanges: (newData: TechPackSection[], newSizingData?: SizingRow[], newCostingData?: CostingRow[], newPlacementData?: PlacementPin[], newBomData?: BOMRow[]) => void;
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
    const [sizingData, setSizingData] = useState<SizingRow[]>(techPack.sizingData || []);
    const [costingData, setCostingData] = useState<CostingRow[]>(techPack.costingData || []);
    const [placementData, setPlacementData] = useState<PlacementPin[]>(techPack.placementData || []);
    const [bomData, setBomData] = useState<BOMRow[]>(techPack.bomData || []);
    
    // Migrate old BOM sections to dedicated BOM tab
    useEffect(() => {
        if (!techPack.bomData || techPack.bomData.length === 0) {
            const bomSectionIndex = sections.findIndex(s => s.title.toLowerCase().includes('bill of materials') || s.title.toLowerCase() === 'bom');
            if (bomSectionIndex !== -1) {
                const bomSection = sections[bomSectionIndex];
                const migratedBomData: BOMRow[] = bomSection.items.map(item => ({
                    id: self.crypto.randomUUID(),
                    placement: item.label,
                    component: item.value,
                    description: item.options.join(', ') || '',
                    color: '',
                    supplier: '',
                    consumption: ''
                }));
                setBomData(migratedBomData);
                
                // Remove the BOM section from details
                const newSections = [...sections];
                newSections.splice(bomSectionIndex, 1);
                setSections(newSections);
            }
        }
    }, []);

    // History Management
    const [history, setHistory] = useState<{sections: TechPackSection[], sizingData: SizingRow[], costingData: CostingRow[], placementData: PlacementPin[], bomData: BOMRow[]}[]>([]);
    const [future, setFuture] = useState<{sections: TechPackSection[], sizingData: SizingRow[], costingData: CostingRow[], placementData: PlacementPin[], bomData: BOMRow[]}[]>([]);
    
    // Dragging State
    const [draggingPinId, setDraggingPinId] = useState<string | null>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const justFinishedDragRef = useRef(false);
    
    type TabType = 'details' | 'bom' | 'sizing' | 'costing' | 'placement';
    const [activeTab, setActiveTab] = useState<TabType>('details');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);

    const tabs: { id: TabType; label: string }[] = [
        { id: 'details', label: 'Details' },
        { id: 'bom', label: 'BOM' },
        { id: 'sizing', label: 'Sizing' },
        { id: 'costing', label: 'Costing' },
        { id: 'placement', label: 'Placement' },
    ];

    // Central update handler that pushes to history
    const updateData = (newSections: TechPackSection[], newSizingData: SizingRow[] = sizingData, newCostingData: CostingRow[] = costingData, newPlacementData: PlacementPin[] = placementData, newBomData: BOMRow[] = bomData) => {
        setHistory([...history, { sections, sizingData, costingData, placementData, bomData }]);
        setFuture([]); // Clear future on new action
        setSections(newSections);
        setSizingData(newSizingData);
        setCostingData(newCostingData);
        setPlacementData(newPlacementData);
        setBomData(newBomData);
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        
        const previous = history[history.length - 1];
        const newHistory = history.slice(0, history.length - 1);
        
        setFuture([{ sections, sizingData, costingData, placementData, bomData }, ...future]);
        setSections(previous.sections);
        setSizingData(previous.sizingData);
        setCostingData(previous.costingData);
        setPlacementData(previous.placementData);
        setBomData(previous.bomData);
        setHistory(newHistory);
    };

    const handleRedo = () => {
        if (future.length === 0) return;

        const next = future[0];
        const newFuture = future.slice(1);

        setHistory([...history, { sections, sizingData, costingData, placementData, bomData }]);
        setSections(next.sections);
        setSizingData(next.sizingData);
        setCostingData(next.costingData);
        setPlacementData(next.placementData);
        setBomData(next.bomData);
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

    const handleSave = () => {
        onSaveChanges(sections, sizingData, costingData, placementData, bomData);
        onClose();
    };

    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (activeTab !== 'placement') return;
        if (justFinishedDragRef.current) {
            justFinishedDragRef.current = false;
            return;
        }
        
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        const newPinNumber = placementData.length > 0 ? Math.max(...placementData.map(p => p.pinNumber)) + 1 : 1;
        
        const newPin: PlacementPin = {
            id: self.crypto.randomUUID(),
            pinNumber: newPinNumber,
            x,
            y,
            title: 'New Pin',
            note: ''
        };
        
        updateData(sections, sizingData, costingData, [...placementData, newPin]);
    };

    const handlePinMouseDown = (e: React.MouseEvent, pinId: string) => {
        if (activeTab !== 'placement') return;
        e.stopPropagation();
        setDraggingPinId(pinId);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (draggingPinId && imageContainerRef.current) {
                const rect = imageContainerRef.current.getBoundingClientRect();
                let x = ((e.clientX - rect.left) / rect.width) * 100;
                let y = ((e.clientY - rect.top) / rect.height) * 100;
                
                x = Math.max(0, Math.min(100, x));
                y = Math.max(0, Math.min(100, y));

                setPlacementData(prev => prev.map(p => p.id === draggingPinId ? { ...p, x, y } : p));
            }
        };

        const handleMouseUp = () => {
            if (draggingPinId) {
                // Push to history when drag ends
                setHistory(prev => [...prev, { sections, sizingData, costingData, placementData, bomData }]);
                setFuture([]);
                setDraggingPinId(null);
                justFinishedDragRef.current = true;
                setTimeout(() => {
                    justFinishedDragRef.current = false;
                }, 100);
            }
        };

        if (draggingPinId) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingPinId, sections, sizingData, costingData, placementData]);

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40"
            onClick={onClose}
        >
            <div 
                className={`glass-panel rounded-2xl shadow-2xl border border-slate-700 p-6 md:p-8 flex flex-col animate-fade-in transition-all duration-300 ${
                    isMaximized 
                        ? 'w-[98vw] h-[98vh] max-w-none m-2' 
                        : 'w-full max-w-5xl m-4'
                }`}
                style={{maxHeight: isMaximized ? '98vh' : '90vh'}}
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
                        <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white" title={isMaximized ? "Restore" : "Maximize"}>
                            {isMaximized ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4v4m0 0H4m4 0L3 3m13 1v4m0 0h4m-4 0l5-5m-5 13v-4m0 0h4m-4 0l5 5M8 20v-4m0 0H4m4 0l-5 5" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                            )}
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white" title="Close">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-6 border-b border-slate-700 mb-6 px-2 flex-shrink-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${
                                activeTab === tab.id 
                                    ? 'border-indigo-500 text-indigo-400' 
                                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 overflow-hidden h-full">
                    <div className="md:col-span-4 flex flex-col items-center overflow-y-auto custom-scrollbar pr-2">
                        <div className="bg-slate-800 rounded-xl p-2 w-full shadow-lg border border-slate-700 flex justify-center items-center">
                            <div 
                                ref={imageContainerRef}
                                className={`relative inline-block ${activeTab === 'placement' ? 'cursor-crosshair' : ''}`} 
                                onClick={handleImageClick}
                            >
                                <img src={techPack.src} alt="Tech pack source image" className="max-w-full h-auto max-h-[50vh] rounded-lg block pointer-events-none" />
                                {activeTab === 'placement' && placementData.map(pin => (
                                    <div 
                                        key={pin.id} 
                                        onMouseDown={(e) => handlePinMouseDown(e, pin.id)}
                                        className={`absolute w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white transform -translate-x-1/2 -translate-y-1/2 ${draggingPinId === pin.id ? 'cursor-grabbing scale-125' : 'cursor-grab hover:scale-110'} transition-transform`} 
                                        style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                                    >
                                        {pin.pinNumber}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-center uppercase tracking-wider font-bold mb-4">Source Asset</p>
                        
                        {techPack.additionalSources && techPack.additionalSources.length > 0 && (
                            <div className="w-full mb-6">
                                <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-bold text-center">Reference Views</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {techPack.additionalSources.map((source, idx) => (
                                        <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
                                            <img src={getDisplaySrc(source)} className="w-full h-full object-cover" alt={`Ref ${idx}`} />
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
                            {activeTab === 'details' ? (
                                <>
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
                                </>
                            ) : activeTab === 'bom' ? (
                                <div className="bg-slate-900/30 rounded-xl p-5 border border-white/5">
                                    <h3 className="text-lg font-bold text-indigo-300 mb-4">Bill of Materials</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left text-slate-300">
                                            <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
                                                <tr>
                                                    <th className="px-4 py-3 rounded-tl-lg">Placement</th>
                                                    <th className="px-4 py-3">Component</th>
                                                    <th className="px-4 py-3">Description</th>
                                                    <th className="px-4 py-3">Color</th>
                                                    <th className="px-4 py-3">Supplier</th>
                                                    <th className="px-4 py-3">Consumption</th>
                                                    <th className="px-4 py-3 rounded-tr-lg"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bomData.map((row, index) => (
                                                    <tr key={row.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-2 py-2">
                                                            <input type="text" value={row.placement} onChange={(e) => { const newData = [...bomData]; newData[index].placement = e.target.value; updateData(sections, sizingData, costingData, placementData, newData); }} className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none px-2 py-1" placeholder="e.g. Main Body" />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input type="text" value={row.component} onChange={(e) => { const newData = [...bomData]; newData[index].component = e.target.value; updateData(sections, sizingData, costingData, placementData, newData); }} className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none px-2 py-1" placeholder="e.g. Fabric" />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input type="text" value={row.description} onChange={(e) => { const newData = [...bomData]; newData[index].description = e.target.value; updateData(sections, sizingData, costingData, placementData, newData); }} className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none px-2 py-1" placeholder="e.g. 100% Cotton" />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input type="text" value={row.color} onChange={(e) => { const newData = [...bomData]; newData[index].color = e.target.value; updateData(sections, sizingData, costingData, placementData, newData); }} className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none px-2 py-1" placeholder="e.g. Navy" />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input type="text" value={row.supplier} onChange={(e) => { const newData = [...bomData]; newData[index].supplier = e.target.value; updateData(sections, sizingData, costingData, placementData, newData); }} className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none px-2 py-1" placeholder="e.g. Generic" />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input type="text" value={row.consumption} onChange={(e) => { const newData = [...bomData]; newData[index].consumption = e.target.value; updateData(sections, sizingData, costingData, placementData, newData); }} className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none px-2 py-1" placeholder="e.g. 1.5m" />
                                                        </td>
                                                        <td className="px-2 py-2 text-right">
                                                            <button 
                                                                onClick={() => {
                                                                    const newData = bomData.filter(r => r.id !== row.id);
                                                                    updateData(sections, sizingData, costingData, placementData, newData);
                                                                }}
                                                                className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                                                                title="Remove Row"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const newRow: BOMRow = { id: self.crypto.randomUUID(), placement: '', component: '', description: '', color: '', supplier: '', consumption: '' };
                                            updateData(sections, sizingData, costingData, placementData, [...bomData, newRow]);
                                        }}
                                        className="mt-4 text-xs font-bold text-slate-500 hover:text-indigo-400 flex items-center transition-colors uppercase tracking-wide"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add BOM Row
                                    </button>
                                </div>
                            ) : activeTab === 'sizing' ? (
                                <div className="bg-slate-900/30 rounded-xl p-5 border border-white/5">
                                    <h3 className="text-lg font-bold text-indigo-300 mb-4">Sizing Matrix</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left text-slate-300">
                                            <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
                                                <tr>
                                                    <th className="px-4 py-3 rounded-tl-lg">Point of Measure</th>
                                                    <th className="px-4 py-3">XS</th>
                                                    <th className="px-4 py-3">S</th>
                                                    <th className="px-4 py-3 bg-indigo-900/30 text-indigo-300">M (Base)</th>
                                                    <th className="px-4 py-3">L</th>
                                                    <th className="px-4 py-3">XL</th>
                                                    <th className="px-4 py-3">XXL</th>
                                                    <th className="px-4 py-3 rounded-tr-lg"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sizingData.map((row, index) => (
                                                    <tr key={row.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-2 py-2">
                                                            <input 
                                                                type="text" 
                                                                value={row.pointOfMeasure} 
                                                                onChange={(e) => {
                                                                    const newData = [...sizingData];
                                                                    newData[index].pointOfMeasure = e.target.value;
                                                                    updateData(sections, newData);
                                                                }}
                                                                className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none px-2 py-1"
                                                                placeholder="e.g. Chest Width"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input type="text" value={row.xs} onChange={(e) => { const newData = [...sizingData]; newData[index].xs = e.target.value; updateData(sections, newData); }} className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none px-2 py-1" />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input type="text" value={row.s} onChange={(e) => { const newData = [...sizingData]; newData[index].s = e.target.value; updateData(sections, newData); }} className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none px-2 py-1" />
                                                        </td>
                                                        <td className="px-2 py-2 bg-indigo-900/10">
                                                            <input type="text" value={row.m} onChange={(e) => { const newData = [...sizingData]; newData[index].m = e.target.value; updateData(sections, newData); }} className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none px-2 py-1 font-medium text-indigo-200" />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input type="text" value={row.l} onChange={(e) => { const newData = [...sizingData]; newData[index].l = e.target.value; updateData(sections, newData); }} className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none px-2 py-1" />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input type="text" value={row.xl} onChange={(e) => { const newData = [...sizingData]; newData[index].xl = e.target.value; updateData(sections, newData); }} className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none px-2 py-1" />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input type="text" value={row.xxl} onChange={(e) => { const newData = [...sizingData]; newData[index].xxl = e.target.value; updateData(sections, newData); }} className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none px-2 py-1" />
                                                        </td>
                                                        <td className="px-2 py-2 text-right">
                                                            <button 
                                                                onClick={() => {
                                                                    const newData = sizingData.filter(r => r.id !== row.id);
                                                                    updateData(sections, newData);
                                                                }}
                                                                className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                                                                title="Remove Row"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const newRow: SizingRow = { id: self.crypto.randomUUID(), pointOfMeasure: '', xs: '', s: '', m: '', l: '', xl: '', xxl: '' };
                                            updateData(sections, [...sizingData, newRow]);
                                        }}
                                        className="mt-4 text-xs font-bold text-slate-500 hover:text-indigo-400 flex items-center transition-colors uppercase tracking-wide"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Measurement Row
                                    </button>
                                </div>
                            ) : activeTab === 'costing' ? (
                                <div className="bg-slate-900/30 rounded-xl p-5 border border-white/5">
                                    <h3 className="text-lg font-bold text-indigo-300 mb-4">Automated Costing Engine</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left text-slate-300">
                                            <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
                                                <tr>
                                                    <th className="px-4 py-3 rounded-tl-lg">Material Name</th>
                                                    <th className="px-4 py-3">Consumption</th>
                                                    <th className="px-4 py-3">Unit</th>
                                                    <th className="px-4 py-3">Cost Per Unit (£)</th>
                                                    <th className="px-4 py-3">Total Cost</th>
                                                    <th className="px-4 py-3 rounded-tr-lg"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {costingData.map((row, index) => (
                                                    <tr key={row.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-2 py-2">
                                                            <input 
                                                                type="text" 
                                                                value={row.materialName} 
                                                                onChange={(e) => {
                                                                    const newData = [...costingData];
                                                                    newData[index].materialName = e.target.value;
                                                                    updateData(sections, sizingData, newData);
                                                                }}
                                                                className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none px-2 py-1"
                                                                placeholder="e.g. Main Fabric"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input 
                                                                type="number" 
                                                                value={row.consumption} 
                                                                onChange={(e) => { 
                                                                    const newData = [...costingData]; 
                                                                    newData[index].consumption = parseFloat(e.target.value) || 0; 
                                                                    updateData(sections, sizingData, newData); 
                                                                }} 
                                                                className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none px-2 py-1" 
                                                                step="0.01"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input 
                                                                type="text" 
                                                                value={row.unit} 
                                                                onChange={(e) => { 
                                                                    const newData = [...costingData]; 
                                                                    newData[index].unit = e.target.value; 
                                                                    updateData(sections, sizingData, newData); 
                                                                }} 
                                                                className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none px-2 py-1" 
                                                                placeholder="e.g. meters"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input 
                                                                type="number" 
                                                                value={row.costPerUnit} 
                                                                onChange={(e) => { 
                                                                    const newData = [...costingData]; 
                                                                    newData[index].costPerUnit = parseFloat(e.target.value) || 0; 
                                                                    updateData(sections, sizingData, newData); 
                                                                }} 
                                                                className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none px-2 py-1" 
                                                                step="0.01"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 font-medium text-slate-200">
                                                            £{(row.consumption * row.costPerUnit).toFixed(2)}
                                                        </td>
                                                        <td className="px-2 py-2 text-right">
                                                            <button 
                                                                onClick={() => {
                                                                    const newData = costingData.filter(r => r.id !== row.id);
                                                                    updateData(sections, sizingData, newData);
                                                                }}
                                                                className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                                                                title="Remove Row"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr className="border-t-2 border-slate-600 bg-slate-800/30">
                                                    <td colSpan={4} className="px-4 py-4 text-right font-bold text-slate-300">
                                                        Estimated Garment Cost:
                                                    </td>
                                                    <td colSpan={2} className="px-4 py-4 text-xl font-bold text-emerald-400">
                                                        £{costingData.reduce((sum, row) => sum + (row.consumption * row.costPerUnit), 0).toFixed(2)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const newRow: CostingRow = { id: self.crypto.randomUUID(), materialName: '', consumption: 0, unit: '', costPerUnit: 0 };
                                            updateData(sections, sizingData, [...costingData, newRow]);
                                        }}
                                        className="mt-4 text-xs font-bold text-slate-500 hover:text-indigo-400 flex items-center transition-colors uppercase tracking-wide"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Item
                                    </button>
                                </div>
                            ) : activeTab === 'placement' ? (
                                <div className="bg-slate-900/30 rounded-xl p-5 border border-white/5 h-full flex flex-col">
                                    <h3 className="text-lg font-bold text-indigo-300 mb-4">Interactive Placement Guide</h3>
                                    <p className="text-sm text-slate-400 mb-6">Click on the source image to add a new placement pin. Edit details below.</p>
                                    <div className="flex-grow overflow-y-auto custom-scrollbar space-y-4 pr-2">
                                        {placementData.length === 0 ? (
                                            <div className="text-center py-10 text-slate-500">No placement pins added yet.</div>
                                        ) : (
                                            placementData.map((pin, index) => (
                                                <div key={pin.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 relative group mt-4">
                                                    <div className="absolute -left-3 -top-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-slate-800">
                                                        {pin.pinNumber}
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            const newData = placementData.filter(p => p.id !== pin.id);
                                                            updateData(sections, sizingData, costingData, newData);
                                                        }}
                                                        className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Delete Pin"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                    <div className="ml-4 mt-1">
                                                        <input 
                                                            type="text" 
                                                            value={pin.title} 
                                                            onChange={(e) => {
                                                                const newData = [...placementData];
                                                                newData[index].title = e.target.value;
                                                                updateData(sections, sizingData, costingData, newData);
                                                            }}
                                                            className="w-full bg-transparent text-white font-bold text-lg border-b border-transparent focus:border-indigo-500 outline-none mb-2 pb-1"
                                                            placeholder="Feature Title (e.g., Rib Knit Collar)"
                                                        />
                                                        <textarea 
                                                            value={pin.note} 
                                                            onChange={(e) => {
                                                                const newData = [...placementData];
                                                                newData[index].note = e.target.value;
                                                                updateData(sections, sizingData, costingData, newData);
                                                            }}
                                                            className="w-full bg-slate-900/50 text-slate-300 text-sm border border-slate-700 focus:border-indigo-500 rounded-lg outline-none p-3 min-h-[80px] resize-y"
                                                            placeholder="Detailed construction note..."
                                                        />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full min-h-[300px]">
                                    <div className="text-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                        <p className="text-slate-400 text-lg font-medium">Module Coming Soon</p>
                                        <p className="text-slate-500 text-sm mt-2">This feature is currently under development.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                         <div className="flex items-center space-x-4 pt-4 border-t border-white/10 mt-auto bg-slate-950/80 z-10">
                             <button
                                onClick={handleSave}
                                className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20"
                            >
                                Save Changes
                            </button>
                            <button
                                onClick={() => setIsExportModalOpen(true)}
                                className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-colors border border-slate-700 flex items-center justify-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export PDF
                            </button>
                         </div>
                    </div>
                </div>
            </div>
            
            {isExportModalOpen && (
                <PdfExportModal 
                    techPack={techPack} 
                    sections={sections} 
                    sizingData={sizingData} 
                    costingData={costingData} 
                    placementData={placementData} 
                    bomData={bomData}
                    onClose={() => setIsExportModalOpen(false)} 
                />
            )}
        </div>
    );
};