import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
    try {
        console.log("Testing 3:4...");
        const res = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: "test",
            config: { imageConfig: { aspectRatio: "3:4" } }
        });
        console.log("Success 3:4");
    } catch(e) {
        console.error("Error 3:4:", e.message);
    }
}
run();
