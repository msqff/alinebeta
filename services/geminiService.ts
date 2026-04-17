import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { ImageSource, TechPackSection, ProductReviewResult, ShopperPulseResult, ShopperPersona, SizingRow, CostingRow, PlacementPin, BOMRow } from '../types';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const compressImage = (dataUrl: string, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(dataUrl); // Fallback to original if canvas fails
                return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
};

export const uploadBase64 = async (base64: string, mimeType: string): Promise<string> => {
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    // Compress image before upload to save bandwidth and allow Firestore fallback
    let compressedDataUrl = dataUrl;
    try {
        compressedDataUrl = await compressImage(dataUrl);
    } catch (e) {
        console.warn("Image compression failed, using original", e);
    }

    const filename = `uploads/${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
    const storageRef = ref(storage, filename);
    try {
        await uploadString(storageRef, compressedDataUrl, 'data_url');
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (error: any) {
        console.error("Firebase Storage Error:", error);
        console.warn("Falling back to base64 data URL due to Storage error.");
        // Fallback to returning the compressed data URL directly so it gets saved in Firestore
        return compressedDataUrl;
    }
};

export const fileToBase64 = async (file: File): Promise<ImageSource> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const result = reader.result as string;
      const data = result.split(',')[1];
      try {
          const url = await uploadBase64(data, file.type);
          resolve({ url }); // Only store URL to prevent Firestore document bloat
      } catch (e) {
          reject(e);
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

const getAI = () => {
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy-key" });
};

const getUrlAsBase64 = async (url: string): Promise<{ data: string, mimeType: string }> => {
    if (url.startsWith('data:')) {
        const matches = url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
            return { mimeType: matches[1], data: matches[2] };
        }
    }
    
    // Use proxy to bypass CORS
    const response = await fetch('/api/proxy-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch image via proxy');
    }
    
    const result = await response.json();
    return { data: result.data, mimeType: result.mimeType };
};

const getImageData = async (image: ImageSource): Promise<{ data: string, mimeType: string }> => {
    if (image.data && image.mimeType) {
        return { data: image.data, mimeType: image.mimeType };
    }
    if (image.url) {
        return await getUrlAsBase64(image.url);
    }
    throw new Error("Image source missing URL and data");
};

const extractImageOrThrow = (response: GenerateContentResponse, context: string = "API"): { data: string, mimeType: string } => {
    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find(part => part.inlineData);
    
    if (imagePart && imagePart.inlineData) {
        return {
            data: imagePart.inlineData.data,
            mimeType: imagePart.inlineData.mimeType || 'image/png'
        };
    }

    const textPart = candidate?.content?.parts?.find(part => part.text);
    if (textPart && textPart.text) {
        const reason = textPart.text.trim();
        throw new Error(`${context} returned text instead of image: "${reason.length > 100 ? reason.substring(0, 100) + '...' : reason}"`);
    }

    throw new Error(`${context} did not return an image or text explanation.`);
};

export const analyzeCollectionIntake = async (image: ImageSource): Promise<{ styleDna: string, palette: string[] }> => {
    const localImage = await getImageData(image);
    const ai = getAI();
    const prompt = `Analyze this mood board image to extract the "Style DNA" and "Color Palette" for a new fashion collection.
    
    1. Style DNA: A concise paragraph (approx 50 words) describing the core aesthetic, shapes, textures, and target vibe.
    2. Palette: Extract 5 distinctive Hex color codes from the image that represent the collection.

    Return JSON format:
    {
        "styleDna": "string",
        "palette": ["#hex", "#hex", "#hex", "#hex", "#hex"]
    }`;

    const parts = [
        { inlineData: { data: localImage.data, mimeType: localImage.mimeType } },
        { text: prompt },
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: { parts },
        config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || '{}');
};

export const generateCollectionIntakeFromText = async (brief: string, audience: string): Promise<{ styleDna: string, palette: string[] }> => {
    const ai = getAI();
    const prompt = `Act as a Fashion Creative Director. I am starting a new collection. Target audience: ${audience}. Design brief: ${brief}. Generate a cohesive 'Style DNA' (a concise 50-word paragraph describing the aesthetic, silhouettes, and textures) and extract a 5-color hex code 'Palette' that perfectly represents this brief. Return strict JSON format: { "styleDna": "string", "palette": ["#hex", "#hex", "#hex", "#hex", "#hex"] }.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 0 }
        }
    });

    const text = response.text;
    if (!text) throw new Error("API did not return content.");
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse JSON from model response.");
    
    return JSON.parse(jsonMatch[0]);
};

export const generateMoodBoardImage = async (styleDna: string, palette: string[], audience: string): Promise<ImageSource> => {
    const ai = getAI();
    const prompt = `A high-end fashion mood board collage for a ${audience} collection. Aesthetic: ${styleDna}. Color palette: ${palette.join(', ')}. Include editorial photography, fabric swatches, and abstract textures. Photorealistic, professional fashion design presentation.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{ text: prompt }]
        },
        config: {
            imageConfig: {
                aspectRatio: "16:9",
                imageSize: "1K"
            }
        }
    });

    let base64Image = "";
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
        if (part.inlineData) {
            base64Image = part.inlineData.data;
            break;
        }
    }

    if (!base64Image) {
        throw new Error("Failed to generate image from Gemini API.");
    }

    const url = await uploadBase64(base64Image, 'image/jpeg');
    return { url };
};

export const generateItemSuggestions = async (
    collectionName: string,
    styleDna: string,
    existingItems: string[] = []
): Promise<{ name: string; reasoning: string }[]> => {
    const ai = getAI();
    const prompt = `Act as a Senior Fashion Merchandiser planning a collection named "${collectionName}".
    
    Style DNA: "${styleDna}"
    ${existingItems && existingItems.length > 0 ? `Current Line Sheet contains: ${existingItems.join(', ')}.` : 'This is a new collection.'}
    
    Task: Suggest 3 specific fashion items to add to this collection.
    
    Rules:
    1. Suggestions must be specific descriptive names (e.g. "Oversized Cable Knit Cardigan" instead of just "Cardigan").
    2. Suggestions must complement the Style DNA and any existing items to ensure a cohesive range (mix of tops, bottoms, outerwear etc).
    3. If existing items are provided, do NOT duplicate them. Suggest items that fill gaps (e.g. if there are tops, suggest bottoms or outerwear).
    
    Return JSON array:
    [
        { "name": "Item Name", "reasoning": "Brief reason why this fits" }
    ]`;

    const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: { parts: [{ text: prompt }] },
        config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || '[]');
};

export const analyzeMoodBoard = async (images: ImageSource[], userPrompt?: string): Promise<{ summary: string; sketches: ImageSource[] }> => {
    const localImages = await Promise.all(images.map(img => getImageData(img)));
    const ai = getAI();
    
    const summaryPrompt = "Analyze the attached images which form a fashion mood board. Provide a summary of the core themes, a suggested color palette (using common color names), key silhouettes, and potential fabrics. Format this as a concise but detailed report with clear headings for each section (e.g., ## Core Themes, ## Color Palette). The tone should be professional and insightful for a fashion designer.";
    
    const summaryParts = [
        ...localImages.map((img: any) => ({ inlineData: { data: img.data, mimeType: img.mimeType } })),
        { text: summaryPrompt },
    ];

    const summaryResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: { parts: summaryParts },
    });
    const summary = summaryResponse.text || '';

    const baseSketchPrompt = "Inspired by the aesthetic of the attached mood board images, generate a minimalist black and white fashion flat sketch of a cohesive";
    const promptAddition = userPrompt ? ` ${userPrompt}` : ' garment';
    const sketchPrompt = `${baseSketchPrompt}${promptAddition}. Clean line drawing, unfilled outline only, on a stark pure white background. No shadows, no gradients, no shading. Professional, clean, hand-drawn quality. The aspect ratio of the image should be 3:4.`;
    
    const sketchParts = [
        ...localImages.map((img: any) => ({ inlineData: { data: img.data, mimeType: img.mimeType } })),
        { text: sketchPrompt },
    ];

    const generateSingleSketch = async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: sketchParts },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        const imgData = extractImageOrThrow(response, "Sketch Generator");
        const url = await uploadBase64(imgData.data, imgData.mimeType);
        return { url };
    };

    const sketchPromises = Array(4).fill(null).map(() => generateSingleSketch());
    const sketches = await Promise.all(sketchPromises);

    return { summary, sketches };
};

export const generateSketches = async (prompt: string, context?: { styleDna: string }, imageCount: number = 4): Promise<ImageSource[]> => {
    const ai = getAI();
    
    let fullPrompt = `A minimalist black and white fashion flat sketch of ${prompt}. Clean line drawing, unfilled outline only, on a stark pure white background. No shadows, no gradients, no shading. Professional, clean, hand-drawn quality. The aspect ratio of the image should be 3:4.`;
    
    if (context) {
        fullPrompt += `\n\nDESIGN CONTEXT - The design must strictly adhere to the following Style DNA: ${context.styleDna}. Incorporate these aesthetic cues into the silhouette and details.`;
    }

    const parts = [{ text: fullPrompt }];

    const generateSingleImage = async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        const imgData = extractImageOrThrow(response, "Sketch Generator");
        const url = await uploadBase64(imgData.data, imgData.mimeType);
        return { url };
    };

    const imagePromises = Array(imageCount).fill(null).map(() => generateSingleImage());
    return Promise.all(imagePromises);
};

export const generatePattern = async (prompt: string, imageCount: number = 4): Promise<ImageSource[]> => {
    const ai = getAI();
    const fullPrompt = `A seamless, tileable, photorealistic pattern of ${prompt}. The image should be a square (1:1 aspect ratio).`;
    
    const parts = [{ text: fullPrompt }];

    const generateSingleImage = async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        const imgData = extractImageOrThrow(response, "Pattern Generator");
        const url = await uploadBase64(imgData.data, imgData.mimeType);
        return { url };
    };

    const imagePromises = Array(imageCount).fill(null).map(() => generateSingleImage());
    return Promise.all(imagePromises);
};

export const tweakSketch = async (baseImage: ImageSource, prompt: string, maskImage?: ImageSource, imageCount: number = 4): Promise<ImageSource[]> => {
    const ai = getAI();
    const localBase = await getImageData(baseImage);
    let textPrompt: string;
    const parts: any[] = [{ inlineData: { data: localBase.data, mimeType: localBase.mimeType } }];

    if (maskImage) {
        const localMask = await getImageData(maskImage);
        textPrompt = `Based on the provided fashion flat sketch and the mask, apply this change ONLY to the masked area: "${prompt}". The output must remain a minimalist black and white flat sketch. Maintain the style of the original: clean line drawing, unfilled outline only, on a stark pure white background. No shadows, no gradients, no shading.`;
        parts.push({ inlineData: { data: localMask.data, mimeType: localMask.mimeType } });
    } else {
        textPrompt = `Based on the provided fashion flat sketch, generate a new version with the following modification: "${prompt}". The output must strictly be a minimalist black and white fashion flat sketch. Maintain the style of the original: clean line drawing, unfilled outline only, on a stark pure white background. No shadows, no gradients, no shading.`;
    }
    
    parts.push({ text: textPrompt });

    const generateSingleImage = async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        const imgData = extractImageOrThrow(response, "Sketch Editor");
        const url = await uploadBase64(imgData.data, imgData.mimeType);
        return { url };
    };

    const imagePromises = Array(imageCount).fill(null).map(() => generateSingleImage());
    return Promise.all(imagePromises);
};

export const tweakStudioImage = async (baseImage: ImageSource, prompt: string, maskImage?: ImageSource, imageCount: number = 4): Promise<ImageSource[]> => {
    const ai = getAI();
    const localBase = await getImageData(baseImage);
    let textPrompt: string;
    const parts: any[] = [{ inlineData: { data: localBase.data, mimeType: localBase.mimeType } }];

    if (maskImage) {
        const localMask = await getImageData(maskImage);
        textPrompt = `Based on the provided product image and the mask, apply this change ONLY to the masked area: "${prompt}". The output must remain a photorealistic studio product shot. Maintain the style of the original: professional lighting, neutral background, and realistic textures.`;
        parts.push({ inlineData: { data: localMask.data, mimeType: localMask.mimeType } });
    } else {
        textPrompt = `Based on the provided photorealistic product image, generate a new version with the following modification: "${prompt}". Ensure the output is a hyper-realistic photograph of a real physical garment, avoiding any digital mock-up look. Focus on realistic fabric texture and lighting. Please provide a distinct visual variation.`;
    }
    
    parts.push({ text: textPrompt });

    const generateSingleImage = async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        const imgData = extractImageOrThrow(response, "Image Editor");
        const url = await uploadBase64(imgData.data, imgData.mimeType);
        return { url };
    };

    const imagePromises = Array(imageCount).fill(null).map(() => generateSingleImage());
    return Promise.all(imagePromises);
};

export const visualiseProduct = async (baseImage: ImageSource, prompt: string, patternImage?: ImageSource, context?: { styleDna: string, palette: string[] }, imageCount: number = 4): Promise<ImageSource[]> => {
    const ai = getAI();
    const localBase = await getImageData(baseImage);
    
    let textPrompt = `Transform the provided sketch into a hyper-realistic, true-to-life photograph of a real physical garment. The result must be indistinguishable from a high-end studio photo of a manufactured product. Strictly avoid any illustrative, painterly, or digital-art styles. Focus on tangible fabric textures (weave, sheen, weight), realistic draping, and precise construction details (seams, hems). Display on a neutral background. Specific design details: "${prompt}".`;

    if (context) {
        textPrompt += `\n\nDESIGN CONTEXT - The materials, textures, and general finish MUST align with this Style DNA: ${context.styleDna}.`;
        textPrompt += `\n\nCOLOR PALETTE - Prioritize these colors where appropriate/unspecified: ${context.palette.join(', ')}.`;
    }

    const parts: any[] = [
        { inlineData: { data: localBase.data, mimeType: localBase.mimeType } },
        { text: textPrompt },
    ];

    if (patternImage) {
        const localPattern = await getImageData(patternImage);
        parts.splice(1, 0, { inlineData: { data: localPattern.data, mimeType: localPattern.mimeType } });
    }
    
    const generateSingleImage = async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        const imgData = extractImageOrThrow(response, "Product Visualiser");
        const url = await uploadBase64(imgData.data, imgData.mimeType);
        return { url };
    }

    const imagePromises = Array(imageCount).fill(null).map(() => generateSingleImage());
    return Promise.all(imagePromises);
};

export const placeOnModel = async (productImage: ImageSource, prompt: string): Promise<ImageSource[]> => {
    const ai = getAI();
    const localProduct = await getImageData(productImage);
    const textPrompt = `Realistically place the garment from the provided image onto a photorealistic model. The model's pose and camera angle should be: "${prompt}". The background should be a simple studio or neutral setting. The final image should be a full-body shot. Ensure the garment's draping, folds, and fit look natural for the specified pose and the lighting on the model and garment is consistent. Please provide a distinct visual variation.`;
    
    const parts = [
        { inlineData: { data: localProduct.data, mimeType: localProduct.mimeType } },
        { text: textPrompt },
    ];
    
    const generateSingleImage = async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        const imgData = extractImageOrThrow(response, "Model Placement");
        const url = await uploadBase64(imgData.data, imgData.mimeType);
        return { url };
    };

    const imagePromises = Array(4).fill(null).map(() => generateSingleImage());
    return Promise.all(imagePromises);
};

export const generateMultiViews = async (baseImage: ImageSource, viewsToGenerate: string[]): Promise<{ view: string, image: ImageSource }[]> => {
    const ai = getAI();
    const localBase = await getImageData(baseImage);
    
    const generateView = async (viewType: string) => {
        let prompt = "";
        switch (viewType) {
            case 'Back':
                prompt = "Generate a photorealistic BACK view of the garment shown in the reference image. Maintain exact consistency in fabric texture, color, and seam placement. The lighting should be consistent with the reference. Do not add new features not implied by the front view. Neutral background.";
                break;
            case 'Side (Left)':
                prompt = "Generate a photorealistic LEFT SIDE profile view of the garment shown in the reference image. Show the side seam and drape clearly. Maintain exact consistency in fabric texture and color. Neutral background.";
                break;
            case 'Side (Right)':
                prompt = "Generate a photorealistic RIGHT SIDE profile view of the garment shown in the reference image. Show the side seam and drape clearly. Maintain exact consistency in fabric texture and color. Neutral background.";
                break;
            case 'Detail Zoom':
                prompt = "Generate an extreme close-up MACRO shot of the fabric texture and details of the garment shown in the reference image. Focus on the weave, stitching, or buttons. Maintain exact color accuracy. Neutral background.";
                break;
        }

        const parts = [
            { inlineData: { data: localBase.data, mimeType: localBase.mimeType } },
            { text: prompt },
        ];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });

        const imgData = extractImageOrThrow(response, `Multi-View (${viewType})`);
        const url = await uploadBase64(imgData.data, imgData.mimeType);
        return {
            view: viewType,
            image: { url }
        };
    };

    const promises = viewsToGenerate.map((view: string) => generateView(view));
    return Promise.all(promises);
};

export const generateTechPack = async (image: ImageSource, additionalImages: ImageSource[] = []): Promise<{ sections: TechPackSection[], bomData: BOMRow[], sizingData: SizingRow[], costingData: CostingRow[], placementData: PlacementPin[] }> => {
    const ai = getAI();
    const localImage = await getImageData(image);
    
    const prompt = `Analyze the provided garment image${additionalImages && additionalImages.length > 0 ? 's (including front and additional views)' : ''} and generate a structured Technical Pack JSON object.
    
    The JSON must strictly follow this structure:
    {
        "sections": [
            {
                "title": "Section Title (e.g., Garment Features, Materials)",
                "items": [
                    {
                        "label": "Item Label (e.g., Neckline, Main Fabric)",
                        "value": "Item Value (e.g., V-neck, 100% Cotton)",
                        "options": ["Alternative 1", "Alternative 2"]
                    }
                ]
            }
        ],
        "sizingData": [
            {
                "pointOfMeasure": "Point of Measure (e.g., Chest Width, Body Length)",
                "xs": "Measurement in cm",
                "s": "Measurement in cm",
                "m": "Measurement in cm",
                "l": "Measurement in cm",
                "xl": "Measurement in cm",
                "xxl": "Measurement in cm"
            }
        ],
        "bomData": [
            {
                "placement": "Placement (e.g., Main Body, Collar)",
                "component": "Component (e.g., Fabric, Button)",
                "description": "Detailed description",
                "color": "Color specification",
                "supplier": "Suggested supplier or generic",
                "consumption": "Estimated consumption"
            }
        ],
        "costingData": [
            {
                "materialName": "Material Name (e.g., Main Fabric, Zipper)",
                "consumption": 1.5,
                "unit": "meters",
                "costPerUnit": 5.50
            }
        ],
        "placementData": [
            {
                "pinNumber": 1,
                "x": 50.5,
                "y": 20.0,
                "title": "Rib Knit Collar",
                "note": "Twin needle coverstitch"
            }
        ]
    }

    Required Sections:
    1. Garment Features (Detail fits, cuts, and finishings${additionalImages && additionalImages.length > 0 ? ' as seen from all angles' : ''})
    2. Suggested Materials
    3. Construction Notes (Seams, stitching, hem type)

    CRITICAL INSTRUCTION FOR 'bomData':
    - Generate a comprehensive Bill of Materials (BOM) for the garment.
    - Include all fabrics, trims, labels, threads, and hardware.
    - Provide realistic descriptions, placements, and estimated consumption.

    CRITICAL INSTRUCTION FOR 'options':
    - You MUST provide 1-3 plausible alternatives or variations for nearly every field to give the designer choices.
    - The 'value' should be your best guess based on the image.
    - The 'options' should be valid variations a designer might consider (e.g., if 'value' is 'Boxy Fit', 'options' could be ['Regular Fit', 'Oversized Fit']; if 'value' is '100% Cotton', 'options' could be ['95% Cotton 5% Elastane', 'Organic Cotton']).
    - Only leave 'options' empty if the feature is 100% unambiguous and unchangeable.

    CRITICAL INSTRUCTION FOR 'sizingData':
    - Generate a standard sizing and grading table for this garment. 'sizingData' must be an array of objects.
    - Each object needs a 'pointOfMeasure' (e.g., 'Chest Width', 'Body Length') and estimated measurements in cm for 'xs', 's', 'm' (base size), 'l', 'xl', and 'xxl'.
    - Use standard industry grading rules (e.g., +/- 2cm or 4cm between sizes).

    CRITICAL INSTRUCTION FOR 'costingData':
    - For every material and trim identified in the garment, generate a 'costingData' row.
    - You must estimate the realistic 'consumption' (yield) required to make one garment (e.g., 2.5 for a dress, 1.2 for a shirt) and provide the 'unit' ('meters' for fabric, 'units' for zippers/buttons).
    - Finally, estimate a realistic wholesale 'costPerUnit' in GBP (£) for that specific material based on industry averages.
    - Ensure consumption and costPerUnit are numbers.

    CRITICAL INSTRUCTION FOR 'placementData':
    - Analyze the visual construction of the garment. Identify 4 to 6 key construction points (e.g., collar, cuffs, hem, zippers, unique seams).
    - For each point, create a 'placementData' object.
    - Provide a 'title' and a detailed manufacturing 'note' (e.g., 'Twin needle coverstitch').
    - Crucially, you must estimate the precise location of this feature on the primary image using 'x' and 'y' coordinates as percentages from 0 to 100 (where x:0, y:0 is top-left).
    - To ensure accuracy, imagine a tight bounding box around the garment itself, and place the pin exactly on the structural element you are describing. Do not place pins in the empty background.
    - Give each a sequential 'pinNumber'.

    Output ONLY valid JSON. No markdown formatting.`;

    const parts: any[] = [
        { inlineData: { data: localImage.data, mimeType: localImage.mimeType } },
    ];

    if (additionalImages) {
        for (const img of additionalImages) {
            const localAdd = await getImageData(img);
            parts.push({ inlineData: { data: localAdd.data, mimeType: localAdd.mimeType } });
        }
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: { parts },
        config: {
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 0 }
        }
    });

    const text = response.text;
    if (!text) {
        throw new Error("API did not return tech pack content.");
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("Failed to parse JSON from model response.");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Assign IDs to all generated items
    if (parsed.sections) {
        parsed.sections.forEach((section: any) => {
            section.id = self.crypto.randomUUID();
            if (section.items) {
                section.items.forEach((item: any) => {
                    item.id = self.crypto.randomUUID();
                });
            }
        });
    }
    if (parsed.bomData) {
        parsed.bomData.forEach((row: any) => row.id = self.crypto.randomUUID());
    }
    if (parsed.sizingData) {
        parsed.sizingData.forEach((row: any) => row.id = self.crypto.randomUUID());
    }
    if (parsed.costingData) {
        parsed.costingData.forEach((row: any) => row.id = self.crypto.randomUUID());
    }
    if (parsed.placementData) {
        parsed.placementData.forEach((row: any) => row.id = self.crypto.randomUUID());
    }

    return parsed;
};

export const generateProductReview = async (image: ImageSource, additionalImages: ImageSource[] = [], techPack?: TechPackSection[]): Promise<ProductReviewResult> => {
    const ai = getAI();
    const localImage = await getImageData(image);
    
    const prompt = `Act as a strictly critical Risk Compliance Officer (IP & Safety) and a Senior Production Manager. Conduct a harsh, uncompromising audit of the attached fashion design${additionalImages && additionalImages.length > 0 ? ' (examining all provided angles/views)' : ''}.

    1. Legal Audit: Scrutinize for ANY resemblance to known trademarks, logos, iconic trade dress (e.g., Adidas stripes, Burberry check, Gucci horsebit, Nike swoosh), or copyright protected artwork/characters. Be extremely conservative; if it looks even slightly familiar or derivative, FLAG IT as a risk.
    2. Safety Audit: Rigorously identify potential physical hazards.
       - Strangulation: Drawstrings/cords near neck/hood (strictly prohibited in many regions for childrenswear).
       - Choking: Buttons, loose embellishments, beads, or sequins (especially on childrenswear).
       - Entrapment: Zippers, loops, or toggles.
       - Flammability: Assess fabric drape/texture for potential high flammability risks (e.g., sheer synthetics, high pile).
    3. Fabrication Audit: Identify potential manufacturing challenges. Look for impossible seams, unrealistic drapes, or details that would be difficult or expensive to produce in mass manufacturing. Highlight areas where the image fidelity might be misleading (e.g., "Texture implies heavy wool but drape suggests silk", "Seam lines disappear into nowhere").

    ${techPack ? `\n\nUse the following Technical Specifications to inform your safety audit, particularly regarding material composition and construction:\n${JSON.stringify(techPack, null, 2)}` : ''}

    \n\nReturn a strict JSON object with this structure:
    {
        "compliance_score": number (0-100, where 100 is perfectly safe/legal/feasible. Be harsh with deductions for risks),
        "status": "PASS" or "FLAGGED",
        "legal_audit": {
            "risk_level": "Low" | "Medium" | "High",
            "flags": ["string", "string"] (list of specific issues found, empty if none)
        },
        "safety_audit": {
            "risk_level": "Low" | "Medium" | "High",
            "flags": ["string", "string"] (list of specific issues found, empty if none)
        },
        "fabrication_audit": {
            "risk_level": "Low" | "Medium" | "High",
            "flags": ["string", "string"] (list of specific issues found, empty if none)
        }
    }
    Output ONLY valid JSON.`;

    const parts: any[] = [
        { inlineData: { data: localImage.data, mimeType: localImage.mimeType } },
    ];
    
    if (additionalImages) {
        for (const img of additionalImages) {
            const localAdd = await getImageData(img);
            parts.push({ inlineData: { data: localAdd.data, mimeType: localAdd.mimeType } });
        }
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: { parts },
        config: { responseMimeType: 'application/json' }
    });

    const text = response.text;
    if (!text) throw new Error("No review generated");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse JSON");

    return JSON.parse(jsonMatch[0]);
};

export const generateShopperPulse = async (image: ImageSource, price: number, persona: ShopperPersona): Promise<ShopperPulseResult> => {
    const ai = getAI();
    const localImage = await getImageData(image);
    
    const personaDetails: Record<string, string> = {
        'The Value Seeker': 'A budget-conscious shopper looking for the best deal. Skeptical of high prices unless quality is obvious. Loves a bargain.',
        'The Quality Conscious': 'Prioritizes material composition, longevity, and finish. Willing to pay more but hates "fast fashion" poor construction. Critical.',
        'The Trend Hunter': 'Obsessed with what is currently "in". Will pay for the "look" but will reject it if it looks dated or like a cheap knock-off.'
    };

    const prompt = `You are a British High Street Shopper. Your persona is: "${persona}".
    Description: ${personaDetails[persona]}.
    
    I am showing you a garment I found. The retail price is £${price}.
    
    Task: Evaluate the visual quality (fabric drape, complexity, silhouette, finish) against this price. Is it good Value for Money?
    
    Critical Constraints:
    1. Tone: Use British English terminology/slang (e.g., trousers, jumper, trainers, quid, fiver, autumn).
    2. Logic: Be SKEPTICAL. If the price is high but it looks synthetic or basic, reject it. If it's cheap but looks expensive, be enthusiastic. Focus on practicality (washability, warmth).
    3. Output: Return a strict JSON object.
    
    {
        "purchase_probability": number (0-100),
        "headline": "string (Max 5 words, punchy verdict)",
        "customer_voice": "string (One single sentence explanation in your persona's voice)"
    }`;

    const parts = [
        { inlineData: { data: localImage.data, mimeType: localImage.mimeType } },
        { text: prompt },
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: { parts },
        config: { responseMimeType: 'application/json' }
    });

    const text = response.text;
    if (!text) throw new Error("No shopper pulse generated");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse JSON");

    return JSON.parse(jsonMatch[0]);
}
