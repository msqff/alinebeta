const fs = require('fs');
let content = fs.readFileSync('services/geminiService.ts', 'utf8');

// Patch generateSketches
const generateSketchesRegex = /const response = await ai\.models\.generateContent\(\{[\s\S]*?model: 'gemini-3\.1-flash-lite-image',[\s\S]*?contents: \{ parts: parts \},[\s\S]*?config: \{[\s\S]*?imageConfig: \{ aspectRatio: "3:4", numberOfImages: imageCount \}[\s\S]*?\},[\s\S]*?\}\);[\s\S]*?const imagesData = extractImagesOrThrow\(response, "Sketch Generator"\);[\s\S]*?const images: ImageSource\[\] = \[\];[\s\S]*?for \(const imgData of imagesData\) \{[\s\S]*?const url = await uploadBase64\(imgData\.data, imgData\.mimeType\);[\s\S]*?images\.push\(\{ url \}\);[\s\S]*?\}[\s\S]*?return images;/g;

content = content.replace(generateSketchesRegex, `
    const generateSingleImage = async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: { parts: parts },
            config: {
                imageConfig: { aspectRatio: "3:4" }
            },
        });
        const imgData = extractImageOrThrow(response, "Sketch Generator");
        const url = await uploadBase64(imgData.data, imgData.mimeType);
        return { url };
    };

    const imagePromises = Array(imageCount).fill(null).map(() => generateSingleImage());
    return await Promise.all(imagePromises);
`);

// Patch generatePattern
const generatePatternRegex = /const response = await ai\.models\.generateContent\(\{[\s\S]*?model: 'gemini-3\.1-flash-lite-image',[\s\S]*?contents: \{ parts: parts \},[\s\S]*?config: \{[\s\S]*?imageConfig: \{ aspectRatio: "1:1", numberOfImages: imageCount \}[\s\S]*?\},[\s\S]*?\}\);[\s\S]*?const imagesData = extractImagesOrThrow\(response, "Pattern Generator"\);[\s\S]*?const images: ImageSource\[\] = \[\];[\s\S]*?for \(const imgData of imagesData\) \{[\s\S]*?const url = await uploadBase64\(imgData\.data, imgData\.mimeType\);[\s\S]*?images\.push\(\{ url \}\);[\s\S]*?\}[\s\S]*?return images;/g;

content = content.replace(generatePatternRegex, `
    const generateSingleImage = async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: { parts: parts },
            config: {
                imageConfig: { aspectRatio: "1:1" }
            },
        });
        const imgData = extractImageOrThrow(response, "Pattern Generator");
        const url = await uploadBase64(imgData.data, imgData.mimeType);
        return { url };
    };

    const imagePromises = Array(imageCount).fill(null).map(() => generateSingleImage());
    return await Promise.all(imagePromises);
`);

fs.writeFileSync('services/geminiService.ts', content);
