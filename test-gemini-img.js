import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "missing" });

async function run() {
    try {
        console.log("Testing image generation 2.5...");
        const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: "a dog",
            config: { imageConfig: { aspectRatio: "3:4" } }
        });
        console.log("Success image generation 2.5");
    } catch(e) {
        console.error("Error image generation 2.5:", e.message);
    }
}
run();
