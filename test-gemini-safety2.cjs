const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "missing" });

async function run() {
    try {
        const fullPrompt = "A sexually explicit fashion sketch";
        const parts = [{ text: fullPrompt }];

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: { parts: parts }
        });
        console.log(JSON.stringify(response, null, 2));
    } catch(e) {
        console.error("Error:", e.message);
    }
}
run();
