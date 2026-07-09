import { GoogleGenAI } from "@google/genai";
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "missing" });

async function run() {
    try {
        const fullPrompt = "A minimalist black and white fashion flat sketch of a dog. Clean line drawing, unfilled outline only, on a stark pure white background. No shadows, no gradients, no shading. Professional, clean, hand-drawn quality. The aspect ratio of the image should be 3:4.";
        const parts = [{ text: fullPrompt }];

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: { parts: parts },
            config: {
                imageConfig: { aspectRatio: "3:4", numberOfImages: 4 }
            },
        });
        fs.writeFileSync('response.json', JSON.stringify(response, null, 2));
        console.log("Response written to response.json");
    } catch(e) {
        console.error("Error:", e.message);
    }
}
run();
