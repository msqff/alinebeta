import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";
import { ImageSource, TechPackSection, ProductReviewResult, ShopperPulseResult, ShopperPersona } from '../types';

const getAI = () => {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const extractImageOrThrow = (response: GenerateContentResponse, context: string = "API"): ImageSource => {
    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts.find(part => part.inlineData);
    
    if (imagePart && imagePart.inlineData) {
        return {
            data: imagePart.inlineData.data,
            mimeType: imagePart.inlineData.mimeType || 'image/png'
        };
    }

    // If no image, check for text to provide a better error
    const textPart = candidate?.content?.parts.find(part => part.text);
    if (textPart && textPart.text) {
        // Clean up the text a bit for the error message
        const reason = textPart.text.trim();
        throw new Error(`${context} returned text instead of image: "${reason.length > 100 ? reason.substring(0, 100) + '...' : reason}"`);
    }

    throw new Error(`${context} did not return an image or text explanation.`);
};

export const fileToBase64 = (file: File): Promise<ImageSource> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const data = result.split(',')[1];
      resolve({ data, mimeType: file.type });
    };
    reader.onerror = (error) => reject(error);
  });
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => {
      const result = reader.result as string;
      const data = result.split(',')[1];
      resolve(data);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const analyzeCollectionIntake = async (image: ImageSource): Promise<{ styleDna: string, palette: string[] }> => {
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
        { inlineData: { data: image.data, mimeType: image.mimeType } },
        { text: prompt },
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: { parts },
        config: { responseMimeType: 'application/json' }
    });

    const text = response.text;
    if (!text) throw new Error("Failed to analyze collection.");
    
    try {
        const json = JSON.parse(text);
        return {
            styleDna: json.styleDna,
            palette: json.palette
        };
    } catch (e) {
        throw new Error("Invalid JSON from collection analysis.");
    }
};

export const generateItemSuggestions = async (
    collectionName: string,
    styleDna: string,
    existingItems: string[] = []
): Promise<{ name: string; reasoning: string }[]> => {
    const ai = getAI();
    const prompt = `Act as a Senior Fashion Merchandiser planning a collection named "${collectionName}".
    
    Style DNA: "${styleDna}"
    ${existingItems.length > 0 ? `Current Line Sheet contains: ${existingItems.join(', ')}.` : 'This is a new collection.'}
    
    Task: Suggest 3 specific fashion items to add to this collection.
    
    Rules:
    1. Suggestions must be specific descriptive names (e.g. "Oversized Cable Knit Cardigan" instead of just "Cardigan").
    2. Suggestions must complement the Style DNA and any existing items to ensure a cohesive range (mix of tops, bottoms, outerwear etc).
    3. If existing items are provided, do NOT duplicate them. Suggest items that fill gaps (e.g. if there are tops, suggest bottoms or outerwear).
    
    Return JSON array:
    [
        { "name": "Item Name", "reasoning": "Brief reason why this fits" },
        ...
    ]`;

    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: { parts: [{ text: prompt }] },
        config: { responseMimeType: 'application/json' }
    });

    const text = response.text;
    if (!text) return [];

    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse item suggestions", e);
        return [];
    }
};

export const analyzeMoodBoard = async (images: ImageSource[], userPrompt?: string): Promise<{ summary: string; sketches: ImageSource[] }> => {
    const ai = getAI();
    // 1. Generate Summary
    const summaryPrompt = "Analyze the attached images which form a fashion mood board. Provide a summary of the core themes, a suggested color palette (using common color names), key silhouettes, and potential fabrics. Format this as a concise but detailed report with clear headings for each section (e.g., ## Core Themes, ## Color Palette). The tone should be professional and insightful for a fashion designer.";
    
    const summaryParts = [
        ...images.map(img => ({ inlineData: { data: img.data, mimeType: img.mimeType } })),
        { text: summaryPrompt },
    ];

    const summaryResponse = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: { parts: summaryParts },
    });
    const summary = summaryResponse.text;
    if (!summary) {
        throw new Error("API did not return a summary.");
    }

    // 2. Generate Sketches
    const baseSketchPrompt = "Inspired by the aesthetic of the attached mood board images, generate a minimalist black and white fashion flat sketch of a cohesive";
    const promptAddition = userPrompt ? ` ${userPrompt}` : ' garment';
    const sketchPrompt = `${baseSketchPrompt}${promptAddition}. Clean line drawing, unfilled outline only, on a stark pure white background. No shadows, no gradients, no shading. Professional, clean, hand-drawn quality. The aspect ratio of the image should be 3:4.`;
    
    const sketchParts = [
        ...images.map(img => ({ inlineData: { data: img.data, mimeType: img.mimeType } })),
        { text: sketchPrompt },
    ];

    const generateSingleSketch = async (): Promise<ImageSource> => {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: sketchParts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        return extractImageOrThrow(response, "Sketch Generator");
    };

    const sketchPromises = Array(4).fill(null).map(() => generateSingleSketch());
    const sketches = await Promise.all(sketchPromises);

    return { summary, sketches };
};

export const generateSketches = async (prompt: string, context?: { styleDna: string }): Promise<ImageSource[]> => {
    const ai = getAI();
    
    let fullPrompt = `A minimalist black and white fashion flat sketch of ${prompt}. Clean line drawing, unfilled outline only, on a stark pure white background. No shadows, no gradients, no shading. Professional, clean, hand-drawn quality. The aspect ratio of the image should be 3:4.`;
    
    if (context) {
        fullPrompt += `\n\nDESIGN CONTEXT - The design must strictly adhere to the following Style DNA: ${context.styleDna}. Incorporate these aesthetic cues into the silhouette and details.`;
    }

    const parts = [{ text: fullPrompt }];

    const generateSingleImage = async (): Promise<ImageSource> => {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        return extractImageOrThrow(response, "Sketch Generator");
    };

    const imagePromises = Array(4).fill(null).map(() => generateSingleImage());
    return Promise.all(imagePromises);
};

export const generatePattern = async (prompt: string): Promise<ImageSource[]> => {
    const ai = getAI();
    const fullPrompt = `A seamless, tileable, photorealistic pattern of ${prompt}. The image should be a square (1:1 aspect ratio).`;
    
    const parts = [{ text: fullPrompt }];

    const generateSingleImage = async (): Promise<ImageSource> => {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        return extractImageOrThrow(response, "Pattern Generator");
    };

    const imagePromises = Array(4).fill(null).map(() => generateSingleImage());
    return Promise.all(imagePromises);
};

export const tweakSketch = async (baseImage: ImageSource, prompt: string, maskImage?: ImageSource): Promise<ImageSource[]> => {
    const ai = getAI();
    let textPrompt: string;
    const parts: any[] = [{ inlineData: { data: baseImage.data, mimeType: baseImage.mimeType } }];

    if (maskImage) {
        textPrompt = `Based on the provided fashion flat sketch and the mask, apply this change ONLY to the masked area: "${prompt}". The output must remain a minimalist black and white flat sketch. Maintain the style of the original: clean line drawing, unfilled outline only, on a stark pure white background. No shadows, no gradients, no shading.`;
        parts.push({ inlineData: { data: maskImage.data, mimeType: maskImage.mimeType } });
    } else {
        textPrompt = `Based on the provided fashion flat sketch, generate a new version with the following modification: "${prompt}". The output must strictly be a minimalist black and white fashion flat sketch. Maintain the style of the original: clean line drawing, unfilled outline only, on a stark pure white background. No shadows, no gradients, no shading.`;
    }
    
    parts.push({ text: textPrompt });

    const generateSingleImage = async (): Promise<ImageSource> => {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        return extractImageOrThrow(response, "Sketch Editor");
    };

    const imagePromises = Array(4).fill(null).map(() => generateSingleImage());
    return Promise.all(imagePromises);
}

export const tweakStudioImage = async (baseImage: ImageSource, prompt: string, maskImage?: ImageSource): Promise<ImageSource[]> => {
    const ai = getAI();
    let textPrompt: string;
    const parts: any[] = [{ inlineData: { data: baseImage.data, mimeType: baseImage.mimeType } }];

    if (maskImage) {
        textPrompt = `Based on the provided product image and the mask, apply this change ONLY to the masked area: "${prompt}". The output must remain a photorealistic studio product shot. Maintain the style of the original: professional lighting, neutral background, and realistic textures.`;
        parts.push({ inlineData: { data: maskImage.data, mimeType: maskImage.mimeType } });
    } else {
        textPrompt = `Based on the provided photorealistic product image, generate a new version with the following modification: "${prompt}". Ensure the output is a hyper-realistic photograph of a real physical garment, avoiding any digital mock-up look. Focus on realistic fabric texture and lighting. Please provide a distinct visual variation.`;
    }
    
    parts.push({ text: textPrompt });

    const generateSingleImage = async (): Promise<ImageSource> => {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        return extractImageOrThrow(response, "Image Editor");
    };

    const imagePromises = Array(4).fill(null).map(() => generateSingleImage());
    return Promise.all(imagePromises);
}

export const visualiseProduct = async (baseImage: ImageSource, prompt: string, patternImage?: ImageSource, context?: { styleDna: string, palette: string[] }): Promise<ImageSource[]> => {
    const ai = getAI();
    let textPrompt = `Transform the provided sketch into a hyper-realistic, true-to-life photograph of a real physical garment. The result must be indistinguishable from a high-end studio photo of a manufactured product. Strictly avoid any illustrative, painterly, or digital-art styles. Focus on tangible fabric textures (weave, sheen, weight), realistic draping, and precise construction details (seams, hems). Display on a neutral background. Specific design details: "${prompt}".`;

    if (context) {
        textPrompt += `\n\nDESIGN CONTEXT - The materials, textures, and general finish MUST align with this Style DNA: ${context.styleDna}.`;
        textPrompt += `\n\nCOLOR PALETTE - Prioritize these colors where appropriate/unspecified: ${context.palette.join(', ')}.`;
    }

    const parts: any[] = [
        { inlineData: { data: baseImage.data, mimeType: baseImage.mimeType } },
        { text: textPrompt },
    ];

    if (patternImage) {
        parts.splice(1, 0, { inlineData: { data: patternImage.data, mimeType: patternImage.mimeType } });
    }
    
    const generateSingleImage = async (): Promise<ImageSource> => {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        return extractImageOrThrow(response, "Product Visualiser");
    }

    const imagePromises = Array(4).fill(null).map(() => generateSingleImage());
    return Promise.all(imagePromises);
};

export const placeOnModel = async (productImage: ImageSource, prompt: string): Promise<ImageSource[]> => {
    const ai = getAI();
    const textPrompt = `Realistically place the garment from the provided image onto a photorealistic model. The model's pose and camera angle should be: "${prompt}". The background should be a simple studio or neutral setting. The final image should be a full-body shot. Ensure the garment's draping, folds, and fit look natural for the specified pose and the lighting on the model and garment is consistent. Please provide a distinct visual variation.`;
    
    const parts = [
        { inlineData: { data: productImage.data, mimeType: productImage.mimeType } },
        { text: textPrompt },
    ];
    
    const generateSingleImage = async (): Promise<ImageSource> => {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        return extractImageOrThrow(response, "Model Placement");
    };

    const imagePromises = Array(4).fill(null).map(() => generateSingleImage());
    return Promise.all(imagePromises);
};

export const generateMultiViews = async (baseImage: ImageSource, viewsToGenerate: string[]): Promise<{ view: string, image: ImageSource }[]> => {
    const ai = getAI();
    
    const generateView = async (viewType: string): Promise<{ view: string, image: ImageSource }> => {
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
            { inlineData: { data: baseImage.data, mimeType: baseImage.mimeType } },
            { text: prompt },
        ];

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const image = extractImageOrThrow(response, `Multi-View (${viewType})`);
        
        return {
            view: viewType,
            image: image
        };
    };

    const promises = viewsToGenerate.map(view => generateView(view));
    const results = await Promise.all(promises);
    return results;
};

export const generateVideo = async (baseImage: ImageSource, prompt: string) => {
    const ai = getAI();
    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: baseImage.data,
        mimeType: baseImage.mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });
    return operation;
}

export const checkVideoOperation = async (operation: any) => {
    const ai = getAI();
    const updatedOperation = await ai.operations.getVideosOperation({ operation: operation });
    return updatedOperation;
}

export const generateTechPack = async (image: ImageSource, additionalImages: ImageSource[] = []): Promise<TechPackSection[]> => {
    const ai = getAI();
    
    // Use gemini-flash-lite-latest for maximum speed on structured data extraction
    const prompt = `Analyze the provided garment image${additionalImages.length > 0 ? 's (including front and additional views)' : ''} and generate a structured Technical Pack JSON object.
    
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
        ]
    }

    Required Sections:
    1. Garment Features (Detail fits, cuts, and finishings${additionalImages.length > 0 ? ' as seen from all angles' : ''})
    2. Suggested Materials
    3. Construction Notes (Seams, stitching, hem type)
    4. Bill of Materials (BOM)

    CRITICAL INSTRUCTION FOR 'options':
    - You MUST provide 1-3 plausible alternatives or variations for nearly every field to give the designer choices.
    - The 'value' should be your best guess based on the image.
    - The 'options' should be valid variations a designer might consider (e.g., if 'value' is 'Boxy Fit', 'options' could be ['Regular Fit', 'Oversized Fit']; if 'value' is '100% Cotton', 'options' could be ['95% Cotton 5% Elastane', 'Organic Cotton']).
    - Only leave 'options' empty if the feature is 100% unambiguous and unchangeable.

    Output ONLY valid JSON. No markdown formatting.`;

    const parts: any[] = [
        { inlineData: { data: image.data, mimeType: image.mimeType } },
    ];

    additionalImages.forEach(img => {
        parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
    });

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: { parts },
        config: {
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 0 } // Disable thinking to minimize latency
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

    try {
        const parsed = JSON.parse(jsonMatch[0]);
        const sectionsWithIds: TechPackSection[] = parsed.sections.map((section: any) => ({
            id: self.crypto.randomUUID(),
            title: section.title,
            items: section.items.map((item: any) => ({
                id: self.crypto.randomUUID(),
                label: item.label,
                value: item.value,
                options: item.options || []
            }))
        }));
        return sectionsWithIds;
    } catch (e) {
        console.error("Failed to parse Tech Pack JSON", e);
        throw new Error("Failed to generate structured Tech Pack.");
    }
};

export const generateProductReview = async (image: ImageSource, additionalImages: ImageSource[] = [], techPack?: TechPackSection[]): Promise<ProductReviewResult> => {
    const ai = getAI();
    const prompt = `Act as a strictly critical Risk Compliance Officer (IP & Safety) and a Senior Production Manager. Conduct a harsh, uncompromising audit of the attached fashion design${additionalImages.length > 0 ? ' (examining all provided angles/views)' : ''}.

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
        { inlineData: { data: image.data, mimeType: image.mimeType } },
    ];
    
    additionalImages.forEach(img => {
         parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
    });

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: { parts },
        config: {
            responseMimeType: 'application/json'
        }
    });

    const text = response.text;
    if (!text) throw new Error("No review generated");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse JSON");

    try {
        return JSON.parse(jsonMatch[0]) as ProductReviewResult;
    } catch (e) {
        throw new Error("Invalid JSON structure returned");
    }
};

export const generateShopperPulse = async (image: ImageSource, price: number, persona: ShopperPersona): Promise<ShopperPulseResult> => {
    const ai = getAI();
    
    const personaDetails = {
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
        { inlineData: { data: image.data, mimeType: image.mimeType } },
        { text: prompt },
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: { parts },
        config: {
            responseMimeType: 'application/json'
        }
    });

    const text = response.text;
    if (!text) throw new Error("No shopper pulse generated");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse JSON");

    try {
        return JSON.parse(jsonMatch[0]) as ShopperPulseResult;
    } catch (e) {
        throw new Error("Invalid JSON structure returned");
    }
}