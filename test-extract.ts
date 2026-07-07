import { GenerateContentResponse } from "@google/genai";

export const extractImagesOrThrow = (response: any, context: string = "API"): { data: string, mimeType: string }[] => {
    const images: { data: string, mimeType: string }[] = [];
    
    if (!response.candidates || response.candidates.length === 0) {
        throw new Error(`${context} did not return any candidates.`);
    }

    for (const candidate of response.candidates) {
        // Handle images that might be in multiple parts, or just take the first inlineData per candidate
        const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);
        if (imagePart && imagePart.inlineData) {
            images.push({
                data: imagePart.inlineData.data,
                mimeType: imagePart.inlineData.mimeType || 'image/png'
            });
        }
    }

    if (images.length === 0) {
        const textPart = response.candidates[0]?.content?.parts?.find((part: any) => part.text);
        if (textPart && textPart.text) {
            const reason = textPart.text.trim();
            throw new Error(`${context} returned text instead of image: "${reason.length > 100 ? reason.substring(0, 100) + '...' : reason}"`);
        }
        throw new Error(`${context} did not return any images or text explanation.`);
    }

    return images;
};
