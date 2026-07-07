const fs = require('fs');

let content = fs.readFileSync('services/geminiService.ts', 'utf8');

// Replace analyzeMoodBoard sketches generation
const analyzeMoodBoardRegex = /const generateSingleSketch = async \(\) => \{[\s\S]*?const sketches = await Promise\.all\(sketchPromises\);/g;

content = content.replace(analyzeMoodBoardRegex, `
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: { parts: sketchParts },
        config: {
            imageConfig: { aspectRatio: "3:4", numberOfImages: 4 }
        },
    });
    const imagesData = extractImagesOrThrow(response, "Sketch Generator");
    const sketches: ImageSource[] = [];
    for (const imgData of imagesData) {
        const url = await uploadBase64(imgData.data, imgData.mimeType);
        sketches.push({ url });
    }
`);

// Replace generateSketches
const generateSketchesRegex = /const generateSingleImage = async \(\) => \{[\s\S]*?return images;\s*\n\};/g;

content = content.replace(generateSketchesRegex, `
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: { parts: parts },
        config: {
            imageConfig: { aspectRatio: "3:4", numberOfImages: imageCount }
        },
    });
    const imagesData = extractImagesOrThrow(response, "Sketch Generator");
    const images: ImageSource[] = [];
    for (const imgData of imagesData) {
        const url = await uploadBase64(imgData.data, imgData.mimeType);
        images.push({ url });
    }
    return images;
};
`);

fs.writeFileSync('services/geminiService.ts', content);
