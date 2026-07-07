const fs = require('fs');

let content = fs.readFileSync('services/geminiService.ts', 'utf8');

// Line 249: Mood Board
content = content.replace(/config:\s*\{\s*responseModalities:\s*\[Modality\.IMAGE,\s*Modality\.TEXT\]\s*\}/, `config: {
            imageConfig: { aspectRatio: "16:9" }
        }`);

// Line 327: Single Sketch
content = content.replace(/config:\s*\{\s*responseModalities:\s*\[Modality\.IMAGE,\s*Modality\.TEXT\]\s*\}/, `config: {
                imageConfig: { aspectRatio: "3:4" }
            }`);

// Line 355: Sketch Generator
content = content.replace(/config:\s*\{\s*responseModalities:\s*\[Modality\.IMAGE,\s*Modality\.TEXT\]\s*\}/, `config: {
                imageConfig: { aspectRatio: "3:4" }
            }`);

// Line 376: Pattern Generator
content = content.replace(/config:\s*\{\s*responseModalities:\s*\[Modality\.IMAGE,\s*Modality\.TEXT\]\s*\}/, `config: {
                imageConfig: { aspectRatio: "1:1" }
            }`);

// Line 411: Sketch Editor
content = content.replace(/config:\s*\{\s*responseModalities:\s*\[Modality\.IMAGE,\s*Modality\.TEXT\]\s*\}/, `config: {
                imageConfig: { aspectRatio: "3:4" }
            }`);

// Line 446: Image Editor
content = content.replace(/config:\s*\{\s*responseModalities:\s*\[Modality\.IMAGE,\s*Modality\.TEXT\]\s*\}/, `config: {
                imageConfig: { aspectRatio: "3:4" }
            }`);

// Line 487: Product Visualiser
content = content.replace(/config:\s*\{\s*responseModalities:\s*\[Modality\.IMAGE,\s*Modality\.TEXT\]\s*\}/, `config: {
                imageConfig: { aspectRatio: "3:4" }
            }`);

// Line 512: Model Placement
content = content.replace(/config:\s*\{\s*responseModalities:\s*\[Modality\.IMAGE,\s*Modality\.TEXT\]\s*\}/, `config: {
                imageConfig: { aspectRatio: "3:4" }
            }`);

// Line 552: Unknown (Maybe Product review?)
content = content.replace(/config:\s*\{\s*responseModalities:\s*\[Modality\.IMAGE,\s*Modality\.TEXT\]\s*\}/, `config: {
                imageConfig: { aspectRatio: "16:9" }
            }`);

// Line 954: MultiViews
content = content.replace(/config:\s*\{\s*responseModalities:\s*\[Modality\.IMAGE,\s*Modality\.TEXT\]\s*\}/, `config: {
            imageConfig: { aspectRatio: "16:9" }
        }`);

fs.writeFileSync('services/geminiService.ts', content);
