const fs = require('fs');
let content = fs.readFileSync('services/geminiService.ts', 'utf8');

const regex = /export const generatePattern = async.*?imageConfig: \{ aspectRatio: "3:4", numberOfImages: imageCount \}.*?return images;\n\s*\}/s;

const newFn = `export const generatePattern = async (prompt: string, imageCount: number = 4): Promise<ImageSource[]> => {
    const ai = getAI();
    const fullPrompt = \`A seamless, tileable, photorealistic pattern of \${prompt}. The image should be a square (1:1 aspect ratio).\`;
    
    const parts = [{ text: fullPrompt }];

    const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: { parts: parts },
        config: {
            imageConfig: { aspectRatio: "1:1", numberOfImages: imageCount }
        },
    });
    const imagesData = extractImagesOrThrow(response, "Pattern Generator");
    const images: ImageSource[] = [];
    for (const imgData of imagesData) {
        const url = await uploadBase64(imgData.data, imgData.mimeType);
        images.push({ url });
    }
    return images;
}`;

content = content.replace(regex, newFn);
fs.writeFileSync('services/geminiService.ts', content);
