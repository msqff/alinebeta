
import React from 'react';
import { getDisplaySrc,  GalleryAsset, MoodBoardAsset, TechPackAsset, GalleryItem, ProductReviewAsset, MultiViewAsset } from '../types';

interface ImageCardProps {
    item: GalleryAsset;
    galleryType: 'ideation' | 'finals';
    isSelected: boolean;
    onSelect: () => void;
    onEdit: () => void;
    onShowTraceability: () => void;
    onGenerateTechPack: () => void;
    onPromote: () => void;
    onDemote: () => void;
    onDelete: () => void;
    onDuplicate?: () => void;
    onReview?: () => void;
    onShopperPulse?: () => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ item, galleryType, isSelected, onSelect, onEdit, onShowTraceability, onGenerateTechPack, onPromote, onDemote, onDelete, onDuplicate, onReview, onShopperPulse }) => {
    const tagColor = {
        'Sketch': 'bg-blue-500',
        'Studio Image': 'bg-purple-500',
        'Model Shot': 'bg-green-500',
        'Mood Board': 'bg-amber-500',
        'Tech Pack': 'bg-cyan-500',
        'Product Review': 'bg-emerald-500',
        'Multi-View': 'bg-orange-500',
    };

    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

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
        // Multi-View handles its own rendering below
    } else {
        imageSrc = (item as GalleryItem).src;
        promptText = item.prompt;
    }
    
    const canShowTraceability = 'parentId' in item && !!item.parentId;
    const canEdit = (item.tag === 'Sketch' || item.tag === 'Studio Image') && galleryType === 'ideation';
    const canGenerateTechPack = item.tag === 'Studio Image' && galleryType === 'finals';
    const canReview = galleryType === 'finals' && !isMoodBoard && !isTechPack && !isReview && !isMultiView;
    const canShopperPulse = galleryType === 'finals' && (item.tag === 'Studio Image' || item.tag === 'Model Shot');
    const canPromote = galleryType === 'ideation';
    const canDemote = galleryType === 'finals';
    const canDelete = galleryType === 'ideation';

    return (
        <div
            className={`flex-shrink-0 w-36 h-48 rounded-lg overflow-hidden relative group border-4 transition-colors ${isSelected ? 'border-jelly-bean-500' : 'border-transparent hover:border-jelly-bean-700/50'} ${isMoodBoard || isMultiView ? 'cursor-default' : 'cursor-pointer'}`}
            onClick={onSelect}
        >
            {isMultiView ? (
                <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-[1px] bg-slate-800">
                    {(item as MultiViewAsset).views.slice(0, 4).map((view, i) => (
                        <img 
                            key={i} 
                            src={getDisplaySrc(view.source) || undefined} 
                            className="w-full h-full object-cover" 
                            alt={view.view} 
                        />
                    ))}
                </div>
            ) : (
                <img src={imageSrc || undefined} alt={promptText || item.tag} className="w-full h-full object-cover" />
            )}

            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                 {isTechPack && (
                    <div className="text-white text-center p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                         <p className="text-xs font-bold mt-1">View/Edit</p>
                    </div>
                 )}
                 {isReview && (
                    <div className="text-white text-center p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                         <p className="text-xs font-bold mt-1">View Audit</p>
                    </div>
                 )}
                 {isMoodBoard && (
                    <div className="text-center text-white p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1.586-1.586a2 2 0 00-2.828 0L6 14m6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm font-bold mt-1">{(item as MoodBoardAsset).sources.length} Images</p>
                    </div>
                 )}
                 {isMultiView && (
                    <div className="text-center text-white p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <p className="text-xs font-bold mt-1">{(item as MultiViewAsset).views.length} Angles</p>
                    </div>
                 )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                 <span className={`px-2 py-0.5 text-xs font-bold rounded-full text-white ${tagColor[item.tag]}`}>
                    {item.tag === 'Product Review' ? 'Basic Audit' : item.tag}
                 </span>
            </div>
            
            <div className="absolute top-2 right-2 flex flex-col space-y-1.5">
                {canPromote && (
                    <button onClick={(e) => handleActionClick(e, onPromote)} className="p-1.5 bg-gray-800/60 rounded-full text-yellow-300 opacity-0 group-hover:opacity-100 transition-all hover:bg-opacity-80 hover:scale-110" aria-label="Promote to Finals" title="Promote to Finals">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    </button>
                )}
                {canDemote && (
                     <button onClick={(e) => handleActionClick(e, onDemote)} className="p-1.5 bg-gray-800/60 rounded-full text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-opacity-80 hover:scale-110" aria-label="Demote from Finals" title="Demote from Finals">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    </button>
                )}
                 {canEdit && (
                    <button onClick={(e) => handleActionClick(e, onEdit)} className="p-1.5 bg-gray-800/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-opacity-80 hover:scale-110" aria-label="Edit" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                    </button>
                )}
                 {onDuplicate && (
                    <button onClick={(e) => handleActionClick(e, onDuplicate)} className="p-1.5 bg-gray-800/60 rounded-full text-blue-300 opacity-0 group-hover:opacity-100 transition-all hover:bg-opacity-80 hover:scale-110" aria-label="Duplicate Asset" title="Duplicate Asset">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                    </button>
                )}
                 {canDelete && (
                     <button onClick={(e) => handleActionClick(e, onDelete)} className="p-1.5 bg-gray-800/60 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-opacity-80 hover:scale-110" aria-label="Delete Asset" title="Delete Asset">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                     </button>
                 )}
            </div>
            
            <div className="absolute top-2 left-2 flex flex-col space-y-1.5">
                 {canShowTraceability && (
                    <button onClick={(e) => handleActionClick(e, onShowTraceability)} className="p-1.5 bg-gray-800/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-opacity-80 hover:scale-110" aria-label="Show lineage" title="Show lineage">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </button>
                )}
            </div>

            <div className="absolute bottom-2 left-2 flex flex-col space-y-1.5">
                {canGenerateTechPack && (
                    <button onClick={(e) => handleActionClick(e, onGenerateTechPack)} className="p-1.5 bg-gray-800/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-opacity-80 hover:scale-110" aria-label="Generate Tech Pack" title="Generate Tech Pack">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    </button>
                )}
                {canReview && onReview && (
                    <button onClick={(e) => handleActionClick(e, onReview)} className="p-1.5 bg-emerald-600/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-500 hover:scale-110" aria-label="Compliance Check" title="Compliance Check">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </button>
                )}
                {canShopperPulse && onShopperPulse && (
                    <button onClick={(e) => handleActionClick(e, onShopperPulse)} className="p-1.5 bg-pink-600/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-pink-500 hover:scale-110" aria-label="Shopper Pulse" title="Shopper Pulse">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>
                )}
            </div>

            {isSelected && <div className="absolute inset-0 border-4 border-jelly-bean-500 rounded-md pointer-events-none"></div>}
        </div>
    );
};