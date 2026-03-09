import { GalleryAsset, GeneratedPattern, Collection, ItemSlot, GalleryItem, TechPackAsset, ProductReviewAsset } from '../types';

export interface SessionData {
    ideationGalleryItems: GalleryAsset[];
    finalGalleryItems: GalleryAsset[];
    generatedPatterns: GeneratedPattern[];
    collections: Collection[];
    itemSlots: ItemSlot[];
}

export const saveSession = (sessionData: SessionData, filename?: string): void => {
    const jsonString = JSON.stringify(sessionData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    let downloadName: string;
    if (filename && filename.trim()) {
        // Sanitize and ensure it ends with .json
        downloadName = filename.trim().endsWith('.json') ? filename.trim() : `${filename.trim()}.json`;
    } else {
        const date = new Date();
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        downloadName = `a-line-ai-session-${dateString}.json`;
    }
    
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const loadSession = (file: File): Promise<SessionData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const result = event.target?.result;
                if (typeof result !== 'string') {
                    throw new Error("File content is not readable as text.");
                }
                const rawData = JSON.parse(result);
                let data: SessionData = {
                    ideationGalleryItems: [],
                    finalGalleryItems: [],
                    generatedPatterns: [],
                    collections: [],
                    itemSlots: []
                };

                // Normalize Data Structure
                if (rawData.ideationGalleryItems) data.ideationGalleryItems = rawData.ideationGalleryItems;
                else if (rawData.galleryItems) data.ideationGalleryItems = rawData.galleryItems; // Old format

                if (rawData.finalGalleryItems) data.finalGalleryItems = rawData.finalGalleryItems;
                if (rawData.generatedPatterns) data.generatedPatterns = rawData.generatedPatterns;
                if (rawData.collections) data.collections = rawData.collections;
                if (rawData.itemSlots) data.itemSlots = rawData.itemSlots;

                // RECOVERY LOGIC: If we have items but no collections (legacy save), reconstruct them
                const allItems = [...data.ideationGalleryItems, ...data.finalGalleryItems];
                if (allItems.length > 0 && data.collections.length === 0) {
                    console.warn("Detected orphan items. Initiating session recovery...");
                    
                    const recoveryId = self.crypto.randomUUID();
                    // Create a bucket collection
                    const recoveredCollection: Collection = {
                        id: recoveryId,
                        name: "Restored Session " + new Date().toLocaleTimeString(),
                        masterMoodBoard: { data: "", mimeType: "image/png" }, // Placeholder, logic will handle missing image
                        extractedPalette: ['#000000', '#333333', '#666666', '#999999', '#CCCCCC'],
                        styleDna: "Restored from saved session file.",
                        created: Date.now()
                    };

                    // Try to find a mood board in the items to use as master
                    const mb = allItems.find(i => i.tag === 'Mood Board') as any;
                    if (mb && mb.sources && mb.sources.length > 0) {
                        recoveredCollection.masterMoodBoard = mb.sources[0];
                    } else if (allItems.length > 0) {
                        // Use first available image that has a source
                        const firstWithSource = allItems.find(i => 'source' in i) as (GalleryItem | TechPackAsset | ProductReviewAsset) | undefined;
                        if (firstWithSource) {
                            recoveredCollection.masterMoodBoard = firstWithSource.source;
                        }
                    }

                    data.collections.push(recoveredCollection);

                    // Reconstruct Slots
                    // Group items by their existing itemSlotId
                    const slotsMap = new Map<string, GalleryAsset[]>();
                    const itemsWithoutSlot: GalleryAsset[] = [];

                    allItems.forEach(item => {
                        // Fix item collection ID
                        item.collectionId = recoveryId;

                        if (item.itemSlotId) {
                            if (!slotsMap.has(item.itemSlotId)) {
                                slotsMap.set(item.itemSlotId, []);
                            }
                            slotsMap.get(item.itemSlotId)?.push(item);
                        } else {
                            itemsWithoutSlot.push(item);
                        }
                    });

                    // Create ItemSlot objects for grouped items
                    slotsMap.forEach((slotItems, slotId) => {
                        // Try to find a good name
                        const sketch = slotItems.find(i => i.tag === 'Sketch') as GalleryItem | undefined;
                        const studio = slotItems.find(i => i.tag === 'Studio Image') as GalleryItem | undefined;
                        const prompt = sketch?.prompt || studio?.prompt || "Untitled Item";
                        const shortName = prompt.split(' ').slice(0, 4).join(' '); // First 4 words

                        const newSlot: ItemSlot = {
                            id: slotId,
                            collectionId: recoveryId,
                            name: shortName || "Restored Item",
                            sketchId: sketch?.id,
                            studioImageId: studio?.id,
                            // techPackId logic could be inferred but simple is fine
                        };
                        data.itemSlots.push(newSlot);
                    });

                    // Handle items without slots - dump them in a "General" slot
                    if (itemsWithoutSlot.length > 0) {
                        const generalSlotId = self.crypto.randomUUID();
                        const generalSlot: ItemSlot = {
                            id: generalSlotId,
                            collectionId: recoveryId,
                            name: "Unassigned Items"
                        };
                        data.itemSlots.push(generalSlot);
                        itemsWithoutSlot.forEach(item => item.itemSlotId = generalSlotId);
                    }
                }

                resolve(data);
            } catch (error) {
                console.error(error);
                reject(new Error("Failed to parse session file. Make sure it's a valid JSON file."));
            }
        };
        reader.onerror = () => {
            reject(new Error("Failed to read the file."));
        };
        reader.readAsText(file);
    });
};