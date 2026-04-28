import React, { useState, useEffect } from 'react';
import { getDisplaySrc,  GalleryItem, GalleryAsset, MoodBoardAsset, TechPackAsset, MultiViewAsset } from '../types';
import { ImageLightbox } from './ImageLightbox';

interface TraceabilityModalProps {
    startItem: GalleryAsset;
    allItems: GalleryAsset[];
    onClose: () => void;
    onSelectItem: (item: GalleryAsset) => void;
}

const downloadImage = (src: string, mimeType: string | undefined, tag: string, prompt: string, id: string) => {
    const link = document.createElement('a');
    link.href = src;
    const extension = mimeType ? mimeType.split('/')[1] : 'png';
    const safeTag = tag.replace(/\s/g, '_').toLowerCase();
    const safePrompt = (prompt || '').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    link.download = `${safeTag}_${safePrompt || id.slice(0, 8)}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const tagColor: { [key in GalleryAsset['tag']]: string } = {
    'Sketch': 'bg-blue-500',
    'Studio Image': 'bg-purple-500',
    'Model Shot': 'bg-green-500',
    'Mood Board': 'bg-amber-500',
    'Tech Pack': 'bg-cyan-500',
    'Product Review': 'bg-emerald-500',
    'Multi-View': 'bg-orange-500',
};

const ImageNode: React.FC<{item: GalleryItem | TechPackAsset, onClick?: () => void}> = ({ item, onClick }) => {
    const prompt = 'prompt' in item ? item.prompt : '';
    
    return (
         <div
            className={`flex flex-col items-center flex-shrink-0 text-center w-40 ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            <div className={`relative group w-40 h-52 rounded-xl overflow-hidden border-2 mb-3 transition-all shadow-lg ${onClick ? 'border-slate-700 hover:border-indigo-500 hover:scale-105' : 'border-slate-700'}`}>
                <img src={item.src || undefined} alt={prompt} className="w-full h-full object-cover bg-slate-900" />
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        downloadImage(item.src, item.source.mimeType, item.tag, prompt, item.id);
                    }}
                    className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 hover:scale-110"
                    aria-label="Download image"
                    title="Download image"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </button>
            </div>
            <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full text-white ${tagColor[item.tag]}`}>{item.tag}</span>
        </div>
    )
}

const MoodBoardNode: React.FC<{item: MoodBoardAsset}> = ({ item }) => (
    <div className="flex flex-col items-center flex-shrink-0 text-center w-40">
        <div className="relative w-40 h-52 rounded-xl border-2 border-slate-700 mb-3 bg-slate-800 p-1 grid grid-cols-2 grid-rows-2 gap-1 shadow-lg overflow-hidden">
            {item.sources.slice(0, 4).map((source, index) => (
                <img
                    key={index}
                    src={getDisplaySrc(source) || undefined}
                    className="w-full h-full object-cover rounded-md"
                    alt={`Mood board image ${index + 1}`}
                />
            ))}
             {item.sources.length > 4 &&
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white font-bold text-lg backdrop-blur-sm">
                    +{item.sources.length - 4}
                </div>
            }
        </div>
         <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full text-white ${tagColor[item.tag]}`}>{item.tag}</span>
    </div>
)

const MultiViewNode: React.FC<{item: MultiViewAsset, onClick?: () => void}> = ({ item, onClick }) => (
    <div
        className={`flex flex-col items-center flex-shrink-0 text-center w-40 ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
    >
        <div className={`relative group w-40 h-52 rounded-xl border-2 mb-3 bg-slate-800 p-1 grid grid-cols-2 grid-rows-2 gap-1 shadow-lg overflow-hidden transition-all ${onClick ? 'border-slate-700 hover:border-indigo-500 hover:scale-105' : 'border-slate-700'}`}>
            {item.views.slice(0, 4).map((view, index) => (
                <img
                    key={index}
                    src={getDisplaySrc(view.source) || undefined}
                    className="w-full h-full object-cover rounded-md"
                    alt={view.viewName}
                />
            ))}
        </div>
        <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full text-white ${tagColor[item.tag]}`}>{item.tag}</span>
    </div>
)

export const TraceabilityModal: React.FC<TraceabilityModalProps> = ({ startItem, allItems, onClose, onSelectItem }) => {
    const [lineage, setLineage] = useState<GalleryAsset[]>([]);
    const [lightboxItem, setLightboxItem] = useState<{current: GalleryAsset, parent: GalleryAsset | null} | null>(null);

    useEffect(() => {
        const path: GalleryAsset[] = [];
        let currentItem: GalleryAsset | undefined = startItem;
        
        while (currentItem) {
            path.unshift(currentItem);
            
            const parentId = 'parentId' in currentItem ? currentItem.parentId : undefined;
            if (!parentId) {
                break;
            }

            const parent = allItems.find(i => i.id === parentId);
            if (!parent) {
                break;
            }
            
            currentItem = parent;
        }
        setLineage(path);
    }, [startItem, allItems]);

    const handleNodeClick = (item: GalleryAsset, index: number) => {
        if (['Sketch', 'Studio Image', 'Model Shot'].includes(item.tag)) {
            const parent = index > 0 ? lineage[index - 1] : null;
            setLightboxItem({ current: item, parent });
        } else {
            // For other types like Tech Pack or Multi-View, we might just select them
            onSelectItem(item);
        }
    };

    return (
        <>
            <div 
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40"
                onClick={onClose}
            >
                <div 
                    className="glass-panel rounded-2xl shadow-2xl border border-slate-700 p-8 w-full max-w-6xl m-4 animate-fade-in"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold text-white tracking-tight">Asset Lineage</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="flex items-center justify-start space-x-6 p-6 bg-slate-900/30 rounded-xl overflow-x-auto custom-scrollbar">
                        {lineage.map((item, index) => (
                            <React.Fragment key={item.id}>
                            {item.tag === 'Mood Board' ? (
                                    <MoodBoardNode item={item as MoodBoardAsset} />
                            ) : item.tag === 'Multi-View' ? (
                                    <MultiViewNode item={item as MultiViewAsset} onClick={() => handleNodeClick(item, index)} />
                            ) : (
                                    <ImageNode item={item as GalleryItem | TechPackAsset} onClick={() => handleNodeClick(item, index)} />
                            )}
                            
                                {index < lineage.length - 1 && (
                                    <div className="text-slate-600 flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {lightboxItem && (
                <ImageLightbox 
                    currentAsset={lightboxItem.current} 
                    parentAsset={lightboxItem.parent} 
                    onClose={() => setLightboxItem(null)} 
                />
            )}
        </>
    );
};