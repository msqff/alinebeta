const fs = require('fs');
let content = fs.readFileSync('services/geminiService.ts', 'utf8');

const regex = /export const analyzeCollectionIntake = async \(image: ImageSource\): Promise<\{ styleDna: string, palette: string\[\] \}> => \{[\s\S]*?return await Promise\.all\(imagePromises\);\s*\n\};/g;
const replacement = `export const analyzeCollectionIntake = async (image: ImageSource): Promise<{ styleDna: string, palette: string[] }> => {
    const localImage = await getImageData(image);
    const ai = getAI();
    const prompt = \`Analyze this mood board image to extract the "Style DNA" and "Color Palette" for a new fashion collection.
    
    1. Style DNA: A concise paragraph (approx 50 words) describing the core aesthetic, shapes, textures, and target vibe.
    2. Palette: Extract 5 distinctive Hex color codes from the image that represent the collection.

    Return JSON format:
    {
        "styleDna": "string",
        "palette": ["#hex", "#hex", "#hex", "#hex", "#hex"]
    }\`;

    const parts = [
        { inlineData: { data: localImage.data, mimeType: localImage.mimeType } },
        { text: prompt },
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: { parts: parts },
    });
    
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("API did not return content.");
    return JSON.parse(extractJSON(text));
};`;

content = content.replace(regex, replacement);
fs.writeFileSync('services/geminiService.ts', content);
