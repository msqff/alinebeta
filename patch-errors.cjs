const fs = require('fs');
let content = fs.readFileSync('services/geminiService.ts', 'utf8');

const regex1 = /const extractImageOrThrow = \(response: any, context: string = "API"\): \{ data: string, mimeType: string \} => \{[\s\S]*?throw new Error\(\`\$\{context\} did not return an image or text explanation\.\`\);\n\};/;
const regex1alt = /const extractImageOrThrow = \(response: GenerateContentResponse, context: string = "API"\): \{ data: string, mimeType: string \} => \{[\s\S]*?throw new Error\(\`\$\{context\} did not return an image or text explanation\.\`\);\n\};/;

const regex2 = /const extractImagesOrThrow = \(response: any, context: string = "API"\): \{ data: string, mimeType: string \}\[\] => \{[\s\S]*?return images;\n\};/;

const newExtractImageOrThrow = `const extractImageOrThrow = (response: any, context: string = "API"): { data: string, mimeType: string } => {
    if (response.promptFeedback?.blockReason) {
        throw new Error(\`\${context} prompt was blocked. Reason: \${response.promptFeedback.blockReason}\`);
    }

    const candidate = response.candidates?.[0];
    if (!candidate) {
        console.error(\`[\${context}] Raw API Response:\`, JSON.stringify(response, null, 2));
        throw new Error(\`\${context} did not return any candidates.\`);
    }

    if (candidate.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
        throw new Error(\`\${context} was blocked. Reason: \${candidate.finishReason}\`);
    }

    const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);
    
    if (imagePart && imagePart.inlineData) {
        return {
            data: imagePart.inlineData.data,
            mimeType: imagePart.inlineData.mimeType || 'image/png'
        };
    }

    const textPart = candidate?.content?.parts?.find((part: any) => part.text);
    if (textPart && textPart.text) {
        const reason = textPart.text.trim();
        throw new Error(\`\${context} returned text instead of image: "\${reason.length > 100 ? reason.substring(0, 100) + '...' : reason}"\`);
    }

    console.error(\`[\${context}] Raw API Response:\`, JSON.stringify(response, null, 2));
    throw new Error(\`\${context} did not return an image or text explanation.\`);
};`;

const newExtractImagesOrThrow = `const extractImagesOrThrow = (response: any, context: string = "API"): { data: string, mimeType: string }[] => {
    if (response.promptFeedback?.blockReason) {
        throw new Error(\`\${context} prompt was blocked. Reason: \${response.promptFeedback.blockReason}\`);
    }

    const images: { data: string, mimeType: string }[] = [];
    if (!response.candidates || response.candidates.length === 0) {
        console.error(\`[\${context}] Raw API Response:\`, JSON.stringify(response, null, 2));
        throw new Error(\`\${context} did not return any candidates.\`);
    }
    for (const candidate of response.candidates) {
        if (candidate.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
            throw new Error(\`\${context} was blocked. Reason: \${candidate.finishReason}\`);
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
        const textPart = response.candidates[0]?.content?.parts?.find((part: any) => part.text);
        if (textPart && textPart.text) {
            const reason = textPart.text.trim();
            throw new Error(\`\${context} returned text instead of image: "\${reason.length > 100 ? reason.substring(0, 100) + '...' : reason}"\`);
        }
        console.error(\`[\${context}] Raw API Response:\`, JSON.stringify(response, null, 2));
        throw new Error(\`\${context} did not return any images or text explanation. This could be due to an unhandled safety block or API issue.\`);
    }
    return images;
};`;

let replaced = false;
if (regex1.test(content)) { content = content.replace(regex1, newExtractImageOrThrow); replaced = true; }
else if (regex1alt.test(content)) { content = content.replace(regex1alt, newExtractImageOrThrow); replaced = true; }

if (regex2.test(content)) { content = content.replace(regex2, newExtractImagesOrThrow); replaced = true; }

if (!replaced) {
    console.error("Failed to match regex.");
    process.exit(1);
}

fs.writeFileSync('services/geminiService.ts', content);
