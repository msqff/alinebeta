import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "missing" });

async function run() {
    try {
        const res = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: "a dog",
            config: { imageConfig: { aspectRatio: "3:4", numberOfImages: 4 } }
        });
        console.log("Number of candidates:", res.candidates?.length);
        if (res.candidates) {
            for (let i = 0; i < res.candidates.length; i++) {
                console.log(`Candidate ${i} parts:`, res.candidates[i].content?.parts?.map(p => Object.keys(p)));
            }
        }
    } catch(e) {
        console.error("Error:", e.message);
    }
}
run();
