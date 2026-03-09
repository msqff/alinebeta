import React, { useState, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { CollectionSelector } from './components/CollectionSelector';
import { ItemManager } from './components/ItemManager';
import { ToolSelector } from './components/ToolSelector';
import { SketchGenerator } from './components/SketchGenerator';
import { ProductVisualiser } from './components/ProductVisualizer';
import { ModelPlacement } from './components/ModelPlacement';
import { SketchEditor } from './components/SketchEditor';
import { StudioImageEditor } from './components/StudioImageEditor';
import { VideoGenerator } from './components/VideoGenerator';
import { MoodBoardAnalyst } from './components/MoodBoardAnalyst';
import { TechPackGenerator } from './components/TechPackGenerator';
import { ProductReviewTool } from './components/ProductReviewTool';
import { ShopperPulseTool } from './components/ShopperPulseTool';
import { MultiViewGenerator } from './components/MultiViewGenerator';
import { DualGallery } from './components/DualGallery';
import { Spinner } from './components/common/Spinner';
import { TraceabilityModal } from './components/TraceabilityModal';
import { PatternGalleryModal } from './components/PatternGalleryModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { TechPackModal } from './components/TechPackModal';
import { ProductReviewModal } from './components/ProductReviewModal';
import { MultiViewModal } from './components/MultiViewModal';
import { TechPackWarningModal } from './components/TechPackWarningModal';
import { AuditWarningModal } from './components/AuditWarningModal';
import { ShopperPulseModal } from './components/ShopperPulseModal';
import { FullscreenGalleryModal } from './components/FullscreenGalleryModal';
import { SaveSessionModal } from './components/SaveSessionModal';
import { PromptLibraryModal } from './components/PromptLibraryModal';
import { generateSketches, visualiseProduct, placeOnModel, tweakSketch, generatePattern, generateVideo, checkVideoOperation, generateTechPack, tweakStudioImage, generateProductReview, generateMultiViews, blobToBase64, fileToBase64 } from './services/geminiService';
import { saveSession, loadSession, SessionData } from './services/fileService';
import { Tool, GalleryItem, ImageSource, GeneratedPattern, GalleryAsset, VideoItem, MoodBoardAsset, TechPackAsset, TechPackSection, ProductReviewResult, ProductReviewAsset, MultiViewAsset, Collection, ItemSlot } from './types';

const App: React.FC = () => {
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
    const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null);
    const [isGalleryFullscreen, setIsGalleryFullscreen] = useState(false);
    const [isSaveSessionModalOpen, setIsSaveSessionModalOpen] = useState(false);
    const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
    
    const [viewingTechPack, setViewingTechPack] = useState<TechPackAsset | null>(null);
    const [viewingReview, setViewingReview] = useState<ProductReviewAsset | null>(null);
    const [viewingMultiView, setViewingMultiView] = useState<MultiViewAsset | null>(null);
    
    const [itemPendingTechPack, setItemPendingTechPack] = useState<GalleryItem | null>(null);
    const [itemPendingAudit, setItemPendingAudit] = useState<GalleryItem | null>(null);
    const [itemPendingShopperPulse, setItemPendingShopperPulse] = useState<GalleryItem | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

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
        setSelectedImageForTool(null);
        setError(null);
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
                src: `data:${source.mimeType};base64,${source.data}`, 
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
                src: `data:${source.mimeType};base64,${source.data}`, 
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
    
    const handleGenerateSketches = async (prompt: string) => {
        setIsLoading(true);
        setLoadingMessage('Generating your fashion sketches...');
        setError(null);
        try {
            // Inject Context
            const context = activeCollection ? { styleDna: activeCollection.styleDna } : undefined;
            const imageSources = await generateSketches(prompt, context);
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
    
    const handleGenerateSketchTweak = async (baseImage: ImageSource, prompt: string, maskImage?: ImageSource) => {
        setIsLoading(true);
        setLoadingMessage('Tweaking your sketch...');
        setError(null);
        try {
            const imageSources = await tweakSketch(baseImage, prompt, maskImage);
            addItemsToIdeationGallery(imageSources, 'Sketch', `Tweak: ${prompt}`, editingItem?.id);
            handleBackToMenu();
        } catch (e: any) {
            setError(e.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateStudioImageTweak = async (baseImage: ImageSource, prompt: string, maskImage?: ImageSource) => {
        setIsLoading(true);
        setLoadingMessage('Applying your edits...');
        setError(null);
        try {
            const imageSources = await tweakStudioImage(baseImage, prompt, maskImage);
            addItemsToIdeationGallery(imageSources, 'Studio Image', `Tweak: ${prompt}`, editingItem?.id);
            handleBackToMenu();
        } catch (e: any) {
            setError(e.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVisualiseProduct = async (baseImage: ImageSource, prompt: string, patternImage?: ImageSource) => {
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
            const newImageSources = await visualiseProduct(baseImage, prompt, patternImage, context);
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
                 src: `data:${sourceImage.mimeType};base64,${sourceImage.data}`,
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
    
    const handleGenerateVideo = async (sourceItem: GalleryItem, videoPrompt: string) => {
        const POLLING_INTERVAL = 10000;
        const VIDEO_MESSAGES = ["Sending your concept to the video studio...", "Rendering the frames...", "Applying final lighting...", "Polishing the final cut..."];
        setIsLoading(true);
        let messageIndex = 0;
        setLoadingMessage(VIDEO_MESSAGES[messageIndex]);
        const messageInterval = setInterval(() => { messageIndex = (messageIndex + 1) % VIDEO_MESSAGES.length; setLoadingMessage(VIDEO_MESSAGES[messageIndex]); }, 8000);
        setError(null);
        try {
            if (!sourceItem.parentId) throw new Error("Cannot generate video: missing lineage.");
            
            const allItems = [...ideationGalleryItems, ...finalGalleryItems];
            const parentItem = allItems.find(item => item.id === sourceItem.parentId);
            
            if (!parentItem || parentItem.tag !== 'Studio Image') throw new Error("Video generation failed: missing parent Studio Image.");
            
            const fullPrompt = `Create a high-quality, photorealistic promotional video. Animation: "${videoPrompt}".`;
            let operation = await generateVideo(parentItem.source, fullPrompt);

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
                operation = await checkVideoOperation(operation);
            }
            clearInterval(messageInterval);
            if (operation.error) throw new Error(`Video generation failed`);

            if (operation.response?.generatedVideos?.[0]?.video?.uri) {
                setLoadingMessage("Downloading your video...");
                const downloadLink = operation.response.generatedVideos[0].video.uri;
                const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                const videoBlob = await videoResponse.blob();
                const videoData = await blobToBase64(videoBlob);
                
                const targetSlotId = getTargetSlotId(activeSlotId, sourceItem.id);

                const newItem: VideoItem = {
                    id: self.crypto.randomUUID(),
                    videoSource: { data: videoData, mimeType: videoBlob.type },
                    thumbnailSrc: sourceItem.src,
                    tag: 'Video',
                    prompt: videoPrompt,
                    parentId: parentItem.id,
                    collectionId: activeCollection?.id,
                    itemSlotId: targetSlotId
                };
                setFinalGalleryItems(prev => [...prev, newItem]);
                handleBackToMenu();
            } else {
                throw new Error("Video generation failed or returned no data.");
            }
        } catch (e: any) {
            clearInterval(messageInterval);
            setError(e.message || "Video error.");
        } finally {
            setIsLoading(false);
        }
    };


    const handleGeneratePattern = async (prompt: string): Promise<GeneratedPattern[]> => {
        const imageSources = await generatePattern(prompt);
        const newPatterns: GeneratedPattern[] = imageSources.map(source => ({
            id: self.crypto.randomUUID(),
            source,
            src: `data:${source.mimeType};base64,${source.data}`,
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

        if (item.tag === 'Video') { setPlayingVideo(item as VideoItem); return; }
        if (item.tag === 'Mood Board') return;
        if (item.tag === 'Tech Pack') { setViewingTechPack(item as TechPackAsset); return; }
        if (item.tag === 'Product Review') { setViewingReview(item as ProductReviewAsset); return; }
        if (item.tag === 'Multi-View') { setViewingMultiView(item as MultiViewAsset); return; }

        if (item.tag === 'Studio Image' && galleryType === 'ideation') { handleEditItem(item as GalleryItem); return; }

        setSelectedImageForTool(item as GalleryItem);
        // Default Routes
        if (item.tag === 'Sketch') setActiveTool('visualiser');
        else if (item.tag === 'Studio Image') setActiveTool('multiview');
        else if (item.tag === 'Model Shot') setActiveTool('video');
    }, [handleEditItem]);

    const performTechPackGeneration = async (item: GalleryItem, additionalImages: ImageSource[] = []) => {
        setIsLoading(true);
        setLoadingMessage("Generating Smart Tech Pack...");
        setError(null);
        try {
            const data = await generateTechPack(item.source, additionalImages);
            const targetSlotId = getTargetSlotId(activeSlotId, item.id);

            const newTechPack: TechPackAsset = {
                id: self.crypto.randomUUID(),
                tag: 'Tech Pack',
                source: item.source,
                additionalSources: additionalImages,
                src: item.src,
                data: data,
                parentId: item.id,
                collectionId: activeCollection?.id,
                itemSlotId: targetSlotId
            };
            setFinalGalleryItems(prev => [...prev, newTechPack]);
            
            // Update Slot if applicable
            if (targetSlotId) {
                 setItemSlots(prev => prev.map(s => s.id === targetSlotId ? { ...s, techPackId: newTechPack.id } : s));
                 handleBackToMenu();
            } else {
                 setViewingTechPack(newTechPack);
            }
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

    const handleUpdateTechPackContent = (techPackId: string, newData: TechPackSection[]) => {
        const updater = (items: GalleryAsset[]) => items.map(item => item.id === techPackId && item.tag === 'Tech Pack' ? { ...item, data: newData } : item);
        setFinalGalleryItems(updater);
        setViewingTechPack(null);
    };

    const executeSaveSession = (sessionName: string) => {
        saveSession({ 
            ideationGalleryItems, 
            finalGalleryItems, 
            generatedPatterns,
            collections,
            itemSlots
        }, sessionName);
        setIsSaveSessionModalOpen(false);
    };

    const handleLoadSessionClick = () => {
        if (ideationGalleryItems.length > 0 || finalGalleryItems.length > 0) {
            if (!window.confirm("Loading a new session will replace your current work. Are you sure?")) return;
        }
        fileInputRef.current?.click();
    };

    const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsLoading(true);
        try {
            const sessionData = await loadSession(file);
            setIdeationGalleryItems(sessionData.ideationGalleryItems);
            setFinalGalleryItems(sessionData.finalGalleryItems);
            setGeneratedPatterns(sessionData.generatedPatterns);
            setCollections(sessionData.collections);
            setItemSlots(sessionData.itemSlots);
            
            // If only one collection, auto-select it for convenience
            if (sessionData.collections.length === 1) {
                setActiveCollection(sessionData.collections[0]);
            } else {
                handleExitCollection();
            }
            
            setError(null);
        } catch (e: any) {
            setError(e.message || "Failed to load session file.");
        } finally {
            if (event.target) event.target.value = '';
            setIsLoading(false);
        }
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
                case 'video': return <VideoGenerator onGenerate={handleGenerateVideo} onBack={handleBackToMenu} inputImage={selectedImageForTool} />;
                case 'techpack': return <TechPackGenerator onGenerate={handleTechPackWorkflow} onBack={handleBackToMenu} />;
                case 'review': return <ProductReviewTool onReview={handleProductReviewWorkflow} onBack={handleBackToMenu} />;
                case 'shopperPulse': return <ShopperPulseTool onPulse={handleShopperPulseWorkflow} onBack={handleBackToMenu} />;
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
                    onAddItem={handleAddItemSlot}
                    onSelectItem={handleSelectSlotItem}
                    onOpenTool={handleOpenToolForSlot}
                    onEnterItem={handleEnterItemWorkspace}
                    collection={activeCollection}
                />
            );
        }

        return (
            <CollectionSelector 
                collections={collections}
                onSelectCollection={handleSelectCollection}
                onCreateCollection={handleCreateCollection}
            />
        );
    }

    const allGalleryItems = [...ideationGalleryItems, ...finalGalleryItems];
    const hasSessionData = allGalleryItems.length > 0 || generatedPatterns.length > 0;
    
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
            <input type="file" ref={fileInputRef} onChange={handleFileSelected} className="hidden" accept="application/json,.json" />
            
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
                    onSaveSession={() => setIsSaveSessionModalOpen(true)}
                    onReview={handleRunComplianceCheck}
                />
            )}
            
            {/* Modals */}
            {isSaveSessionModalOpen && <SaveSessionModal onClose={() => setIsSaveSessionModalOpen(false)} onSave={executeSaveSession} />}
            {isPromptLibraryOpen && <PromptLibraryModal onClose={() => setIsPromptLibraryOpen(false)} />}
            {itemPendingTechPack && <TechPackWarningModal onClose={() => setItemPendingTechPack(null)} onProceedSingleView={() => { if(itemPendingTechPack) performTechPackGeneration(itemPendingTechPack) }} onGenerateMultiView={() => { if(itemPendingTechPack) { setSelectedImageForTool(itemPendingTechPack); setActiveTool('multiview'); setItemPendingTechPack(null); } }} />}
            {itemPendingAudit && <AuditWarningModal onClose={() => setItemPendingAudit(null)} onGenerateTechPack={() => { if(itemPendingAudit) { handleGenerateTechPack(itemPendingAudit); setItemPendingAudit(null); } }} onProceed={() => { if(itemPendingAudit) performProductReview(itemPendingAudit) }} />}
            {itemPendingShopperPulse && <ShopperPulseModal item={itemPendingShopperPulse} onClose={() => setItemPendingShopperPulse(null)} />}
            {traceabilityStartItem && <TraceabilityModal startItem={traceabilityStartItem} allItems={allGalleryItems} onClose={() => setTraceabilityStartItem(null)} onSelectItem={(item) => handleSelectGalleryItem(item, 'ideation')} />}
            {isPatternModalOpen && <PatternGalleryModal patterns={generatedPatterns} onClose={() => setIsPatternModalOpen(false)} />}
            {playingVideo && <VideoPlayerModal video={playingVideo} onClose={() => setPlayingVideo(null)} />}
            {viewingTechPack && <TechPackModal techPack={viewingTechPack} onClose={() => setViewingTechPack(null)} onSaveChanges={(newData) => handleUpdateTechPackContent(viewingTechPack.id, newData)} />}
            {viewingReview && <ProductReviewModal asset={viewingReview} onClose={() => setViewingReview(null)} />}
            {viewingMultiView && <MultiViewModal asset={viewingMultiView} onClose={() => setViewingMultiView(null)} />}
            
            <Header 
                onShowPatterns={() => setIsPatternModalOpen(true)}
                hasGeneratedPatterns={generatedPatterns.length > 0}
                onSaveSession={() => setIsSaveSessionModalOpen(true)}
                onLoadSession={handleLoadSessionClick}
                hasSessionData={hasSessionData}
                activeCollection={activeCollection}
                onExitCollection={handleExitCollection}
                activeItemName={activeSlot?.name}
                onExitItem={handleExitItemWorkspace}
                onShowPromptLibrary={() => setIsPromptLibraryOpen(true)}
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