const fs = require('fs');
let content = fs.readFileSync('services/geminiService.ts', 'utf8');

const regexSketchPrompt = /const sketchPrompt = \`\\\$\\{baseSketchPrompt\\}\\\$\\{promptAddition\\}\. Clean line drawing, unfilled outline only, on a stark pure white background\. No shadows, no gradients, no shading\. Professional, clean, hand-drawn quality\. The aspect ratio of the image should be 3:4\.\`;/;
content = content.replace(regexSketchPrompt, `const sketchPrompt = \`\${baseSketchPrompt}\${promptAddition}. The sketch must be a single, front-facing view only (no multiple views or back views). Clean line drawing, unfilled outline only, on a stark pure white background. No shadows, no gradients, no shading. Professional, clean, hand-drawn quality. The aspect ratio of the image should be 3:4.\`;`);

fs.writeFileSync('services/geminiService.ts', content);
