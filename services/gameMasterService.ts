import { GoogleGenAI, Type } from "@google/genai";
import { SpecialtyId } from "../types";

// Definitions strictly enforced as Ground Truth for the AI
const SPECIALTY_DEFINITIONS = `
1. Sports Psychology (ID: SPORTS): Enhances performance/well-being. Focuses on goal setting, focus, stress management, coping with pressure/injury, and motivation.
2. Forensic Psychology (ID: FORENSIC): Intersection of psychology and law. Covers criminal investigations, courtroom testimony, offender assessment, evaluating defendant's mental state.
3. Consumer Psychology (ID: CONSUMER): Buying behavior and brand perception. Covers decision-making, motivations, influence of culture/emotions, business strategy.
4. School Psychology (ID: SCHOOL): Supporting students in educational settings. Covers academic/emotional needs, designing interventions, special needs.
5. Military Psychology (ID: MILITARY): Supporting personnel/veterans. Covers selection, stress management, PTSD treatment, resilience.
6. Counseling Psychology (ID: COUNSELING): Adjustment and well-being. Covers emotional/social/work concerns, fostering resilience, personal development.
7. I/O Psychology (ID: IO): Workplace behavior. Covers productivity, job satisfaction, leadership, organizational design.
`;

let ai = null;

const getAiClient = () => {
    if (!ai) {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API Key not found");
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

/**
 * Fetches a new crisis scenario from the AI Game Master.
 * Context-aware for Region (Egypt/USA) and Language (AR/EN).
 * @param targetId Optional SpecialtyId to force the AI to generate a scenario for a specific specialty (used for deck cycling).
 */
export const fetchCrisisScenario = async (region: 'usa' | 'egypt' = 'usa', language: 'en' | 'ar' = 'en', targetId?: SpecialtyId) => {
    const client = getAiClient();
    
    const contextInstruction = region === 'egypt' 
        ? "CONTEXT: Generate scenarios relevant to Egyptian culture or industries (e.g., Textile factories, Sports clubs in Cairo, Schools in Alexandria)." 
        : "CONTEXT: Generate scenarios relevant to United States culture and locations.";

    const languageInstruction = language === 'ar'
        ? "OUTPUT LANGUAGE: The 'alert_text', 'target_specialty', and 'correct_reasoning' MUST be in professional Modern Standard Arabic (Fusha)."
        : "OUTPUT LANGUAGE: English.";

    // Logic to enforce the shuffled deck
    const targetInstruction = targetId 
        ? `MANDATORY INSTRUCTION: You MUST generate a crisis scenario specifically for the Specialty ID: "${targetId}". Do not select randomly. The 'target_id' in JSON MUST be "${targetId}". Use the definition provided in GROUND TRUTH.`
        : "INSTRUCTION: Select ONE specialty ID from the list below randomly.";

    // SAFETY PROTOCOL & PERSONA
    const systemPrompt = `
    IDENTITY: You are the "PsyEgypt Central Command System". You are communicating directly with a Field Dispatcher.
    TONE: Tactical, Urgent, Professional, Precise.
    
    SAFETY PROTOCOL (CRITICAL):
    1. AVOID specific references to "Egyptian Intelligence", "GIS", "The Army", "Police Force", or specific political figures.
    2. USE professional, generic sector terms instead:
       - Instead of "Army/Military", use "Defense Sector" or "Service Personnel".
       - Instead of "Intelligence/Police", use "Security Sector" or "Forensic Units".
       - Focus strictly on the *psychological* aspect (PTSD, resilience, selection, rehabilitation), not operational/combat details.
    
    GOAL: ${targetId ? `Generate a high-stakes 'Crisis Alert' specifically for target_id: ${targetId}` : "Select ONE specialty ID randomly and generate a 'Crisis Alert'."}
    
    ${targetInstruction}

    GROUND TRUTH:
    ${SPECIALTY_DEFINITIONS}

    ${contextInstruction}
    ${languageInstruction}

    FORMATTING RULES:
    1. 'alert_text': Start with "INCOMING SIGNAL:" or "ATTENTION DISPATCHER:". Max 2 sentences. Urgent tone. DO NOT mention the specialty name explicitly in the alert.
    2. 'target_id': Must be one of ['SPORTS', 'FORENSIC', 'CONSUMER', 'SCHOOL', 'MILITARY', 'COUNSELING', 'IO'].
    3. 'correct_reasoning': Explain why this ID is the solution using the provided Ground Truth definitions.
    4. 'learn_more_key': Suggest a navigation key (e.g., 'clinical_pathOverview' for Counseling, 'workforce_data' for IO, 'explore_paths' for others).

    OUTPUT JSON ONLY.
    `;

    try {
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Generate a new Crisis Mission now.",
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        target_id: { type: Type.STRING, enum: ['SPORTS', 'FORENSIC', 'CONSUMER', 'SCHOOL', 'MILITARY', 'COUNSELING', 'IO'] },
                        target_specialty: { type: Type.STRING },
                        alert_text: { type: Type.STRING },
                        correct_reasoning: { type: Type.STRING },
                        learn_more_key: { type: Type.STRING }
                    },
                    required: ["target_id", "target_specialty", "alert_text", "correct_reasoning"]
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI Game Master");
        
        return JSON.parse(text);
    } catch (error) {
        console.error("Game Master Error:", error);
        // Fallback mission with safe terminology
        return {
            id: "fallback-001",
            target_id: "IO",
            target_specialty: language === 'ar' ? "علم النفس الصناعي والتنظيمي" : "I/O Psychology",
            alert_text: language === 'ar' 
                ? "إشارة واردة: انقطاع مفاجئ في الإنتاجية في قطاع التصنيع بعد عملية دمج الشركات. الروح المعنوية منخفضة للغاية."
                : "INCOMING SIGNAL: Productivity has plummeted following the corporate merger. Morale is critical.",
            correct_reasoning: language === 'ar'
                ? "أخصائي علم النفس الصناعي يركز على سلوك مكان العمل والديناميكيات التنظيمية."
                : "I/O Psychologists specialize in workplace behavior and organizational dynamics.",
            learn_more_key: "workforce_data"
        };
    }
};