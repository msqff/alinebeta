import { GalleryAsset, GeneratedPattern, Collection, ItemSlot, GalleryItem, TechPackAsset, ProductReviewAsset, getDisplaySrc } from '../types';
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, query, where, writeBatch } from 'firebase/firestore';

export interface SessionData {
    ideationGalleryItems: GalleryAsset[];
    finalGalleryItems: GalleryAsset[];
    collectionGalleryItems?: GalleryAsset[];
    generatedPatterns: GeneratedPattern[];
    collections: Collection[];
    itemSlots: ItemSlot[];
}

const sanitizeForFirestore = (obj: any): any => {
    if (obj === undefined) return null;
    if (obj === null) return null;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
    
    // Sort keys to ensure consistent JSON.stringify matching
    const sanitized: any = {};
    Object.keys(obj).sort().forEach(key => {
        if (obj[key] !== undefined) {
            sanitized[key] = sanitizeForFirestore(obj[key]);
        }
    });
    return sanitized;
};

// Track the last saved state stringified to prevent unnecessary write operations
const lastSavedState = new Map<string, string>();

export const saveSession = async (sessionData: SessionData, userId: string): Promise<void> => {
    try {
        let writeCount = 0;
        const saveTasks: Promise<any>[] = [];

        const processItems = (items: any[], collectionName: string) => {
            const dbCollectionRef = collection(db, `users/${userId}/${collectionName}`);
            for (const item of items) {
                const sanitized = sanitizeForFirestore(item);
                const stringified = JSON.stringify(sanitized);
                const docPath = `users/${userId}/${collectionName}/${item.id}`;
                
                if (lastSavedState.get(docPath) !== stringified) {
                    const task = setDoc(doc(dbCollectionRef, item.id), sanitized)
                        .then(() => {
                            lastSavedState.set(docPath, stringified);
                        })
                        .catch(err => {
                            console.error(`Failed to save document ${docPath}:`, err);
                            // Do not update lastSavedState so it tries again next time,
                            // or maybe it's too large and will perpetually fail. 
                        });
                    saveTasks.push(task);
                    writeCount++;
                }
            }
        };

        // Process Collections
        processItems(sessionData.collections, 'collections');

        // Process Item Slots
        processItems(sessionData.itemSlots, 'itemSlots');

        // Process Assets
        const stripSrc = (a: any) => {
            const copy = { ...a };
            delete copy.src;
            return copy;
        };
        const allAssets = [
            ...sessionData.ideationGalleryItems.map(a => ({ ...stripSrc(a), _assetGroup: 'ideation' })),
            ...sessionData.finalGalleryItems.map(a => ({ ...stripSrc(a), _assetGroup: 'final' })),
            ...(sessionData.collectionGalleryItems || []).map(a => ({ ...stripSrc(a), _assetGroup: 'collection' })),
            ...sessionData.generatedPatterns.map(a => ({ ...stripSrc(a), _assetGroup: 'pattern' }))
        ];
        processItems(allAssets, 'assets');

        if (saveTasks.length > 0) {
            await Promise.allSettled(saveTasks);
            console.log(`Attempted to save ${writeCount} changes to Firestore.`);
        }
    } catch (error) {
        console.error('Failed to save session:', error);
        // We still throw if there is a core structural error
        throw error;
    }
};

export const deleteCollectionFromDb = async (collectionId: string, userId: string): Promise<void> => {
    try {
        const batch = writeBatch(db);
        
        // Delete collection doc
        const colPath = `users/${userId}/collections/${collectionId}`;
        batch.delete(doc(db, colPath));
        lastSavedState.delete(colPath);

        // Delete associated item slots
        const slotsSnapshot = await getDocs(query(collection(db, `users/${userId}/itemSlots`), where("collectionId", "==", collectionId)));
        for (const d of slotsSnapshot.docs) {
            batch.delete(d.ref);
            lastSavedState.delete(`users/${userId}/itemSlots/${d.id}`);
        }

        // Delete associated assets
        const assetsSnapshot = await getDocs(query(collection(db, `users/${userId}/assets`), where("collectionId", "==", collectionId)));
        for (const d of assetsSnapshot.docs) {
            batch.delete(d.ref);
            lastSavedState.delete(`users/${userId}/assets/${d.id}`);
        }
        
        await batch.commit();
    } catch (error) {
        console.error("Failed to delete collection data", error);
        throw error;
    }
};

export const deleteItemSlotFromDb = async (slotId: string, userId: string): Promise<void> => {
    try {
        const batch = writeBatch(db);
        
        // Delete item slot doc
        const slotPath = `users/${userId}/itemSlots/${slotId}`;
        batch.delete(doc(db, slotPath));
        lastSavedState.delete(slotPath);

        // Delete associated assets (where itemSlotId == slotId)
        const assetsSnapshot = await getDocs(query(collection(db, `users/${userId}/assets`), where("itemSlotId", "==", slotId)));
        for (const d of assetsSnapshot.docs) {
            batch.delete(d.ref);
            lastSavedState.delete(`users/${userId}/assets/${d.id}`);
        }
        
        await batch.commit();
    } catch (error) {
        console.error("Failed to delete item slot data", error);
        throw error;
    }
};

export const loadSession = async (userId: string): Promise<SessionData> => {
    try {
        // Clear local cache when loading to prevent cross-user state issues if accounts are switched
        lastSavedState.clear();

        const [collectionsSnap, slotsSnap, assetsSnap] = await Promise.all([
            getDocs(collection(db, `users/${userId}/collections`)),
            getDocs(collection(db, `users/${userId}/itemSlots`)),
            getDocs(collection(db, `users/${userId}/assets`))
        ]);

        const collections = collectionsSnap.docs.map(d => {
            const data = d.data() as Collection;
            lastSavedState.set(`users/${userId}/collections/${d.id}`, JSON.stringify(sanitizeForFirestore(data)));
            return data;
        });

        const itemSlots = slotsSnap.docs.map(d => {
            const data = d.data() as ItemSlot;
            lastSavedState.set(`users/${userId}/itemSlots/${d.id}`, JSON.stringify(sanitizeForFirestore(data)));
            return data;
        });

        const allAssets = assetsSnap.docs.map(d => {
            const data = d.data();
            lastSavedState.set(`users/${userId}/assets/${d.id}`, JSON.stringify(sanitizeForFirestore(data)));
            return data;
        });

        const data: SessionData = {
            ideationGalleryItems: [],
            finalGalleryItems: [],
            collectionGalleryItems: [],
            generatedPatterns: [],
            collections: collections || [],
            itemSlots: itemSlots || []
        };

        if (allAssets && Array.isArray(allAssets)) {
            allAssets.forEach((asset: any) => {
                // Restore stripped 'src' from 'source' or 'sources' array
                if (asset.source) {
                    asset.src = getDisplaySrc(asset.source);
                } else if (Array.isArray(asset.sources) && asset.sources.length > 0) {
                    asset.src = getDisplaySrc(asset.sources[0]);
                }
                
                if (asset._assetGroup === 'ideation') {
                    delete asset._assetGroup;
                    data.ideationGalleryItems.push(asset as GalleryAsset);
                } else if (asset._assetGroup === 'final') {
                    delete asset._assetGroup;
                    data.finalGalleryItems.push(asset as GalleryAsset);
                } else if (asset._assetGroup === 'collection') {
                    delete asset._assetGroup;
                    data.collectionGalleryItems!.push(asset as GalleryAsset);
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

export const deleteAssetFromDb = async (assetId: string, userId: string): Promise<void> => {
    try {
        const batch = writeBatch(db);
        const assetPath = `users/${userId}/assets/${assetId}`;
        batch.delete(doc(db, assetPath));
        lastSavedState.delete(assetPath);
        await batch.commit();
    } catch (error) {
        console.error("Failed to delete asset data", error);
        throw error;
    }
};
