const fs = require('fs');
let content = fs.readFileSync('services/geminiService.ts', 'utf8');

// Add import
if (!content.includes("import { jsonrepair } from 'jsonrepair';")) {
    content = content.replace("import { getDisplaySrc,", "import { jsonrepair } from 'jsonrepair';\nimport { getDisplaySrc,");
}

const extractJsonRegex = /const extractJSON = \([^)]+\): string => \{[\s\S]*?return cleanText; \/\/ fallback\n\};/;
const newExtractJson = `const extractJSON = (text: string): string => {
    let cleanText = text.replace(/\\r\\n/g, '\\n');
    cleanText = cleanText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    
    // Find the first { or [
    const firstBrace = cleanText.indexOf('{');
    const firstBracket = cleanText.indexOf('[');
    
    let startIdx = -1;
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        startIdx = firstBrace;
    } else if (firstBracket !== -1) {
        startIdx = firstBracket;
    }
    
    if (startIdx !== -1) {
        cleanText = cleanText.substring(startIdx);
    }
    
    try {
        return jsonrepair(cleanText);
    } catch (e) {
        console.error("jsonrepair failed, returning raw string", e);
        return cleanText;
    }
};`;

content = content.replace(extractJsonRegex, newExtractJson);

fs.writeFileSync('services/geminiService.ts', content);
