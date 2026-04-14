import { GalleryAsset, GeneratedPattern, Collection, ItemSlot, GalleryItem, TechPackAsset, ProductReviewAsset } from '../types';
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';

export interface SessionData {
    ideationGalleryItems: GalleryAsset[];
    finalGalleryItems: GalleryAsset[];
    generatedPatterns: GeneratedPattern[];
    collections: Collection[];
    itemSlots: ItemSlot[];
}

export const saveSession = async (sessionData: SessionData, userId: string): Promise<void> => {
    try {
        // Save Collections
        const collectionsRef = collection(db, `users/${userId}/collections`);
        for (const item of sessionData.collections) {
            await setDoc(doc(collectionsRef, item.id), item);
        }

        // Save Item Slots
        const slotsRef = collection(db, `users/${userId}/itemSlots`);
        for (const slot of sessionData.itemSlots) {
            await setDoc(doc(slotsRef, slot.id), slot);
        }

        // Save Assets
        const assetsRef = collection(db, `users/${userId}/assets`);
        const allAssets = [
            ...sessionData.ideationGalleryItems.map(a => ({ ...a, _assetGroup: 'ideation' })),
            ...sessionData.finalGalleryItems.map(a => ({ ...a, _assetGroup: 'final' })),
            ...sessionData.generatedPatterns.map(a => ({ ...a, _assetGroup: 'pattern' }))
        ];

        for (const asset of allAssets) {
            await setDoc(doc(assetsRef, asset.id), asset);
        }
    } catch (error) {
        console.error('Failed to save session:', error);
        throw error;
    }
};

export const loadSession = async (userId: string): Promise<SessionData> => {
    try {
        const [collectionsSnap, slotsSnap, assetsSnap] = await Promise.all([
            getDocs(collection(db, `users/${userId}/collections`)),
            getDocs(collection(db, `users/${userId}/itemSlots`)),
            getDocs(collection(db, `users/${userId}/assets`))
        ]);

        const collections = collectionsSnap.docs.map(d => d.data() as Collection);
        const itemSlots = slotsSnap.docs.map(d => d.data() as ItemSlot);
        const allAssets = assetsSnap.docs.map(d => d.data());

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
                    data.ideationGalleryItems.push(asset as GalleryAsset);
                } else if (asset._assetGroup === 'final') {
                    delete asset._assetGroup;
                    data.finalGalleryItems.push(asset as GalleryAsset);
                } else if (asset._assetGroup === 'pattern') {
                    delete asset._assetGroup;
                    data.generatedPatterns.push(asset as GeneratedPattern);
                } else {
                    // Fallback for legacy or un-grouped assets
                    data.ideationGalleryItems.push(asset as GalleryAsset);
                }
            });
        }

        return data;
    } catch (error) {
        console.error('Failed to load session:', error);
        throw error;
    }
};
