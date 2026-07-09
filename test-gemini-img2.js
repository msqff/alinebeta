import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "missing" });

async function run() {
    try {
        console.log("Testing image generation 2...");
        const res = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: "a dog",
            config: { imageConfig: { aspectRatio: "3:4" } }
        });
        console.log("Success:", JSON.stringify(res, null, 2));
    } catch(e) {
        console.error("Error image generation 2:", e.message);
    }
}
run();
