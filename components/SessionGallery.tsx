
import React from 'react';
import { GalleryItem, GalleryAsset } from '../types';
import { ImageCard } from './ImageCard';

interface SessionGalleryProps {
    galleryType: 'ideation' | 'finals';
    items: GalleryAsset[];
    onSelectItem: (item: GalleryAsset, galleryType: 'ideation' | 'finals') => void;
    onEditItem: (item: GalleryItem) => void;
    onShowTraceability: (item: GalleryAsset) => void;
    onGenerateTechPack: (item: GalleryItem) => void;
    onPromoteItem: (item: GalleryAsset) => void;
    onDemoteItem: (item: GalleryAsset) => void;
    onDeleteAsset: (item: GalleryAsset) => void;
    onReview?: (item: GalleryItem) => void;
    onShopperPulse?: (item: GalleryItem) => void;
    selectedItem: GalleryItem | null;
}

export const SessionGallery: React.FC<SessionGalleryProps> = ({ galleryType, items, onSelectItem, onEditItem, onShowTraceability, onGenerateTechPack, onPromoteItem, onDemoteItem, onDeleteAsset, onReview, onShopperPulse, selectedItem }) => {
    return (
        <div className="flex space-x-4 overflow-x-auto pb-2 px-2 custom-scrollbar">
            {items.length > 0 ? (
                items.map(item => (
                    <ImageCard
                        key={item.id}
                        item={item}
                        galleryType={galleryType}
                        isSelected={selectedItem?.id === item.id}
                        onSelect={() => onSelectItem(item, galleryType)}
                        onEdit={() => onEditItem(item as GalleryItem)}
                        onShowTraceability={() => onShowTraceability(item)}
                        onGenerateTechPack={() => onGenerateTechPack(item as GalleryItem)}
                        onPromote={() => onPromoteItem(item)}
                        onDemote={() => onDemoteItem(item)}
                        onDelete={() => onDeleteAsset(item)}
                        onReview={onReview ? () => onReview(item as GalleryItem) : undefined}
                        onShopperPulse={onShopperPulse ? () => onShopperPulse(item as GalleryItem) : undefined}
                    />
                ))
            ) : (
                <div className="flex items-center justify-center h-32 w-full text-gray-500">
                    <p>This gallery is currently empty.</p>
                </div>
            )}
        </div>
    );
};