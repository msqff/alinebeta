import React, { useState, useRef, useEffect } from 'react';
import { TechPackItem } from '../types';

export const InteractiveAttributeRow: React.FC<{
    item: TechPackItem;
    onUpdate: (newItem: TechPackItem) => void;
    onDelete: () => void;
}> = ({ item, onUpdate, onDelete }) => {
    const [showOptions, setShowOptions] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [localLabel, setLocalLabel] = useState(item.label);
    const [localValue, setLocalValue] = useState(item.value);

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
        const oldValue = item.value;
        const newOptions = item.options.filter(o => o !== option);
        newOptions.push(oldValue);
        
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
                        className={`w-full bg-slate-900/50 border rounded-lg text-sm py-1.5 px-3 outline-none focus:ring-1 transition-all ${item.hasDrift ? 'border-amber-500/50 text-amber-200 focus:ring-amber-500 bg-amber-500/5' : 'border-slate-700 text-slate-200 focus:ring-indigo-500'} ${item.options.length > 0 || item.hasDrift ? 'pr-8' : ''}`}
                        placeholder="Value"
                        title={item.hasDrift ? `Drift Detected: Original spec was '${item.originalValue}'` : ''}
                    />
                    {item.hasDrift && (
                        <div className="absolute right-8 top-1/2 transform -translate-y-1/2 text-amber-500" title={`Drift Detected: Original spec was '${item.originalValue}'`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    )}
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
