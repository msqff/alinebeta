const fs = require('fs');
let content = fs.readFileSync('services/geminiService.ts', 'utf8');

const missingCode = `
export const generateCollectionIntakeFromText = async (textBrief: string, audience: string): Promise<{ styleDna: string, palette: string[] }> => {
    const ai = getAI();
    const prompt = \`Based on this brief: "\${textBrief}" and target audience: "\${audience}", generate a Style DNA description and a color palette (array of 3-5 color hex codes). Return ONLY a JSON object with keys "styleDna" and "palette".\`;
    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: { parts: [{ text: prompt }] },
    });
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("API did not return content.");
    return JSON.parse(extractJSON(text));
};

export const generateMoodBoardImage = async (styleDna: string, palette: string[], audience: string): Promise<ImageSource> => {
    const ai = getAI();
    const prompt = \`A high-end fashion mood board collage for a \${audience} collection. Aesthetic: \${styleDna}. Color palette: \${palette.join(', ')}. Include editorial photography, fabric swatches, and abstract textures. Photorealistic, professional fashion design presentation.\`;
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
    });
    const imgData = extractImageOrThrow(response, "Mood Board");
    const url = await uploadBase64(imgData.data, imgData.mimeType);
    return { url };
};

export const generateItemSuggestions = async (collectionName: string, styleDna: string, existingNames: string[]): Promise<{ name: string, description: string }[]> => {
    const ai = getAI();
    const prompt = \`For a fashion collection named "\${collectionName}" with this Style DNA: "\${styleDna}", suggest 3 new garment items to design. They should not overlap with these existing items: \${existingNames.join(', ')}. Return ONLY a JSON array of objects, each with "name" (short) and "description".\`;
    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: { parts: [{ text: prompt }] },
    });
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("API did not return content.");
    return JSON.parse(extractJSON(text));
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
        model: 'gemini-3.5-flash',
        contents: { parts: summaryParts },
    });
    const summary = summaryResponse.text || summaryResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const baseSketchPrompt = "Inspired by the aesthetic of the attached mood board images, generate a minimalist black and white fashion flat sketch of a cohesive";
    const promptAddition = userPrompt ? \` \${userPrompt}\` : ' garment';
    const sketchPrompt = \`\${baseSketchPrompt}\${promptAddition}. Clean line drawing, unfilled outline only, on a stark pure white background. No shadows, no gradients, no shading. Professional, clean, hand-drawn quality. The aspect ratio of the image should be 3:4.\`;
    const sketchParts = [
        ...localImages.map((img: any) => ({ inlineData: { data: img.data, mimeType: img.mimeType } })),
        { text: sketchPrompt },
    ];

    const generateSingleSketch = async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: { parts: sketchParts },
            config: { imageConfig: { aspectRatio: "3:4" } },
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
    let fullPrompt = \`A minimalist black and white fashion flat sketch of \${prompt}. Clean line drawing, unfilled outline only, on a stark pure white background. No shadows, no gradients, no shading. Professional, clean, hand-drawn quality. The aspect ratio of the image should be 3:4.\`;
    if (context) {
        fullPrompt += \`\\n\\nDESIGN CONTEXT - The design must strictly adhere to the following Style DNA: \${context.styleDna}. Incorporate these aesthetic cues into the silhouette and details.\`;
    }
    const parts = [{ text: fullPrompt }];

    const generateSingleImage = async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: { parts: parts },
            config: { imageConfig: { aspectRatio: "3:4" } },
        });
        const imgData = extractImageOrThrow(response, "Sketch Generator");
        const url = await uploadBase64(imgData.data, imgData.mimeType);
        return { url };
    };
    const imagePromises = Array(imageCount).fill(null).map(() => generateSingleImage());
    return await Promise.all(imagePromises);
};

export const tweakSketch = async (baseImage: ImageSource, prompt: string, maskImage?: ImageSource, imageCount: number = 4, context?: { styleDna: string, palette: string[] }): Promise<ImageSource[]> => {
    const ai = getAI();
    const localBase = await getImageData(baseImage);
    let textPrompt;
    const parts: any[] = [{ inlineData: { data: localBase.data, mimeType: localBase.mimeType } }];
    if (maskImage) {
        const localMask = await getImageData(maskImage);
        textPrompt = \`Based on the provided fashion flat sketch and the mask, apply this change ONLY to the masked area: "\${prompt}". The output must remain a minimalist black and white flat sketch. Maintain the style of the original: clean line drawing, unfilled outline only, on a stark pure white background. No shadows, no gradients, no shading.\`;
        parts.push({ inlineData: { data: localMask.data, mimeType: localMask.mimeType } });
    } else {
        textPrompt = \`Based on the provided fashion flat sketch, generate a new version with the following modification: "\${prompt}". The output must strictly be a minimalist black and white fashion flat sketch. Maintain the style of the original: clean line drawing, unfilled outline only, on a stark pure white background. No shadows, no gradients, no shading.\`;
    }
    if (context) {
        textPrompt += \`\\n\\nDESIGN CONTEXT - The design must subtly adhere to the following Style DNA: \${context.styleDna}. Incorporate these aesthetic cues into the silhouette and details. Ensure any coloring strictly respects the brand color palette (Hex codes: \${context.palette.join(', ')}). If a general color is requested (like "red"), match it to the closest color in this palette.\`;
    }
    parts.push({ text: textPrompt });

    const generateSingleImage = async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: { parts: parts },
            config: { imageConfig: { aspectRatio: "3:4" } },
        });
        const imgData = extractImageOrThrow(response, "Sketch Generator");
        const url = await uploadBase64(imgData.data, imgData.mimeType);
        return { url };
    };
    const imagePromises = Array(imageCount).fill(null).map(() => generateSingleImage());
    return await Promise.all(imagePromises);
};
`;

content = content.replace('export const generatePattern', missingCode + '\nexport const generatePattern');
fs.writeFileSync('services/geminiService.ts', content);
