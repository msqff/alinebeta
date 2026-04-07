import React, { useState } from 'react';
import { getDisplaySrc,  GalleryAsset, GalleryItem, MoodBoardAsset, TechPackAsset, ProductReviewAsset, MultiViewAsset } from '../types';

interface FullscreenGalleryModalProps {
    ideationItems: GalleryAsset[];
    finalItems: GalleryAsset[];
    onClose: () => void;
    onSelectItem: (item: GalleryAsset, galleryType: 'ideation' | 'finals') => void;
    onEditItem: (item: GalleryItem) => void;
    onShowTraceability: (item: GalleryAsset) => void;
    onGenerateTechPack: (item: GalleryItem) => void;
    onPromoteItem: (item: GalleryAsset) => void;
    onDemoteItem: (item: GalleryAsset) => void;
    onSaveSession: () => void;
    onReview?: (item: GalleryItem) => void;
}

const tagColor = {
    'Sketch': 'bg-blue-500',
    'Studio Image': 'bg-purple-500',
    'Model Shot': 'bg-green-500',
    'Mood Board': 'bg-amber-500',
    'Tech Pack': 'bg-cyan-500',
    'Product Review': 'bg-emerald-500',
    'Multi-View': 'bg-orange-500',
};

const FullscreenCard: React.FC<{
    item: GalleryAsset;
    galleryType: 'ideation' | 'finals';
    onSelect: () => void;
    onEdit: () => void;
    onShowTraceability: () => void;
    onGenerateTechPack: () => void;
    onPromote: () => void;
    onDemote: () => void;
    onReview?: () => void;
}> = ({ item, galleryType, onSelect, onEdit, onShowTraceability, onGenerateTechPack, onPromote, onDemote, onReview }) => {
    const handleActionClick = (e: React.MouseEvent, action: () => void) => { e.stopPropagation(); action(); };

    const isMoodBoard = item.tag === 'Mood Board';
    const isTechPack = item.tag === 'Tech Pack';
    const isReview = item.tag === 'Product Review';
    const isMultiView = item.tag === 'Multi-View';
    
    let imageSrc: string | undefined;
    let promptText: string | undefined;

    if (isMoodBoard) {
        imageSrc = getDisplaySrc((item as MoodBoardAsset).sources[0]);
    } else if (isTechPack) {
        imageSrc = (item as TechPackAsset).src;
    } else if (isReview) {
        imageSrc = (item as ProductReviewAsset).src;
    } else if (isMultiView) {
        // Multi-View rendered custom below
    } else {
        imageSrc = (item as GalleryItem).src;
        promptText = item.prompt;
    }

    const canShowTraceability = 'parentId' in item && !!item.parentId;
    const canEdit = (item.tag === 'Sketch' || item.tag === 'Studio Image') && galleryType === 'ideation';
    const canGenerateTechPack = item.tag === 'Studio Image' && galleryType === 'finals';
    const canReview = galleryType === 'finals' && !isMoodBoard && !isTechPack && !isReview && !isMultiView;
    const canPromote = galleryType === 'ideation';
    const canDemote = galleryType === 'finals';

    return (
        <div
            className={`w-full aspect-[3/4] rounded-xl overflow-hidden relative group bg-slate-800 shadow-lg border border-white/5 hover:border-indigo-500/50 transition-all ${isMoodBoard || isMultiView ? 'cursor-default' : 'cursor-pointer'}`}
            onClick={onSelect}
        >
            {isMultiView ? (
                <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-[1px] bg-slate-800">
                    {(item as MultiViewAsset).views.slice(0, 4).map((view, i) => (
                        <img 
                            key={i} 
                            src={getDisplaySrc(view.source)} 
                            className="w-full h-full object-cover" 
                            alt={view.view} 
                        />
                    ))}
                </div>
            ) : (
                <img src={imageSrc} alt={promptText || item.tag} className="w-full h-full object-cover" />
            )}
            
            <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-[2px]">
                {isTechPack && <div className="text-white text-center p-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg><p className="text-sm font-bold mt-1 drop-shadow-md">View Tech Pack</p></div>}
                {isReview && <div className="text-white text-center p-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg><p className="text-sm font-bold mt-1 drop-shadow-md">View Audit</p></div>}
                {isMoodBoard && <div className="text-center text-white p-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1.586-1.586a2 2 0 00-2.828 0L6 14m6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><p className="text-sm font-bold mt-1 drop-shadow-md">{(item as MoodBoardAsset).sources.length} Images</p></div>}
                {isMultiView && <div className="text-center text-white p-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg><p className="text-sm font-bold mt-1 drop-shadow-md">{(item as MultiViewAsset).views.length} Angles</p></div>}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full text-white shadow-sm ${tagColor[item.tag]}`}>{item.tag}</span>
            </div>
            
            <div className="absolute top-2 right-2 flex flex-col space-y-2">
                {canPromote && <button onClick={(e) => handleActionClick(e, onPromote)} className="p-2 bg-slate-900/80 backdrop-blur-sm rounded-full text-yellow-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-yellow-400 hover:text-slate-900 hover:scale-110 shadow-lg" aria-label="Promote to Finals" title="Promote to Finals"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg></button>}
                {canDemote && <button onClick={(e) => handleActionClick(e, onDemote)} className="p-2 bg-slate-900/80 backdrop-blur-sm rounded-full text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white hover:scale-110 shadow-lg" aria-label="Demote from Finals" title="Demote from Finals"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></button>}
                {canEdit && <button onClick={(e) => handleActionClick(e, onEdit)} className="p-2 bg-slate-900/80 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-slate-900 hover:scale-110 shadow-lg" aria-label="Edit" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>}
            </div>

            <div className="absolute top-2 left-2 flex flex-col space-y-1.5">
                {canShowTraceability && <button onClick={(e) => handleActionClick(e, onShowTraceability)} className="p-2 bg-slate-900/80 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-slate-900 hover:scale-110 shadow-lg" aria-label="Show lineage" title="Show lineage"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg></button>}
            </div>
            
            <div className="absolute bottom-2 left-2 flex flex-col space-y-1.5">
                {canGenerateTechPack && <button onClick={(e) => handleActionClick(e, onGenerateTechPack)} className="p-2 bg-slate-900/80 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-slate-900 hover:scale-110 shadow-lg" aria-label="Generate Tech Pack" title="Generate Tech Pack"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg></button>}
                {canReview && onReview && (
                    <button onClick={(e) => handleActionClick(e, onReview)} className="p-2 bg-emerald-600/80 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-500 hover:scale-110 shadow-lg" aria-label="Compliance Check" title="Compliance Check">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </button>
                )}
            </div>
        </div>
    );
};

export const FullscreenGalleryModal: React.FC<FullscreenGalleryModalProps> = ({ 
    ideationItems, 
    finalItems, 
    onClose, 
    onSelectItem,
    onEditItem,
    onShowTraceability,
    onGenerateTechPack,
    onPromoteItem,
    onDemoteItem,
    onSaveSession,
    onReview
}) => {
    const [activeTab, setActiveTab] = useState<'ideation' | 'finals'>('ideation');
    const items = activeTab === 'ideation' ? ideationItems : finalItems;

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex flex-col animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-slate-900/50">
                <div className="flex items-center space-x-6">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Full Gallery</h2>
                    <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg">
                        <button 
                            onClick={() => setActiveTab('ideation')}
                            className={`px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wide transition-all ${activeTab === 'ideation' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Ideation ({ideationItems.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('finals')}
                            className={`px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wide transition-all ${activeTab === 'finals' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Finals ({finalItems.length})
                        </button>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <button onClick={onSaveSession} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 font-medium text-sm border border-slate-700">
                        Save Session
                    </button>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1.586-1.586a2 2 0 00-2.828 0L6 14m6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xl font-light">No items in this gallery yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {items.map(item => (
                            <FullscreenCard 
                                key={item.id}
                                item={item}
                                galleryType={activeTab}
                                onSelect={() => onSelectItem(item, activeTab)}
                                onEdit={() => onEditItem(item as GalleryItem)}
                                onShowTraceability={() => onShowTraceability(item)}
                                onGenerateTechPack={() => onGenerateTechPack(item as GalleryItem)}
                                onPromote={() => onPromoteItem(item)}
                                onDemote={() => onDemoteItem(item)}
                                onReview={onReview ? () => onReview(item as GalleryItem) : undefined}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};