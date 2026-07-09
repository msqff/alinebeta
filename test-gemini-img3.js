import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "missing" });

async function run() {
    try {
        console.log("Testing image generation 4 images...");
        const res = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: "a dog",
            config: { imageConfig: { aspectRatio: "3:4", numberOfImages: 4 } }
        });
        console.log(JSON.stringify(res, (k,v) => k === 'data' ? '<base64>' : v, 2));
    } catch(e) {
        console.error("Error:", e.message);
    }
}
run();
