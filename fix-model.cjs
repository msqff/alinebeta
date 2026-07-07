const fs = require('fs');

let content = fs.readFileSync('services/geminiService.ts', 'utf8');

content = content.replace(/gemini-2\.5-flash-image/g, 'gemini-3.1-flash-lite-image');

fs.writeFileSync('services/geminiService.ts', content);
