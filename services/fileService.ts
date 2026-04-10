import { GalleryAsset, GeneratedPattern, Collection, ItemSlot, GalleryItem, TechPackAsset, ProductReviewAsset } from '../types';

export interface SessionData {
    ideationGalleryItems: GalleryAsset[];
    finalGalleryItems: GalleryAsset[];
    generatedPatterns: GeneratedPattern[];
    collections: Collection[];
    itemSlots: ItemSlot[];
}

export const saveSession = async (sessionData: SessionData): Promise<void> => {
    try {
        // Save Collections
        for (const collection of sessionData.collections) {
            await fetch('/api/collections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(collection)
            });
        }

        // Save Item Slots
        for (const slot of sessionData.itemSlots) {
            await fetch('/api/item-slots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(slot)
            });
        }

        // Save Assets
        const allAssets = [
            ...sessionData.ideationGalleryItems.map(a => ({ ...a, _assetGroup: 'ideation' })),
            ...sessionData.finalGalleryItems.map(a => ({ ...a, _assetGroup: 'final' })),
            ...sessionData.generatedPatterns.map(a => ({ ...a, _assetGroup: 'pattern' }))
        ];

        for (const asset of allAssets) {
            await fetch('/api/assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(asset)
            });
        }
    } catch (error) {
        console.error('Failed to save session:', error);
        throw error;
    }
};

export const loadSession = async (): Promise<SessionData> => {
    try {
        const [collectionsRes, slotsRes, assetsRes] = await Promise.all([
            fetch('/api/collections'),
            fetch('/api/item-slots'),
            fetch('/api/assets')
        ]);

        const collections = await collectionsRes.json();
        const itemSlots = await slotsRes.json();
        const allAssets = await assetsRes.json();

        const data: SessionData = {
            ideationGalleryItems: [],
            finalGalleryItems: [],
            generatedPatterns: [],
            collections: collections || [],
            itemSlots: itemSlots || []
        };

        if (allAssets && Array.isArray(allAssets)) {
            allAssets.forEach((asset: any) => {
                if (asset._assetGroup === 'ideation') {
                    delete asset._assetGroup;
                    data.ideationGalleryItems.push(asset);
                } else if (asset._assetGroup === 'final') {
                    delete asset._assetGroup;
                    data.finalGalleryItems.push(asset);
                } else if (asset._assetGroup === 'pattern') {
                    delete asset._assetGroup;
                    data.generatedPatterns.push(asset);
                } else {
                    // Fallback for legacy or un-grouped assets
                    data.ideationGalleryItems.push(asset);
                }
            });
        }

        return data;
    } catch (error) {
        console.error('Failed to load session:', error);
        throw error;
    }
};
