const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "missing" });

async function run() {
    try {
        const fullPrompt = "A minimalist black and white fashion flat sketch of a flowing dress. Clean line drawing, unfilled outline only, on a stark pure white background. No shadows, no gradients, no shading. Professional, clean, hand-drawn quality. The aspect ratio of the image should be 3:4.";
        const parts = [{ text: fullPrompt }];

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: { parts: parts },
            config: {
                imageConfig: { aspectRatio: "3:4", numberOfImages: 4 }
            }
        });
        console.log("Response:", JSON.stringify(response.candidates?.[0]?.content?.parts?.map(p => Object.keys(p)), null, 2));
    } catch(e) {
        console.error("Error:", e.message);
    }
}
run();
