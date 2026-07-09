const fs = require('fs');
let content = fs.readFileSync('services/geminiService.ts', 'utf8');

const regex = /const response = await ai\.models\.generateContent\(\{[\s\S]*?model: 'gemini-3\.1-flash-lite-image',[\s\S]*?contents: \{ parts: sketchParts \},[\s\S]*?config: \{[\s\S]*?imageConfig: \{ aspectRatio: "3:4", numberOfImages: 4 \}[\s\S]*?\},[\s\S]*?\}\);[\s\S]*?const imagesData = extractImagesOrThrow\(response, "Sketch Generator"\);[\s\S]*?const sketches: ImageSource\[\] = \[\];[\s\S]*?for \(const imgData of imagesData\) \{[\s\S]*?const url = await uploadBase64\(imgData\.data, imgData\.mimeType\);[\s\S]*?sketches\.push\(\{ url \}\);[\s\S]*?\}/g;

content = content.replace(regex, `
    const generateSingleSketch = async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: { parts: sketchParts },
            config: {
                imageConfig: { aspectRatio: "3:4" }
            },
        });
        const imgData = extractImageOrThrow(response, "Sketch Generator");
        const url = await uploadBase64(imgData.data, imgData.mimeType);
        return { url };
    };

    const sketchPromises = Array(4).fill(null).map(() => generateSingleSketch());
    const sketches = await Promise.all(sketchPromises);
`);

fs.writeFileSync('services/geminiService.ts', content);
