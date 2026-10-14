import React, { useState } from 'react';
import { GalleryItem, GalleryAsset } from '../types';
import { SessionGallery } from './SessionGallery';

interface DualGalleryProps {
    ideationItems: GalleryAsset[];
    finalItems: GalleryAsset[];
    collectionGalleryItems?: GalleryAsset[];
    isCollectionLevelView?: boolean;
    onSelectItem: (item: GalleryAsset, galleryType: 'ideation' | 'finals' | 'collection') => void;
    onEditItem: (item: GalleryItem) => void;
    onShowTraceability: (item: GalleryAsset) => void;
    onGenerateTechPack: (item: GalleryItem) => void;
    onPromoteItem: (item: GalleryAsset) => void;
    onDemoteItem: (item: GalleryAsset) => void;
    onDeleteAsset: (item: GalleryAsset) => void;
    onDuplicateItem?: (item: GalleryAsset) => void;
    onReview?: (item: GalleryItem) => void;
    onShopperPulse?: (item: GalleryItem) => void;
    selectedItem: GalleryItem | null;
    onOpenFullscreen: () => void;
}

type ActiveGallery = 'ideation' | 'finals' | 'collection';

export const DualGallery: React.FC<DualGalleryProps> = (props) => {
    const [activeGallery, setActiveGallery] = useState<ActiveGallery>('ideation');

    const items = activeGallery === 'ideation' ? props.ideationItems : 
                  activeGallery === 'finals' ? props.finalItems : 
                  (props.collectionGalleryItems || []);

    return (
        <aside aria-label="Asset Gallery" className="w-full bg-atelier-950/90 backdrop-blur-xl border-t border-white/[0.08] sticky bottom-0 z-20 shadow-[0_-10px_36px_rgba(0,0,0,0.6)]">
            <div className="max-w-screen-2xl mx-auto">
                <div className="flex justify-between items-center pt-3 px-6">
                     <div className="flex space-x-1.5 bg-atelier-900 p-1 rounded-lg border border-white/[0.07]">
                         <button
                            onClick={() => setActiveGallery('ideation')}
                            className={`px-4 py-1.5 text-xs font-mono tracking-wider uppercase rounded-md transition-all ${activeGallery === 'ideation' ? 'bg-atelier-800 text-white border border-white/[0.08] shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'}`}
                        >
                            Ideation ({props.ideationItems.length})
                        </button>
                        <button
                            onClick={() => setActiveGallery('finals')}
                            className={`px-4 py-1.5 text-xs font-mono tracking-wider uppercase rounded-md transition-all ${activeGallery === 'finals' ? 'bg-atelier-800 text-white border border-white/[0.08] shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'}`}
                        >
                            Finals ({props.finalItems.length})
                        </button>
                        {props.isCollectionLevelView && (
                            <button
                                onClick={() => setActiveGallery('collection')}
                                className={`px-4 py-1.5 text-xs font-mono tracking-wider uppercase rounded-md transition-all ${activeGallery === 'collection' ? 'bg-atelier-800 text-white border border-white/[0.08] shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'}`}
                            >
                                Range Visuals ({props.collectionGalleryItems?.length || 0})
                            </button>
                        )}
                    </div>
                    <button
                        onClick={props.onOpenFullscreen}
                        className="text-xs font-mono tracking-wider uppercase text-zinc-400 hover:text-white transition-colors flex items-center px-3 py-1.5 rounded-lg border border-white/[0.06] hover:bg-white/[0.04]"
                    >
                        <span>Expand Gallery</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5" />
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
                        onDeleteAsset={props.onDeleteAsset}
                        onDuplicateItem={props.onDuplicateItem}
                        onReview={props.onReview}
                        onShopperPulse={props.onShopperPulse}
                        selectedItem={props.selectedItem}
                    />
                </div>
            </div>
        </aside>
    );
};