import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { CollectionSelector } from './components/CollectionSelector';
import { ItemManager } from './components/ItemManager';
import { ToolSelector } from './components/ToolSelector';
import { SketchGenerator } from './components/SketchGenerator';
import { ProductVisualiser } from './components/ProductVisualizer';
import { ModelPlacement } from './components/ModelPlacement';
import { SketchEditor } from './components/SketchEditor';
import { StudioImageEditor } from './components/StudioImageEditor';
import { MoodBoardAnalyst } from './components/MoodBoardAnalyst';
import { TechPackGenerator } from './components/TechPackGenerator';
import { ProductReviewTool } from './components/ProductReviewTool';
import { ShopperPulseTool } from './components/ShopperPulseTool';
import { MultiViewGenerator } from './components/MultiViewGenerator';
import { DualGallery } from './components/DualGallery';
import { Spinner } from './components/common/Spinner';
import { TraceabilityModal } from './components/TraceabilityModal';
import { PatternGalleryModal } from './components/PatternGalleryModal';
import { TechPackModal } from './components/TechPackModal';
import { ProductReviewModal } from './components/ProductReviewModal';
import { MultiViewModal } from './components/MultiViewModal';
import { TechPackWarningModal } from './components/TechPackWarningModal';
import { AuditWarningModal } from './components/AuditWarningModal';
import { ShopperPulseModal } from './components/ShopperPulseModal';
import { FullscreenGalleryModal } from './components/FullscreenGalleryModal';
import { PromptLibraryModal } from './components/PromptLibraryModal';
import { generateSketches, visualiseProduct, placeOnModel, tweakSketch, generatePattern, generateTechPack, tweakStudioImage, generateProductReview, generateMultiViews, fileToBase64 } from './services/geminiService';
import { saveSession, loadSession, SessionData, deleteCollectionFromDb, deleteItemSlotFromDb, deleteAssetFromDb } from './services/fileService';
import { Tool, GalleryItem, ImageSource, GeneratedPattern, GalleryAsset, MoodBoardAsset, TechPackAsset, TechPackSection, ProductReviewResult, ProductReviewAsset, MultiViewAsset, Collection, ItemSlot, SizingRow, CostingRow, PlacementPin, BOMRow, getDisplaySrc } from './types';
import { auth } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User, signOut } from 'firebase/auth';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // Collection State
    const [collections, setCollections] = useState<Collection[]>([]);
    const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
    const [itemSlots, setItemSlots] = useState<ItemSlot[]>([]);
    
    // Original State
    const [activeTool, setActiveTool] = useState<Tool | null>(null);
    const [activeSlotId, setActiveSlotId] = useState<string | null>(null); // Track which slot triggered a tool
    const [ideationGalleryItems, setIdeationGalleryItems] = useState<GalleryAsset[]>([]);
    const [finalGalleryItems, setFinalGalleryItems] = useState<GalleryAsset[]>([]);
    const [selectedImageForTool, setSelectedImageForTool] = useState<GalleryItem | null>(null);
    const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [traceabilityStartItem, setTraceabilityStartItem] = useState<GalleryAsset | null>(null);
    const [generatedPatterns, setGeneratedPatterns] = useState<GeneratedPattern[]>([]);
    const [isPatternModalOpen, setIsPatternModalOpen] = useState(false);
    const [isGalleryFullscreen, setIsGalleryFullscreen] = useState(false);
    const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
    
    const [viewingTechPack, setViewingTechPack] = useState<TechPackAsset | null>(null);
    const [viewingReview, setViewingReview] = useState<ProductReviewAsset | null>(null);
    const [viewingMultiView, setViewingMultiView] = useState<MultiViewAsset | null>(null);
    
    const [itemPendingTechPack, setItemPendingTechPack] = useState<GalleryItem | null>(null);
    const [itemPendingAudit, setItemPendingAudit] = useState<GalleryItem | null>(null);
    const [itemPendingShopperPulse, setItemPendingShopperPulse] = useState<GalleryItem | null>(null);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            // Optionally clear state if needed, though unmounting/remounting or onAuthStateChanged will handle most.
            setUser(null);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    // Load session on mount
    useEffect(() => {
        if (!user) return;
        const initData = async () => {
            setIsLoading(true);
            try {
                const sessionData = await loadSession(user.uid);
                setIdeationGalleryItems(sessionData.ideationGalleryItems);
                setFinalGalleryItems(sessionData.finalGalleryItems);
                setGeneratedPatterns(sessionData.generatedPatterns);
                setCollections(sessionData.collections);
                setItemSlots(sessionData.itemSlots);
                
                if (sessionData.collections.length === 1) {
                    setActiveCollection(sessionData.collections[0]);
                }
            } catch (err) {
                console.error("Failed to load initial data", err);
            } finally {
                setIsLoading(false);
                setIsInitialized(true);
            }
        };
        initData();
    }, [user]);

    // Auto-Save
    useEffect(() => {
        if (!isInitialized || !user) return;

        const timeoutId = setTimeout(async () => {
            try {
                await saveSession({ 
                    ideationGalleryItems, 
                    finalGalleryItems, 
                    generatedPatterns,
                    collections,
                    itemSlots
                }, user.uid);
            } catch (err) {
                console.error("Auto-save failed", err);
            }
        }, 2000); // 2-second debounce

        return () => clearTimeout(timeoutId);
    }, [collections, itemSlots, ideationGalleryItems, finalGalleryItems, generatedPatterns, isInitialized, user]);

    // Collection Management
    const handleCreateCollection = (newCollection: Collection, initialItems: string[] = []) => {
        setCollections(prev => [...prev, newCollection]);
        setActiveCollection(newCollection);
        
        // Auto-create slots for selected initial items
        if (initialItems.length > 0) {
            const newSlots: ItemSlot[] = initialItems.map(name => ({
                id: self.crypto.randomUUID(),
                collectionId: newCollection.id,
                name: name
            }));
            setItemSlots(prev => [...prev, ...newSlots]);
        }
    };

    const handleDeleteCollection = async (collectionId: string) => {
        if (!user) return;
        setIsLoading(true);
        try {
            await deleteCollectionFromDb(collectionId, user.uid);
            setCollections(prev => prev.filter(c => c.id !== collectionId));
            setItemSlots(prev => prev.filter(s => s.collectionId !== collectionId));
            setIdeationGalleryItems(prev => prev.filter(i => i.collectionId !== collectionId));
            setFinalGalleryItems(prev => prev.filter(i => i.collectionId !== collectionId));
            setGeneratedPatterns(prev => prev.filter(p => p.collectionId !== collectionId));
            if (activeCollection?.id === collectionId) {
                setActiveCollection(null);
                setActiveSlotId(null);
                setActiveTool(null);
            }
        } catch (e) {
            console.error("Failed to delete collection from DB:", e);
            setError("Failed to delete collection from database.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteItemSlot = async (slotId: string) => {
        if (!user) return;
        setIsLoading(true);
        try {
            await deleteItemSlotFromDb(slotId, user.uid);
            setItemSlots(prev => prev.filter(s => s.id !== slotId));
            setIdeationGalleryItems(prev => prev.filter(i => i.itemSlotId !== slotId));
            setFinalGalleryItems(prev => prev.filter(i => i.itemSlotId !== slotId));
            setGeneratedPatterns(prev => prev.filter(p => p.itemSlotId !== slotId));
            if (activeSlotId === slotId) {
                setActiveSlotId(null);
                setActiveTool(null);
            }
        } catch (e) {
            console.error("Failed to delete item slot from DB:", e);
            setError("Failed to delete item slot from database.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectCollection = (collection: Collection) => {
        setActiveCollection(collection);
        setActiveTool(null);
    };

    const handleExitCollection = () => {
        setActiveCollection(null);
        setActiveTool(null);
        setSelectedImageForTool(null);
        setActiveSlotId(null);
    };

    const handleAddItemSlot = (name: string) => {
        if (!activeCollection) return;
        const newSlot: ItemSlot = {
            id: self.crypto.randomUUID(),
            collectionId: activeCollection.id,
            name: name
        };
        setItemSlots(prev => [...prev, newSlot]);
        // Only auto-enter if explicitly adding one manually, not when suggested items are added? 
        // User flow suggests they want to see it added to grid. Let's enter it.
        setActiveSlotId(newSlot.id);
    };

    const handleEnterItemWorkspace = (slotId: string) => {
        setActiveSlotId(slotId);
        setActiveTool(null);
        setSelectedImageForTool(null);
    };

    const handleExitItemWorkspace = () => {
        setActiveSlotId(null);
        setActiveTool(null);
        setSelectedImageForTool(null);
    };

    const handleSelectSlotItem = (slotId: string, type: 'sketch' | 'studio' | 'techpack') => {
        // IMPORTANT: Set active slot so subsequent actions are linked
        setActiveSlotId(slotId);

        const slot = itemSlots.find(s => s.id === slotId);
        if (!slot) return;
        
        const assetId = type === 'sketch' ? slot.sketchId : type === 'studio' ? slot.studioImageId : slot.techPackId;
        const asset = [...ideationGalleryItems, ...finalGalleryItems].find(a => a.id === assetId);
        
        if (asset) {
            if (type === 'techpack') {
                 setViewingTechPack(asset as TechPackAsset);
            } else {
                 handleSelectGalleryItem(asset, type === 'sketch' ? 'ideation' : 'finals');
            }
        }
    };

    const handleOpenToolForSlot = (tool: Tool, slotId: string) => {
        setActiveSlotId(slotId);
        const slot = itemSlots.find(s => s.id === slotId);
        const allAssets = [...ideationGalleryItems, ...finalGalleryItems];
        
        // Pre-select image if moving down chain
        if (tool === 'visualiser' && slot?.sketchId) {
             const sketch = allAssets.find(i => i.id === slot.sketchId) as GalleryItem;
             if (sketch) setSelectedImageForTool(sketch);
        } else if (tool === 'techpack' && slot?.studioImageId) {
             const studio = allAssets.find(i => i.id === slot.studioImageId) as GalleryItem;
             if (studio) handleGenerateTechPack(studio); // Auto-trigger for slot
             return; 
        }
        
        setActiveTool(tool);
    }


    const handleSelectTool = (tool: Tool) => {
        setActiveTool(tool);
        setError(null);
        
        let preselectedImage = null;
        if (activeSlotId) {
            const allAssets = [...ideationGalleryItems, ...finalGalleryItems];
            
            if (tool === 'visualiser' || tool === 'sketchEditor') {
                const finalSketch = finalGalleryItems.find(i => i.itemSlotId === activeSlotId && i.tag === 'Sketch');
                if (finalSketch) {
                    preselectedImage = finalSketch as GalleryItem;
                }
            } else if (tool !== 'sketch' && tool !== 'moodboard') {
                const finalStudioImage = finalGalleryItems.find(i => i.itemSlotId === activeSlotId && i.tag === 'Studio Image');
                if (finalStudioImage) {
                    preselectedImage = finalStudioImage as GalleryItem;
                }
            }
        }
        
        setSelectedImageForTool(preselectedImage || null);
        // Do NOT clear activeSlotId here, as we might be inside a slot workspace
    };

    const handleBackToMenu = () => {
        setActiveTool(null);
        setSelectedImageForTool(null);
        setEditingItem(null);
        setError(null);
        // If we have an active slot, we go back to the ToolSelector (Workspace), not main menu
        // so we do NOT clear activeSlotId here
    }

    // Helper to determine the correct Slot ID for a new asset
    const getTargetSlotId = (explicitSlotId?: string | null, parentId?: string): string | undefined => {
        if (explicitSlotId) return explicitSlotId;
        
        // If no explicit slot is set (e.g. user clicked image in gallery strip), try to inherit from parent
        if (parentId) {
            const parent = [...ideationGalleryItems, ...finalGalleryItems].find(i => i.id === parentId);
            return parent?.itemSlotId;
        }
        return undefined;
    };

    const addItemsToIdeationGallery = (sources: ImageSource[], tag: GalleryItem['tag'], prompt: string, parentId?: string) => {
        const targetSlotId = getTargetSlotId(activeSlotId, parentId);
        
        const newItems: GalleryItem[] = sources.map(source => {
            const id = self.crypto.randomUUID();
            return { 
                id, 
                source, 
                src: getDisplaySrc(source), 
                tag, 
                prompt, 
                parentId,
                collectionId: activeCollection?.id,
                itemSlotId: targetSlotId
            };
        });
        setIdeationGalleryItems(prev => [...prev, ...newItems]);
        
        // Update Slot if applicable
        if (targetSlotId) {
            if (tag === 'Sketch') {
                setItemSlots(prev => prev.map(s => s.id === targetSlotId ? { ...s, sketchId: newItems[0].id } : s));
            } else if (tag === 'Studio Image') {
                // If we generated a studio image in Ideation (e.g. from Visualiser), link it
                setItemSlots(prev => prev.map(s => s.id === targetSlotId ? { ...s, studioImageId: newItems[0].id } : s));
            }
        }

        return newItems;
    };

    const addItemsToFinalGallery = (sources: ImageSource[], tag: GalleryItem['tag'], prompt: string, parentId?: string) => {
        const targetSlotId = getTargetSlotId(activeSlotId, parentId);

        const newItems: GalleryItem[] = sources.map(source => {
            const id = self.crypto.randomUUID();
            return { 
                id, 
                source, 
                src: getDisplaySrc(source), 
                tag, 
                prompt, 
                parentId,
                collectionId: activeCollection?.id,
                itemSlotId: targetSlotId
            };
        });
        setFinalGalleryItems(prev => [...prev, ...newItems]);

        // Update Slot if applicable - This was missing for uploads!
        if (targetSlotId) {
            if (tag === 'Studio Image') {
                setItemSlots(prev => prev.map(s => s.id === targetSlotId ? { ...s, studioImageId: newItems[0].id } : s));
            }
        }

        return newItems;
    };
    
    // ... existing handlers (handleGenerateSketches, handleAnalysisComplete, etc.) remain unchanged ...
    
    const handleGenerateSketches = async (prompt: string, imageCount: number) => {
        setIsLoading(true);
        setLoadingMessage('Generating your fashion sketches...');
        setError(null);
        try {
            // Inject Context
            const context = activeCollection ? { styleDna: activeCollection.styleDna } : undefined;
            const imageSources = await generateSketches(prompt, context, imageCount);
            addItemsToIdeationGallery(imageSources, 'Sketch', prompt);
            if (activeSlotId) handleBackToMenu(); // Go back to Item Workspace
        } catch (e: any) {
            setError(e.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalysisComplete = (moodBoardImages: ImageSource[], summary: string, sketches: ImageSource[]) => {
        const moodBoardId = self.crypto.randomUUID();
        const moodBoardAsset: MoodBoardAsset = {
            id: moodBoardId,
            sources: moodBoardImages,
            summary: summary,
            tag: 'Mood Board',
            collectionId: activeCollection?.id,
            itemSlotId: activeSlotId || undefined
        };
        setIdeationGalleryItems(prev => [...prev, moodBoardAsset]);
        addItemsToIdeationGallery(sketches, 'Sketch', "Sketch from mood board", moodBoardId);
        if (activeSlotId) handleBackToMenu();
    };
    
    const handleGenerateSketchTweak = async (baseImage: ImageSource, prompt: string, maskImage?: ImageSource, imageCount?: number) => {
        setIsLoading(true);
        setLoadingMessage('Tweaking your sketch...');
        setError(null);
        try {
            const imageSources = await tweakSketch(baseImage, prompt, maskImage, imageCount);
            addItemsToIdeationGallery(imageSources, 'Sketch', `Tweak: ${prompt}`, editingItem?.id);
            handleBackToMenu();
        } catch (e: any) {
            setError(e.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateStudioImageTweak = async (baseImage: ImageSource, prompt: string, maskImage?: ImageSource, imageCount?: number) => {
        setIsLoading(true);
        setLoadingMessage('Applying your edits...');
        setError(null);
        try {
            const imageSources = await tweakStudioImage(baseImage, prompt, maskImage, imageCount);
            addItemsToIdeationGallery(imageSources, 'Studio Image', `Tweak: ${prompt}`, editingItem?.id);
            handleBackToMenu();
        } catch (e: any) {
            setError(e.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVisualiseProduct = async (baseImage: ImageSource, prompt: string, patternImage?: ImageSource, imageCount?: number) => {
        setIsLoading(true);
        setLoadingMessage('Creating your studio shots...');
        setError(null);
        try {
            let parentId = selectedImageForTool?.id;
    
            const isNewUpload = !selectedImageForTool || selectedImageForTool.source.data !== baseImage.data;
    
            if (isNewUpload) {
                const [newItem] = addItemsToIdeationGallery([baseImage], 'Sketch', 'Uploaded Sketch');
                parentId = newItem.id;
            }
    
            const context = activeCollection ? { styleDna: activeCollection.styleDna, palette: activeCollection.extractedPalette } : undefined;
            const newImageSources = await visualiseProduct(baseImage, prompt, patternImage, context, imageCount);
            const newItems = addItemsToIdeationGallery(newImageSources, 'Studio Image', prompt, parentId);
            
            handleBackToMenu();

        } catch (e: any) {
            setError(e.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePlaceOnModel = async (productImage: ImageSource, prompt: string) => {
        setIsLoading(true);
        setLoadingMessage('Generating model shots...');
        setError(null);
        try {
            const newImageSources = await placeOnModel(productImage, prompt);
            const newItems = addItemsToFinalGallery(newImageSources, 'Model Shot', prompt, selectedImageForTool?.id);
            // Don't auto-select new item, go back to menu to see results in context if slot is active
            if(activeSlotId) handleBackToMenu();
            else setSelectedImageForTool(newItems[0]);
        } catch (e: any) {
            setError(e.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateMultiViews = async (baseImage: ImageSource, views: string[]) => {
        try {
            const results = await generateMultiViews(baseImage, views);
            return results;
        } catch (e: any) {
            setError(e.message || "Failed to generate multi-views.");
            throw e;
        }
    };

    const handleSaveMultiViews = (images: {view: string, image: ImageSource}[], sourceImage: ImageSource) => {
         let parentId = selectedImageForTool?.id;
         const targetSlotId = getTargetSlotId(activeSlotId, parentId);
         
         const isNewSource = !selectedImageForTool || selectedImageForTool.source.data !== sourceImage.data;

         if (isNewSource) {
             const newSourceId = self.crypto.randomUUID();
             const newSourceItem: GalleryItem = {
                 id: newSourceId,
                 source: sourceImage,
                 src: getDisplaySrc(sourceImage),
                 tag: 'Studio Image',
                 prompt: 'Source for Multi-View',
                 collectionId: activeCollection?.id,
                 itemSlotId: targetSlotId
             };
             setFinalGalleryItems(prev => [...prev, newSourceItem]);
             parentId = newSourceId;
         }

         const multiViewAsset: MultiViewAsset = {
             id: self.crypto.randomUUID(),
             tag: 'Multi-View',
             views: images.map(img => ({ view: img.view, source: img.image })),
             parentId: parentId,
             collectionId: activeCollection?.id,
             itemSlotId: targetSlotId
         };

         setFinalGalleryItems(prev => [...prev, multiViewAsset]);
         handleBackToMenu();
    }
    
    const handleGeneratePattern = async (prompt: string, imageCount?: number): Promise<GeneratedPattern[]> => {
        const imageSources = await generatePattern(prompt, imageCount);
        const newPatterns: GeneratedPattern[] = imageSources.map(source => ({
            id: self.crypto.randomUUID(),
            source,
            src: getDisplaySrc(source),
            prompt,
            collectionId: activeCollection?.id
        }));
        setGeneratedPatterns(prev => [...prev, ...newPatterns]);
        return newPatterns;
    }

    const handleEditItem = useCallback((item: GalleryItem) => {
        setEditingItem(item);
        if (item.tag === 'Sketch') setActiveTool('sketchEditor');
        else if (item.tag === 'Studio Image') setActiveTool('studioImageEditor');
    }, []);

    const handleSelectGalleryItem = useCallback((item: GalleryAsset, galleryType: 'ideation' | 'finals') => {
        // IMPORTANT: If item belongs to a slot, set it as active so further actions (visualise, tech pack) are linked
        if (item.itemSlotId) {
            setActiveSlotId(item.itemSlotId);
        }
        // NOTE: We don't unset activeSlotId here if item doesn't have one, to allow users to use assets from other slots while "inside" a workspace

        if (item.tag === 'Mood Board') return;
        if (item.tag === 'Tech Pack') { setViewingTechPack(item as TechPackAsset); return; }
        if (item.tag === 'Product Review') { setViewingReview(item as ProductReviewAsset); return; }
        if (item.tag === 'Multi-View') { setViewingMultiView(item as MultiViewAsset); return; }

        if (item.tag === 'Studio Image' && galleryType === 'ideation' && !activeTool) { handleEditItem(item as GalleryItem); return; }

        setSelectedImageForTool(item as GalleryItem);
        
        if (activeTool) {
            return; // Stay on the current tool, just update the selected image
        }

        // Default Routes
        if (item.tag === 'Sketch') setActiveTool('visualiser');
        else if (item.tag === 'Studio Image') setActiveTool('multiview');
    }, [handleEditItem, activeTool]);

    const performTechPackGeneration = async (item: GalleryItem, additionalImages: ImageSource[] = []) => {
        setIsLoading(true);
        setLoadingMessage("Generating Smart Tech Pack...");
        setError(null);
        try {
            const { sections, sizingData, costingData, placementData, bomData } = await generateTechPack(item.source, additionalImages);
            const targetSlotId = getTargetSlotId(activeSlotId, item.id);

            const newTechPack: TechPackAsset = {
                id: self.crypto.randomUUID(),
                tag: 'Tech Pack',
                source: item.source,
                additionalSources: additionalImages,
                src: item.src,
                data: sections,
                sizingData: sizingData,
                costingData: costingData,
                placementData: placementData,
                bomData: bomData,
                parentId: item.id,
                collectionId: activeCollection?.id,
                itemSlotId: targetSlotId
            };
            setFinalGalleryItems(prev => [...prev, newTechPack]);
            
            // Update Slot if applicable
            if (targetSlotId) {
                 setItemSlots(prev => prev.map(s => s.id === targetSlotId ? { ...s, techPackId: newTechPack.id } : s));
            }
            setViewingTechPack(newTechPack);
        } catch (e: any) {
            setError(e.message || "Failed to generate tech pack.");
        } finally {
            setIsLoading(false);
            setItemPendingTechPack(null);
        }
    };

    const handleGenerateTechPack = useCallback(async (item: GalleryItem) => {
        const multiViewAsset = finalGalleryItems.find(
            i => i.tag === 'Multi-View' && i.parentId === item.id
        ) as MultiViewAsset | undefined;

        if (multiViewAsset) {
            const additionalImages = multiViewAsset.views.map(v => v.source);
            await performTechPackGeneration(item, additionalImages);
        } else {
            setItemPendingTechPack(item);
        }
    }, [finalGalleryItems]);

    const handleTechPackWorkflow = async (file: File) => {
        setIsLoading(true);
        setLoadingMessage("Analyzing uploaded garment...");
        try {
            const source = await fileToBase64(file);
            // Use helper to ensure slot linking
            const newItems = addItemsToFinalGallery([source], 'Studio Image', 'Uploaded for Tech Pack');
            
            handleBackToMenu();
            // Use timeout to allow UI update before modal trigger
            setTimeout(() => setItemPendingTechPack(newItems[0]), 500);
        } catch (e: any) {
            setError(e.message || "Failed to process image.");
        } finally {
            setIsLoading(false);
        }
    }

    const performProductReview = async (item: GalleryItem, techPackData?: TechPackSection[]) => {
        setIsLoading(true);
        setLoadingMessage("Conducting IP and Safety Audit...");
        setError(null);
        try {
            const multiViewAsset = finalGalleryItems.find(i => i.tag === 'Multi-View' && i.parentId === item.id) as MultiViewAsset | undefined;
            const additionalImages = multiViewAsset ? multiViewAsset.views.map(v => v.source) : [];
            const targetSlotId = getTargetSlotId(activeSlotId, item.id);

            const reviewData = await generateProductReview(item.source, additionalImages, techPackData);
            const reviewId = self.crypto.randomUUID();
            const newReviewAsset: ProductReviewAsset = {
                id: reviewId,
                tag: 'Product Review', source: item.source, additionalSources: additionalImages, src: item.src,
                data: reviewData, parentId: item.id, collectionId: activeCollection?.id,
                itemSlotId: targetSlotId
            };

            setFinalGalleryItems(prev => [...prev, newReviewAsset]);
            setViewingReview(newReviewAsset);
        } catch (e: any) {
            setError(e.message || "Failed to conduct product review.");
        } finally {
            setIsLoading(false);
            setItemPendingAudit(null);
        }
    };

    const handleRunComplianceCheck = async (item: GalleryItem) => {
        const techPack = finalGalleryItems.find(i => i.tag === 'Tech Pack' && i.parentId === item.id) as TechPackAsset | undefined;
        if (techPack) performProductReview(item, techPack.data);
        else setItemPendingAudit(item);
    };

    const handleProductReviewWorkflow = async (file: File) => {
        setIsLoading(true);
        setLoadingMessage("Processing upload...");
        try {
            const source = await fileToBase64(file);
            // Use helper to ensure slot linking
            const newItems = addItemsToFinalGallery([source], 'Studio Image', 'Uploaded for Review');
            
            handleBackToMenu();
            setTimeout(() => setItemPendingAudit(newItems[0]), 500);
        } catch (e: any) {
             setError(e.message || "Failed to process image.");
             setIsLoading(false);
        }
    };

    const handleShopperPulseWorkflow = async (file: File) => {
        setIsLoading(true);
        setLoadingMessage("Preparing garment for market analysis...");
        try {
            const source = await fileToBase64(file);
            // Use helper to ensure slot linking
            const newItems = addItemsToFinalGallery([source], 'Studio Image', 'Uploaded for Shopper Pulse');
            
            handleBackToMenu();
            setTimeout(() => setItemPendingShopperPulse(newItems[0]), 500);
        } catch (e: any) {
            setError(e.message || "Failed to process image.");
        } finally {
            setIsLoading(false);
        }
    }


    const handlePromoteItem = useCallback((itemToPromote: GalleryAsset) => {
        const itemExistsInIdeation = ideationGalleryItems.some(i => i.id === itemToPromote.id);
        const itemAlreadyInFinals = finalGalleryItems.some(i => i.id === itemToPromote.id);
        if (itemExistsInIdeation && !itemAlreadyInFinals) {
            setFinalGalleryItems(prev => [...prev, itemToPromote]);
        }
    }, [ideationGalleryItems, finalGalleryItems]);

    const handleDemoteItem = useCallback((itemToDemote: GalleryAsset) => {
        setFinalGalleryItems(prev => prev.filter(i => i.id !== itemToDemote.id));
        if (selectedImageForTool?.id === itemToDemote.id) {
            setSelectedImageForTool(null);
            setActiveTool(null);
        }
    }, [selectedImageForTool]);

    const handleDeleteAsset = useCallback(async (itemToDelete: GalleryAsset) => {
        if (!user) return;
        
        try {
            await deleteAssetFromDb(itemToDelete.id, user.uid);
            
            // Remove from ideation (assuming users can only delete from ideation as per rules)
            setIdeationGalleryItems(prev => prev.filter(i => i.id !== itemToDelete.id));
            
            if (selectedImageForTool?.id === itemToDelete.id) {
                setSelectedImageForTool(null);
                setActiveTool(null);
            }
        } catch (e) {
            console.error("Failed to delete asset:", e);
            setError("Failed to delete asset from database.");
        }
    }, [selectedImageForTool, user]);

    const handleUpdateTechPackContent = (techPackId: string, newData: TechPackSection[], newSizingData?: SizingRow[], newCostingData?: CostingRow[], newPlacementData?: PlacementPin[], newBomData?: BOMRow[]) => {
        const updater = (items: GalleryAsset[]) => items.map(item => item.id === techPackId && item.tag === 'Tech Pack' ? { ...item, data: newData, sizingData: newSizingData, costingData: newCostingData, placementData: newPlacementData, bomData: newBomData } : item);
        setFinalGalleryItems(updater);
        setViewingTechPack(null);
    };

    const renderMainContent = () => {
        if (activeTool) {
             switch (activeTool) {
                case 'moodboard': return <MoodBoardAnalyst onAnalysisComplete={handleAnalysisComplete} onBack={handleBackToMenu} />;
                case 'sketch': return <SketchGenerator onGenerate={handleGenerateSketches} onBack={handleBackToMenu} />;
                case 'visualiser': return <ProductVisualiser onVisualise={handleVisualiseProduct} onBack={handleBackToMenu} inputImage={selectedImageForTool} onGeneratePattern={handleGeneratePattern} />;
                case 'multiview': return <MultiViewGenerator onGenerate={handleGenerateMultiViews} onSaveToGallery={handleSaveMultiViews} onBack={handleBackToMenu} inputImage={selectedImageForTool} />;
                case 'model': return <ModelPlacement onPlace={handlePlaceOnModel} onBack={handleBackToMenu} inputImage={selectedImageForTool} />;
                case 'sketchEditor': return <SketchEditor onGenerateTweak={handleGenerateSketchTweak} onBack={handleBackToMenu} inputImage={editingItem} />;
                case 'studioImageEditor': return <StudioImageEditor onGenerateTweak={handleGenerateStudioImageTweak} onBack={handleBackToMenu} inputImage={editingItem} />;
                case 'techpack': return <TechPackGenerator onGenerate={handleTechPackWorkflow} onProceedWithImage={() => { if(selectedImageForTool) { handleGenerateTechPack(selectedImageForTool); handleBackToMenu(); } }} inputImage={selectedImageForTool} onBack={handleBackToMenu} />;
                case 'review': return <ProductReviewTool onReview={handleProductReviewWorkflow} onProceedWithImage={() => { if(selectedImageForTool) { handleRunComplianceCheck(selectedImageForTool); handleBackToMenu(); } }} inputImage={selectedImageForTool} onBack={handleBackToMenu} />;
                case 'shopperPulse': return <ShopperPulseTool onPulse={handleShopperPulseWorkflow} onProceedWithImage={() => { if(selectedImageForTool) { setItemPendingShopperPulse(selectedImageForTool); handleBackToMenu(); } }} inputImage={selectedImageForTool} onBack={handleBackToMenu} />;
                default: return null;
            }
        }

        // If we are "inside" a specific item slot, show the tool selector to create assets for it
        if (activeSlotId) {
            const activeSlot = itemSlots.find(s => s.id === activeSlotId);
            return <ToolSelector onSelectTool={handleSelectTool} itemName={activeSlot?.name} />;
        }

        if (activeCollection) {
            return (
                <ItemManager 
                    slots={itemSlots.filter(s => s.collectionId === activeCollection.id)}
                    assets={[...ideationGalleryItems, ...finalGalleryItems]}
                    finalAssets={finalGalleryItems}
                    onAddItem={handleAddItemSlot}
                    onSelectItem={handleSelectSlotItem}
                    onOpenTool={handleOpenToolForSlot}
                    onEnterItem={handleEnterItemWorkspace}
                    onDeleteItemSlot={handleDeleteItemSlot}
                    collection={activeCollection}
                />
            );
        }

        return (
            <CollectionSelector 
                collections={collections}
                onSelectCollection={handleSelectCollection}
                onCreateCollection={handleCreateCollection}
                onDeleteCollection={handleDeleteCollection}
            />
        );
    }

    const allGalleryItems = [...ideationGalleryItems, ...finalGalleryItems];
    
    // Filter galleries for the active collection
    const currentIdeation = activeCollection ? ideationGalleryItems.filter(i => i.collectionId === activeCollection.id) : [];
    const currentFinals = activeCollection ? finalGalleryItems.filter(i => i.collectionId === activeCollection.id) : [];
    
    // If active slot is selected, filter further?
    // The user said: "When a user adds/selects another item, we should see the collateral from that item"
    // So if inside a workspace, we should probably only show that item's assets in the strip?
    // Let's filter by slot if activeSlotId is set.
    const visibleIdeation = activeSlotId ? currentIdeation.filter(i => i.itemSlotId === activeSlotId) : currentIdeation;
    const visibleFinals = activeSlotId ? currentFinals.filter(i => i.itemSlotId === activeSlotId) : currentFinals;
    
    const activeSlot = activeSlotId ? itemSlots.find(s => s.id === activeSlotId) : undefined;

    if (!isAuthReady) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
                <div className="bg-slate-900/50 p-8 rounded-2xl border border-white/10 max-w-md w-full text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">A-Line AI</h1>
                    <p className="text-slate-400 mb-8">Sign in to access your workspace and save your designs.</p>
                    <button 
                        onClick={handleLogin}
                        className="w-full py-3 px-4 bg-white text-slate-900 rounded-xl font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col font-sans text-slate-200 selection:bg-indigo-500/30 selection:text-indigo-100">
            {/* Voxel background layer */}
            <div className="fixed inset-0 z-[-1] voxel-pattern pointer-events-none"></div>
            <div className="fixed inset-0 z-[-1] bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950 pointer-events-none"></div>
            
            {isLoading && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50 transition-all duration-300">
                    <Spinner />
                    <p className="mt-6 text-xl text-white font-light tracking-wide animate-pulse">{loadingMessage}</p>
                </div>
            )}
            
            {isGalleryFullscreen && (
                <FullscreenGalleryModal
                    ideationItems={visibleIdeation}
                    finalItems={visibleFinals}
                    onClose={() => setIsGalleryFullscreen(false)}
                    onSelectItem={(item, type) => handleSelectGalleryItem(item, type)}
                    onEditItem={handleEditItem}
                    onShowTraceability={(item) => setTraceabilityStartItem(item)}
                    onGenerateTechPack={handleGenerateTechPack}
                    onPromoteItem={handlePromoteItem}
                    onDemoteItem={handleDemoteItem}
                    onDeleteAsset={handleDeleteAsset}
                    onReview={handleRunComplianceCheck}
                />
            )}
            
            {/* Modals */}
            {isPromptLibraryOpen && <PromptLibraryModal onClose={() => setIsPromptLibraryOpen(false)} />}
            {itemPendingTechPack && <TechPackWarningModal onClose={() => setItemPendingTechPack(null)} onProceedSingleView={() => { if(itemPendingTechPack) performTechPackGeneration(itemPendingTechPack) }} onGenerateMultiView={() => { if(itemPendingTechPack) { setSelectedImageForTool(itemPendingTechPack); setActiveTool('multiview'); setItemPendingTechPack(null); } }} />}
            {itemPendingAudit && <AuditWarningModal onClose={() => setItemPendingAudit(null)} onGenerateTechPack={() => { if(itemPendingAudit) { handleGenerateTechPack(itemPendingAudit); setItemPendingAudit(null); } }} onProceed={() => { if(itemPendingAudit) performProductReview(itemPendingAudit) }} />}
            {itemPendingShopperPulse && <ShopperPulseModal item={itemPendingShopperPulse} onClose={() => setItemPendingShopperPulse(null)} />}
            {traceabilityStartItem && <TraceabilityModal startItem={traceabilityStartItem} allItems={allGalleryItems} onClose={() => setTraceabilityStartItem(null)} onSelectItem={(item) => handleSelectGalleryItem(item, 'ideation')} />}
            {isPatternModalOpen && <PatternGalleryModal patterns={generatedPatterns} onClose={() => setIsPatternModalOpen(false)} />}
            {viewingTechPack && <TechPackModal techPack={viewingTechPack} onClose={() => setViewingTechPack(null)} onSaveChanges={(newData, newSizingData, newCostingData, newPlacementData, newBomData) => handleUpdateTechPackContent(viewingTechPack.id, newData, newSizingData, newCostingData, newPlacementData, newBomData)} />}
            {viewingReview && <ProductReviewModal asset={viewingReview} onClose={() => setViewingReview(null)} />}
            {viewingMultiView && <MultiViewModal asset={viewingMultiView} onClose={() => setViewingMultiView(null)} />}
            
            <Header 
                onShowPatterns={() => setIsPatternModalOpen(true)}
                hasGeneratedPatterns={generatedPatterns.length > 0}
                activeCollection={activeCollection}
                onExitCollection={handleExitCollection}
                activeItemName={activeSlot?.name}
                onExitItem={handleExitItemWorkspace}
                onShowPromptLibrary={() => setIsPromptLibraryOpen(true)}
                onSignOut={handleLogout}
            />
            
            <main className="flex-grow flex flex-col p-6 md:p-8 max-w-screen-2xl mx-auto w-full">
                <div className={`glass-panel rounded-3xl shadow-2xl p-8 md:p-12 flex-grow flex flex-col relative overflow-hidden transition-all duration-500 ${activeTool ? 'bg-slate-900/70' : 'bg-slate-900/40'}`}>
                    {renderMainContent()}
                </div>
                 {error && <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 text-red-200 rounded-xl text-center font-medium backdrop-blur-sm shadow-lg animate-fade-in">{error}</div>}
            </main>
            
            {activeCollection && (
                <DualGallery
                    ideationItems={visibleIdeation}
                    finalItems={visibleFinals}
                    onSelectItem={handleSelectGalleryItem}
                    onEditItem={handleEditItem}
                    onShowTraceability={(item) => setTraceabilityStartItem(item)}
                    onGenerateTechPack={handleGenerateTechPack}
                    onPromoteItem={handlePromoteItem}
                    onDemoteItem={handleDemoteItem}
                    onDeleteAsset={handleDeleteAsset}
                    onReview={handleRunComplianceCheck}
                    onShopperPulse={(item) => setItemPendingShopperPulse(item)}
                    selectedItem={selectedImageForTool}
                    onOpenFullscreen={() => setIsGalleryFullscreen(true)}
                />
            )}
        </div>
    );
};

export default App;