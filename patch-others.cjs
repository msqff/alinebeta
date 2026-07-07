const fs = require('fs');

let content = fs.readFileSync('services/geminiService.ts', 'utf8');

// Replace all generateSingleImage loops with numberOfImages
const regex = /const generateSingleImage = async \(\) => \{[\s\S]*?const response = await ai\.models\.generateContent\(\{[\s\S]*?model: 'gemini-3\.1-flash-lite-image',[\s\S]*?contents: (\{[\s\S]*?\}),[\s\S]*?config: \{[\s\S]*?imageConfig: \{ aspectRatio: ("[^"]+") \}[\s\S]*?\}(?:,[\s\S]*?)?\}\);[\s\S]*?const imgData = extractImageOrThrow\(response, "[^"]+"\);[\s\S]*?const url = await uploadBase64\(imgData\.data, imgData\.mimeType\);[\s\S]*?return \{ url \};[\s\S]*?\};[\s\S]*?const images: ImageSource\[\] = \[\];[\s\S]*?for \(let i = 0; i < imageCount; i\+\+\) \{[\s\S]*?images\.push\(await generateSingleImage\(\)\);[\s\S]*?\}[\s\S]*?return images;[\s\S]*?;/g;

content = content.replace(regex, (match, contentsMatch, aspectRatioMatch) => {
    return `
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: ${contentsMatch},
        config: {
            imageConfig: { aspectRatio: ${aspectRatioMatch}, numberOfImages: imageCount }
        },
    });
    const imagesData = extractImagesOrThrow(response, "Image Generator");
    const images: ImageSource[] = [];
    for (const imgData of imagesData) {
        const url = await uploadBase64(imgData.data, imgData.mimeType);
        images.push({ url });
    }
    return images;
`;
});

fs.writeFileSync('services/geminiService.ts', content);
