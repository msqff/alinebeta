import React, { useState } from 'react';

const PROMPT_LIBRARY = [
    {
        name: "Analyze Collection Intake",
        description: "Extracts Style DNA and Color Palette from a mood board.",
        prompt: `Analyze this mood board image to extract the "Style DNA" and "Color Palette" for a new fashion collection.
    
    1. Style DNA: A concise paragraph (approx 50 words) describing the core aesthetic, shapes, textures, and target vibe.
    2. Palette: Extract 5 distinctive Hex color codes from the image that represent the collection.

    Return JSON format:
    {
        "styleDna": "string",
        "palette": ["#hex", "#hex", "#hex", "#hex", "#hex"]
    }`
    },
    {
        name: "Generate Item Suggestions",
        description: "Suggests new items for a collection based on Style DNA.",
        prompt: `Act as a Senior Fashion Merchandiser planning a collection named "{collectionName}".
    
    Style DNA: "{styleDna}"
    {existingItems}
    
    Task: Suggest 3 specific fashion items to add to this collection.
    
    Rules:
    1. Suggestions must be specific descriptive names (e.g. "Oversized Cable Knit Cardigan" instead of just "Cardigan").
    2. Suggestions must complement the Style DNA and any existing items to ensure a cohesive range (mix of tops, bottoms, outerwear etc).
    3. If existing items are provided, do NOT duplicate them. Suggest items that fill gaps (e.g. if there are tops, suggest bottoms or outerwear).
    
    Return JSON array:
    [
        { "name": "Item Name", "reasoning": "Brief reason why this fits" },
        ...
    ]`
    },
    {
        name: "Analyze Mood Board (Summary)",
        description: "Generates a summary of core themes, color palette, silhouettes, and fabrics from a mood board.",
        prompt: `Analyze the attached images which form a fashion mood board. Provide a summary of the core themes, a suggested color palette (using common color names), key silhouettes, and potential fabrics. Format this as a concise but detailed report with clear headings for each section (e.g., ## Core Themes, ## Color Palette). The tone should be professional and insightful for a fashion designer.`
    },
    {
        name: "Analyze Mood Board (Sketch)",
        description: "Generates a sketch based on the mood board.",
        prompt: `Inspired by the aesthetic of the attached mood board images, generate a minimalist black and white fashion flat sketch of a cohesive {userPrompt}. Clean line drawing, unfilled outline only, on a stark pure white background. No shadows, no gradients, no shading. Professional, clean, hand-drawn quality. The aspect ratio of the image should be 3:4.`
    },
    {
        name: "Generate Sketches",
        description: "Generates initial fashion sketches from a text prompt.",
        prompt: `A minimalist black and white fashion flat sketch of {prompt}. Clean line drawing, unfilled outline only, on a stark pure white background. No shadows, no gradients, no shading. Professional, clean, hand-drawn quality. The aspect ratio of the image should be 3:4.
        
DESIGN CONTEXT - The design must strictly adhere to the following Style DNA: {styleDna}. Incorporate these aesthetic cues into the silhouette and details.`
    },
    {
        name: "Generate Pattern",
        description: "Generates a seamless pattern.",
        prompt: `A seamless, tileable, photorealistic pattern of {prompt}. The image should be a square (1:1 aspect ratio).`
    },
    {
        name: "Tweak Sketch (with mask)",
        description: "Modifies a specific part of a sketch.",
        prompt: `Based on the provided fashion flat sketch and the mask, apply this change ONLY to the masked area: "{prompt}". The output must remain a minimalist black and white flat sketch. Maintain the style of the original: clean line drawing, unfilled outline only, on a stark pure white background. No shadows, no gradients, no shading.`
    },
    {
        name: "Tweak Sketch (without mask)",
        description: "Modifies the entire sketch.",
        prompt: `Based on the provided fashion flat sketch, generate a new version with the following modification: "{prompt}". The output must strictly be a minimalist black and white fashion flat sketch. Maintain the style of the original: clean line drawing, unfilled outline only, on a stark pure white background. No shadows, no gradients, no shading.`
    },
    {
        name: "Tweak Studio Image (with mask)",
        description: "Modifies a specific part of a studio image.",
        prompt: `Based on the provided product image and the mask, apply this change ONLY to the masked area: "{prompt}". The output must remain a photorealistic studio product shot. Maintain the style of the original: professional lighting, neutral background, and realistic textures.`
    },
    {
        name: "Tweak Studio Image (without mask)",
        description: "Modifies the entire studio image.",
        prompt: `Based on the provided photorealistic product image, generate a new version with the following modification: "{prompt}". Ensure the output is a hyper-realistic photograph of a real physical garment, avoiding any digital mock-up look. Focus on realistic fabric texture and lighting. Please provide a distinct visual variation.`
    },
    {
        name: "Visualise Product",
        description: "Transforms a sketch into a photorealistic studio shot.",
        prompt: `Transform the provided sketch into a hyper-realistic, true-to-life photograph of a real physical garment. The result must be indistinguishable from a high-end studio photo of a manufactured product. Strictly avoid any illustrative, painterly, or digital-art styles. Focus on tangible fabric textures (weave, sheen, weight), realistic draping, and precise construction details (seams, hems). Display on a neutral background. Specific design details: "{prompt}".
        
DESIGN CONTEXT - The materials, textures, and general finish MUST align with this Style DNA: {styleDna}.
COLOR PALETTE - Prioritize these colors where appropriate/unspecified: {palette}.`
    },
    {
        name: "Place On Model",
        description: "Places a garment on a photorealistic model.",
        prompt: `Realistically place the garment from the provided image onto a photorealistic model. The model's pose and camera angle should be: "{prompt}". The background should be a simple studio or neutral setting. The final image should be a full-body shot. Ensure the garment's draping, folds, and fit look natural for the specified pose and the lighting on the model and garment is consistent. Please provide a distinct visual variation.`
    },
    {
        name: "Generate Multi-Views (Back)",
        description: "Generates a back view of the garment.",
        prompt: `Generate a photorealistic BACK view of the garment shown in the reference image. Maintain exact consistency in fabric texture, color, and seam placement. The lighting should be consistent with the reference. Do not add new features not implied by the front view. Neutral background.`
    },
    {
        name: "Generate Multi-Views (Side Left)",
        description: "Generates a left side profile view of the garment.",
        prompt: `Generate a photorealistic LEFT SIDE profile view of the garment shown in the reference image. Show the side seam and drape clearly. Maintain exact consistency in fabric texture and color. Neutral background.`
    },
    {
        name: "Generate Multi-Views (Side Right)",
        description: "Generates a right side profile view of the garment.",
        prompt: `Generate a photorealistic RIGHT SIDE profile view of the garment shown in the reference image. Show the side seam and drape clearly. Maintain exact consistency in fabric texture and color. Neutral background.`
    },
    {
        name: "Generate Multi-Views (Detail Zoom)",
        description: "Generates a macro shot of the garment.",
        prompt: `Generate an extreme close-up MACRO shot of the fabric texture and details of the garment shown in the reference image. Focus on the weave, stitching, or buttons. Maintain exact color accuracy. Neutral background.`
    },
    {
        name: "Generate Tech Pack",
        description: "Generates a structured Technical Pack JSON object.",
        prompt: `Analyze the provided garment image(s) and generate a structured Technical Pack JSON object.
    
    The JSON must strictly follow this structure:
    {
        "sections": [
            {
                "title": "Section Title (e.g., Garment Features, Materials)",
                "items": [
                    {
                        "label": "Item Label (e.g., Neckline, Main Fabric)",
                        "value": "Item Value (e.g., V-neck, 100% Cotton)",
                        "options": ["Alternative 1", "Alternative 2"]
                    }
                ]
            }
        ]
    }

    Required Sections:
    1. Garment Features (Detail fits, cuts, and finishings)
    2. Suggested Materials
    3. Construction Notes (Seams, stitching, hem type)
    4. Bill of Materials (BOM)

    CRITICAL INSTRUCTION FOR 'options':
    - You MUST provide 1-3 plausible alternatives or variations for nearly every field to give the designer choices.
    - The 'value' should be your best guess based on the image.
    - The 'options' should be valid variations a designer might consider (e.g., if 'value' is 'Boxy Fit', 'options' could be ['Regular Fit', 'Oversized Fit']; if 'value' is '100% Cotton', 'options' could be ['95% Cotton 5% Elastane', 'Organic Cotton']).
    - Only leave 'options' empty if the feature is 100% unambiguous and unchangeable.

    Output ONLY valid JSON. No markdown formatting.`
    },
    {
        name: "Generate Product Review",
        description: "Conducts an IP, Safety, and Fabrication audit.",
        prompt: `Act as a strictly critical Risk Compliance Officer (IP & Safety) and a Senior Production Manager. Conduct a harsh, uncompromising audit of the attached fashion design.

    1. Legal Audit: Scrutinize for ANY resemblance to known trademarks, logos, iconic trade dress (e.g., Adidas stripes, Burberry check, Gucci horsebit, Nike swoosh), or copyright protected artwork/characters. Be extremely conservative; if it looks even slightly familiar or derivative, FLAG IT as a risk.
    2. Safety Audit: Rigorously identify potential physical hazards.
       - Strangulation: Drawstrings/cords near neck/hood (strictly prohibited in many regions for childrenswear).
       - Choking: Buttons, loose embellishments, beads, or sequins (especially on childrenswear).
       - Entrapment: Zippers, loops, or toggles.
       - Flammability: Assess fabric drape/texture for potential high flammability risks (e.g., sheer synthetics, high pile).
    3. Fabrication Audit: Identify potential manufacturing challenges. Look for impossible seams, unrealistic drapes, or details that would be difficult or expensive to produce in mass manufacturing. Highlight areas where the image fidelity might be misleading (e.g., "Texture implies heavy wool but drape suggests silk", "Seam lines disappear into nowhere").

    Use the following Technical Specifications to inform your safety audit, particularly regarding material composition and construction:
    {techPack}

    Return a strict JSON object with this structure:
    {
        "compliance_score": number (0-100, where 100 is perfectly safe/legal/feasible. Be harsh with deductions for risks),
        "status": "PASS" or "FLAGGED",
        "legal_audit": {
            "risk_level": "Low" | "Medium" | "High",
            "flags": ["string", "string"] (list of specific issues found, empty if none)
        },
        "safety_audit": {
            "risk_level": "Low" | "Medium" | "High",
            "flags": ["string", "string"] (list of specific issues found, empty if none)
        },
        "fabrication_audit": {
            "risk_level": "Low" | "Medium" | "High",
            "flags": ["string", "string"] (list of specific issues found, empty if none)
        }
    }
    Output ONLY valid JSON.`
    },
    {
        name: "Generate Shopper Pulse",
        description: "Evaluates the visual quality against a price point.",
        prompt: `You are a British High Street Shopper. Your persona is: "{persona}".
    Description: {personaDetails}.
    
    I am showing you a garment I found. The retail price is £{price}.
    
    Task: Evaluate the visual quality (fabric drape, complexity, silhouette, finish) against this price. Is it good Value for Money?
    
    Critical Constraints:
    1. Tone: Use British English terminology/slang (e.g., trousers, jumper, trainers, quid, fiver, autumn).
    2. Logic: Be SKEPTICAL. If the price is high but it looks synthetic or basic, reject it. If it's cheap but looks expensive, be enthusiastic. Focus on practicality (washability, warmth).
    3. Output: Return a strict JSON object.
    
    {
        "purchase_probability": number (0-100),
        "headline": "string (Max 5 words, punchy verdict)",
        "customer_voice": "string (One single sentence explanation in your persona's voice)"
    }`
    }
];

interface PromptLibraryModalProps {
    onClose: () => void;
}

export const PromptLibraryModal: React.FC<PromptLibraryModalProps> = ({ onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPrompts = PROMPT_LIBRARY.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.prompt.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6" onClick={onClose}>
            <div 
                className="glass-panel rounded-2xl shadow-2xl border border-slate-700 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Prompt Library</h2>
                        <p className="text-slate-400 text-sm">Review the AI prompts used across the application.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-white/5 bg-slate-950/50">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-xl leading-5 bg-slate-900 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                            placeholder="Search prompts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto custom-scrollbar p-6 bg-slate-950/60">
                    <div className="grid grid-cols-1 gap-6">
                        {filteredPrompts.map((item, index) => (
                            <div key={index} className="bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden">
                                <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
                                    <h3 className="text-lg font-bold text-white">{item.name}</h3>
                                    <p className="text-sm text-slate-400 mt-1">{item.description}</p>
                                </div>
                                <div className="p-4 bg-slate-950/50">
                                    <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                                        {item.prompt}
                                    </pre>
                                </div>
                            </div>
                        ))}
                        {filteredPrompts.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-slate-400">No prompts found matching your search.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
