import React, { useState } from 'react';
import { GalleryItem, GalleryAsset } from '../types';
import { SessionGallery } from './SessionGallery';

interface DualGalleryProps {
    ideationItems: GalleryAsset[];
    finalItems: GalleryAsset[];
    onSelectItem: (item: GalleryAsset, galleryType: 'ideation' | 'finals') => void;
    onEditItem: (item: GalleryItem) => void;
    onShowTraceability: (item: GalleryAsset) => void;
    onGenerateTechPack: (item: GalleryItem) => void;
    onPromoteItem: (item: GalleryAsset) => void;
    onDemoteItem: (item: GalleryAsset) => void;
    onReview?: (item: GalleryItem) => void;
    onShopperPulse?: (item: GalleryItem) => void;
    selectedItem: GalleryItem | null;
    onOpenFullscreen: () => void;
}

type ActiveGallery = 'ideation' | 'finals';

export const DualGallery: React.FC<DualGalleryProps> = (props) => {
    const [activeGallery, setActiveGallery] = useState<ActiveGallery>('ideation');

    const items = activeGallery === 'ideation' ? props.ideationItems : props.finalItems;

    return (
        <aside className="w-full bg-slate-950/60 backdrop-blur-xl border-t border-white/10 sticky bottom-0 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
            <div className="max-w-screen-2xl mx-auto">
                <div className="flex justify-between items-center pt-4 px-6">
                     <div className="flex space-x-2 bg-slate-900/50 p-1.5 rounded-xl border border-white/5 shadow-inner">
                         <button
                            onClick={() => setActiveGallery('ideation')}
                            className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeGallery === 'ideation' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                        >
                            Ideation ({props.ideationItems.length})
                        </button>
                        <button
                            onClick={() => setActiveGallery('finals')}
                            className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeGallery === 'finals' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                        >
                            Finals ({props.finalItems.length})
                        </button>
                    </div>
                    <button
                        onClick={props.onOpenFullscreen}
                        className="text-xs font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors flex items-center px-4 py-2 rounded-lg hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20"
                    >
                        Expand Gallery
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5" />
                        </svg>
                    </button>
                </div>
                <div className="p-4">
                    <SessionGallery
                        galleryType={activeGallery}
                        items={items}
                        onSelectItem={props.onSelectItem}
                        onEditItem={props.onEditItem}
                        onShowTraceability={props.onShowTraceability}
                        onGenerateTechPack={props.onGenerateTechPack}
                        onPromoteItem={props.onPromoteItem}
                        onDemoteItem={props.onDemoteItem}
                        onReview={props.onReview}
                        onShopperPulse={props.onShopperPulse}
                        selectedItem={props.selectedItem}
                    />
                </div>
            </div>
        </aside>
    );
};