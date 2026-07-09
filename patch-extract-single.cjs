const fs = require('fs');
let content = fs.readFileSync('services/geminiService.ts', 'utf8');

const regex = /const extractImageOrThrow = \(response: any, context: string = "API"\): \{ data: string, mimeType: string \} => \{[\s\S]*?throw new Error\(\`\$\{context\} did not return an image or text explanation\.\`\);\n\};/;

const newFn = `const extractImageOrThrow = (response: any, context: string = "API"): { data: string, mimeType: string } => {
    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error(\`\${context} did not return any candidates.\`);

    if (candidate.finishReason === 'SAFETY') {
        throw new Error(\`\${context} was blocked by safety filters. Please try modifying your prompt.\`);
    }
    if (candidate.finishReason === 'RECITATION') {
        throw new Error(\`\${context} was blocked due to recitation. Please try modifying your prompt.\`);
    }
    if (candidate.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
         throw new Error(\`\${context} was blocked with reason: \${candidate.finishReason}\`);
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

    throw new Error(\`\${context} did not return an image or text explanation. This could be due to an unhandled safety block.\`);
};`;

content = content.replace(regex, newFn);
fs.writeFileSync('services/geminiService.ts', content);
