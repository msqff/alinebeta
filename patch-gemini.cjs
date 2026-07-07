const fs = require('fs');

let content = fs.readFileSync('services/geminiService.ts', 'utf8');

const extractImagesOrThrowFn = `
const extractImagesOrThrow = (response: any, context: string = "API"): { data: string, mimeType: string }[] => {
    const images: { data: string, mimeType: string }[] = [];
    if (!response.candidates || response.candidates.length === 0) {
        throw new Error(\`\${context} did not return any candidates.\`);
    }
    for (const candidate of response.candidates) {
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
            throw new Error(\`\${context} returned text instead of image: "\${reason.length > 100 ? reason.substring(0, 100) + '...' : reason}"\`);
        }
        throw new Error(\`\${context} did not return any images or text explanation.\`);
    }
    return images;
};
`;

content = content.replace('export const analyzeCollectionIntake', extractImagesOrThrowFn + '\nexport const analyzeCollectionIntake');

fs.writeFileSync('services/geminiService.ts', content);
