import { GoogleGenAI } from "@google/genai";

const extractImagesOrThrow = (response: any, context: string = "API"): { data: string, mimeType: string }[] => {
    const images: { data: string, mimeType: string }[] = [];
    if (!response.candidates || response.candidates.length === 0) {
        throw new Error(`${context} did not return any candidates.`);
    }
    for (const candidate of response.candidates) {
        if (candidate.finishReason === 'SAFETY') {
            throw new Error(`${context} was blocked by safety filters.`);
        }
        const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);
        if (imagePart && imagePart.inlineData) {
            images.push({
                data: imagePart.inlineData.data,
                mimeType: imagePart.inlineData.mimeType || 'image/png'
            });
        }
    }
    if (images.length === 0) {
        throw new Error(`${context} did not return any images.`);
    }
    return images;
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "missing" });

async function run() {
    let fullPrompt = `A minimalist black and white fashion flat sketch of a dress. Clean line drawing, unfilled outline only, on a stark pure white background. No shadows, no gradients, no shading. Professional, clean, hand-drawn quality. The aspect ratio of the image should be 3:4.`;
    const parts = [{ text: fullPrompt }];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: { parts: parts },
            config: {
                imageConfig: { aspectRatio: "3:4", numberOfImages: 4 }
            },
        });
        const imagesData = extractImagesOrThrow(response, "Sketch Generator");
        console.log("Success! Images:", imagesData.length);
    } catch(e) {
        console.error("Error:", e.message);
    }
}
run();
