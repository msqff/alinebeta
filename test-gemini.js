import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
    try {
        console.log("Testing text generation...");
        const res = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: "test"
        });
        console.log("Success text generation");
    } catch(e) {
        console.error("Error text generation:", e.message);
    }
}
run();
