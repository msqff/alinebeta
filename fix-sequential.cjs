const fs = require('fs');

let content = fs.readFileSync('services/geminiService.ts', 'utf8');

content = content.replace(/const imagePromises = Array\(imageCount\)\.fill\(null\)\.map\(\(\) => generateSingleImage\(\)\);\s*return Promise\.all\(imagePromises\);/g, `const images: ImageSource[] = [];
    for (let i = 0; i < imageCount; i++) {
        images.push(await generateSingleImage());
    }
    return images;`);

fs.writeFileSync('services/geminiService.ts', content);
