import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GalleryAsset, ChatMessage, getDisplaySrc } from '../types';
import { sendCopilotMessage } from '../services/geminiService';
import { Spinner } from './common/Spinner';

interface DesignAssistantPanelProps {
    asset: GalleryAsset;
    itemName: string;
    contextAssets?: GalleryAsset[];
    onClose: () => void;
    onOpenLineage: (asset: GalleryAsset) => void;
}

export const DesignAssistantPanel: React.FC<DesignAssistantPanelProps> = ({ asset, itemName, contextAssets, onClose, onOpenLineage }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    
    const childAssets = React.useMemo(() => {
        const children = (contextAssets || []).filter(a => a.parentId === asset.id).reverse();
        return Array.from(new Map(children.map(item => [item.id, item])).values());
    }, [contextAssets, asset.id]);

    const [selectedChildIds, setSelectedChildIds] = useState<Set<string>>(() => new Set(childAssets.map(a => a.id)));
    
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize if new children appear
        setSelectedChildIds(prev => {
            const newSet = new Set(prev);
            let changed = false;
            childAssets.forEach(a => {
                if (!newSet.has(a.id) && !prev.has(a.id)) {
                    // It's tricky to know if it was unchecked or just new.
                    // We'll just add new ones by default when they appear.
                }
            });
            return prev;
        });
    }, [childAssets]);

    // Better way to handle initialization:
    useEffect(() => {
        if (childAssets.length > 0 && selectedChildIds.size === 0 && messages.length === 0) {
            setSelectedChildIds(new Set(childAssets.map(a => a.id)));
        }
    }, [childAssets]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

    const handleSend = async () => {
        if (!inputValue.trim() || isThinking) return;

        const userMessage: ChatMessage = { role: 'user', text: inputValue };
        setMessages(prev => [...prev, userMessage]);
        
        let promptContextString = inputValue;
        const includedChildren = childAssets.filter(c => selectedChildIds.has(c.id));
        if (includedChildren.length > 0) {
            promptContextString += "\n\nThe user has also explicitly included the following derived items for context:\n";
            promptContextString += includedChildren.map(c => `- [${c.tag}] ${'prompt' in c ? c.prompt : ''} ${'summary' in c ? c.summary : ''}`).join("\n");
        }

        setInputValue('');
        setIsThinking(true);

        try {
            const aiResponse = await sendCopilotMessage(promptContextString, asset, messages);
            setMessages(prev => [...prev, { role: 'assistant', text: aiResponse }]);
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'assistant', text: `Sorry, I encountered an error: ${error.message}` }]);
        } finally {
            setIsThinking(false);
        }
    };

    const toggleChildSelection = (id: string) => {
        setSelectedChildIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const getChildDisplaySrc = (child: GalleryAsset) => {
        if ('src' in child) return child.src;
        if (child.tag === 'Multi-View' && child.views.length > 0) return getDisplaySrc(child.views[0].source);
        if (child.tag === 'Mood Board' && child.sources.length > 0) return getDisplaySrc(child.sources[0]);
        return undefined;
    };

    return createPortal(
        <>
            <div className="fixed inset-0 bg-slate-950/20 z-[140] transition-opacity" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-slate-900 border-l border-white/10 shadow-2xl z-[150] flex flex-col transform transition-transform duration-300">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-950/50 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                        <h2 className="font-bold text-white text-lg">Design Assistant</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors bg-slate-800 hover:bg-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
                
                <div className="p-4 border-b border-white/10 flex flex-col justify-center">
                    <div className="flex gap-3 items-center">
                        <img src={'src' in asset ? asset.src : (asset.tag === 'Multi-View' && asset.views.length > 0 ? getDisplaySrc(asset.views[0].source) : (asset.tag === 'Mood Board' && asset.sources.length > 0 ? getDisplaySrc(asset.sources[0]) : ''))} alt="Context" className="w-12 h-12 object-cover rounded-md shadow-md border border-slate-700 bg-slate-800" />
                        <button 
                            onClick={() => onOpenLineage(asset)}
                            className="text-sm font-medium text-indigo-400 hover:text-indigo-300 text-left transition-colors flex items-center gap-1 group"
                            title="View Asset Lineage"
                        >
                            <span className="line-clamp-2">{itemName}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50 group-hover:opacity-100 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </button>
                    </div>
                    {childAssets.length > 0 && (
                        <div className="mt-3 space-y-1.5 pl-1 border-l-2 border-indigo-500/30">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider ml-1">Included Derived Assets</span>
                            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto custom-scrollbar pt-1 pr-1">
                                {childAssets.map(child => (
                                    <label key={child.id} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-white/5 transition-colors cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedChildIds.has(child.id)}
                                            onChange={() => toggleChildSelection(child.id)}
                                            className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
                                        />
                                        <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                                            {getChildDisplaySrc(child) ? (
                                                <img src={getChildDisplaySrc(child)} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-500">{child.tag.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="text-xs text-slate-300 font-medium truncate group-hover:text-white transition-colors">{child.tag}</span>
                                            <span className="text-[10px] text-slate-500 truncate group-hover:text-slate-400 transition-colors">
                                                {'prompt' in child && child.prompt ? child.prompt : ('summary' in child ? 'Summary available' : 'Data asset')}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-slate-500 py-10 mt-10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-amber-500 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            <p className="text-sm">Ask me anything about this design.<br/>I can analyze style, fit, construction, or give creative advice.</p>
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-2xl ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm'} whitespace-pre-wrap text-sm`}>
                                {m.text}
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                        <div className="flex justify-start">
                            <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl rounded-bl-sm flex items-center pb-3 pt-3 pr-5">
                                <Spinner />
                                <span className="ml-3 text-slate-400 text-sm">Thinking...</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-white/10 bg-slate-900 pb-8 md:pb-4">
                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex gap-2 relative rounded-xl bg-slate-800 border border-slate-700 overflow-hidden focus-within:border-indigo-500 transition-colors"
                    >
                        <input 
                            type="text" 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask about this design..."
                            className="flex-1 bg-transparent border-none text-white p-3 focus:outline-none placeholder-slate-500 text-sm"
                            autoComplete="off"
                        />
                        <button 
                            type="submit"
                            disabled={!inputValue.trim() || isThinking}
                            className="p-3 text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:hover:text-indigo-400 transition-colors flex items-center justify-center font-bold text-sm"
                        >
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </>,
        document.body
    );
}
