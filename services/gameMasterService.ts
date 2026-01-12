import { GoogleGenAI, Type } from "@google/genai";
import { SpecialtyId } from "../types";

// DECOLONIZED ARCHETYPE LIBRARY (Source of Truth)
const HAKEEM_ARCHETYPES = `
1. AL-HAMI (The Guardian): Focus on Agency, Protection, and 'Boundaried Responsibility'. Provides 'Sanad' (Support).
2. AL-DALIL (The Intuitive Navigator): Focus on Pattern Recognition, Systems Thinking. Possesses 'Basira' (Insight).
3. AL-MUBTAKIR (The Agile Bricoleur): Focus on Cognitive Flexibility, Resourcefulness, and 'Adaptive Resource Management'.
4. AL-WATAD (The Anchor/Docking Station): Focus on Emotional Regulation, Resilience (Sumoud).
5. AL-RAIDA (The Pioneer): Evolution of the Guardian for women. Integrates Agency with Nurturing.
6. AL-WASITA (The Resilient Mediator): Focus on Pragmatism, Negotiation, and Social Leverage.
7. AL-RAFIQ (The Peer Companion): Focus on Empathy, Validation, and Walking Beside the user.
`;

// SPECIALTY MAPPING TO ARCHETYPES
const SPECIALTY_DEFINITIONS = `
1. Sports Psychology (ID: SPORTS) -> AL-HAMI: Focus on mental toughness, focus, and protecting the athlete's state.
2. Forensic Psychology (ID: FORENSIC) -> AL-DALIL: Seeing hidden patterns in criminal behavior. Truth-seeking (Basira).
3. Consumer Psychology (ID: CONSUMER) -> AL-MUBTAKIR: Understanding decision triggers, optimizing value perception in scarcity.
4. School Psychology (ID: SCHOOL) -> AL-WATAD: Creating a safe container (Sanad) for students to grow.
5. Military Psychology (ID: MILITARY) -> AL-HAMI: Resilience, PTSD recovery, restoring the Guardian instinct after trauma.
6. Counseling Psychology (ID: COUNSELING) -> AL-RAFIQ (The Peer Companion): Moving from 'Authority' to 'Partnership' in healing.
7. I/O Psychology (ID: IO) -> AL-MUBTAKIR: Engineering Organizational Culture, fixing broken systems (Organizational Bricolage).
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
 * Fetches a new crisis scenario from the Hakeem Engine.
 * @param region 'usa' or 'egypt'
 * @param language 'en' or 'ar'
 * @param targetId Optional SpecialtyId to force generation for a specific specialty.
 * @param isScarcityMode Boolean to trigger 'Low-Load Mode' (Fadfada tone, simplified choices).
 */
export const fetchCrisisScenario = async (
    region: 'usa' | 'egypt' = 'usa', 
    language: 'en' | 'ar' = 'en', 
    targetId?: SpecialtyId,
    isScarcityMode: boolean = false
) => {
    
    // SCARCITY & CONTEXT INJECTION
    let contextInstruction = "";
    
    if (region === 'egypt') {
        if (language === 'en') {
            // ENGLISH-EGYPT PROTOCOL ("THE HYBRID ANCHOR")
            contextInstruction = `CONTEXT: EGYPT.
            PROTOCOL: "THE HYBRID ANCHOR".
            You are speaking Professional English with Egyptian Depth.
            RULE: When using specific sociological terms, ALWAYS provide the English definition in parentheses immediately after.
            
            MAPPING TABLE:
            - Ashwa'iyat -> "Ashwa'iyat (Informal Settlements)"
            - Waithood -> "Waithood (Social Stagnation)"
            - Economy of Toil -> "Economy of Toil (Cycle of Hardship)"
            - Jada'ana -> "Jada'ana (Community Solidarity)"
            - Wasta -> "Wasta (Social Connections)"
            - Gam'iya -> "Gam'iya (Money Circle)"
            - Fadiha -> "Fadiha (Digital Scandal)"
            
            Integrate these concepts where relevant to the crisis.`;
        } else {
            // ARABIC-EGYPT (THE EDUCATIONAL BRIDGE)
            contextInstruction = `CONTEXT: EGYPT (ASHWA'IYAT & INFORMAL ECONOMY).
            PROTOCOL: "THE EDUCATIONAL BRIDGE".
            
            MAPPING TABLE (Strict Adherence):
            - Waithood -> "مرحلة الانتظار (إنك تحس إن حالك واقف ومأجل حياتك)"
            - Iterative Survivalism -> "البقاء بالتجريب (إنك تعيش اليوم بيومه وتلقط رزقك)"
            - Economy of Toil -> "اقتصاد الكدح (الدوامة اللي فيها تعب كتير وعائد قليل)"
            - Double Burden -> "العبء المزدوج (لما تكوني شايلة شيلتين: شغل البيت وضغط الشغل)"
            - Bricolage -> "الذكاء التكيفي (إنك تعرف تتصرف وتغزل برجل حمار)"
            - Resilience (Sitir) -> "الصلابة النفسية (قدرتك إنك تصمد وتخرج من الأزمة 'مستور' من غير ما تتكسر)"
            - Ashwa'iyat -> "مجتمعات العشوائيات (المناطق اللي ناسها بتسند بعض)"
            - Digital Reputation -> "الوصمة الرقمية (لما المشكلة تلف النت كله، والإنترنت مابينساش)"
            `;
        }
    } else {
        contextInstruction = "CONTEXT: USA (Formal Economy, Individualism).";
    }

    let languageInstruction = language === 'ar'
        ? `OUTPUT LANGUAGE: Egyptian Ammiya (العامية المصرية).
           TRANSLATION RULES:
           1. RULE: You MUST mention the **Academic Term** first, followed immediately by the **Street Equivalent** in parentheses as defined in the MAPPING TABLE.
           2. Translate "Incoming Signal" to "إشارة من شبكة المنطقة:".
           3. SCRIPT RULE: Use Arabic script ONLY. No Latin characters.
           4. TONE: "Ibn Balad" (Scientific Grounding + Street Smart).`
        : "OUTPUT LANGUAGE: English.";

    if (isScarcityMode && language === 'ar') {
        languageInstruction += " TONE: 'Fadfada' (فضفضة) - Warm, supportive, simple words. The user is stressed.";
    }

    const targetInstruction = targetId 
        ? `MANDATORY: Generate for ID: "${targetId}". Use the assigned ARCHETYPE from the library.`
        : "INSTRUCTION: Select ONE specialty ID randomly.";

    const scarcityInstruction = isScarcityMode
        ? `CRITICAL: User is in SCARCITY MODE (Tunneling). 
           1. ALERT TEXT must be short, direct, and emotionally validating.
           2. FOCUS on immediate 'Micro-Actions'.
           3. FRAMING: Frame the crisis as a shared struggle (Toil), not a failure.`
        : "";

    // THE HAKEEM SYSTEM PROMPT
    const systemPrompt = `
    IDENTITY: You are the "Hakeem Engine 2.0". You are a Decolonial Social Systems Engineer.
    
    PROTOCOL:
    1. REJECT FOLKLORIC TERMS: Never use 'Fahl', 'Darwish', 'Fahlawi', 'Hacker', or 'Fadiha' (unless using the defined mapping).
    2. USE APPROVED TERMS: Use 'Al-Hami', 'Al-Dalil', 'Al-Mubtakir'.
    3. VALIDATE BRICOLAGE: Frame 'Hustle' not as instability, but as High Adaptive Capacity.
    4. VALIDATE SANAD: Frame social support networks (Gam'iya, Family) as assets.
    
    ARCHETYPE LIBRARY:
    ${HAKEEM_ARCHETYPES}

    GROUND TRUTH MAPPING:
    ${SPECIALTY_DEFINITIONS}

    ${contextInstruction}
    ${languageInstruction}
    ${targetInstruction}
    ${scarcityInstruction}

    FORMATTING RULES:
    1. 'alert_text': Urgent, immersive.
    2. 'correct_reasoning': Explain WHY this specialty fits, referencing the Hakeem Archetype (e.g., "This requires the pattern recognition of Al-Dalil...").
    
    OUTPUT JSON ONLY.
    `;

    try {
        // MOVED INSIDE TRY BLOCK: Client initialization
        const client = getAiClient();

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Generate a new Hakeem Crisis Scenario.",
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

        let text = response.text;
        if (!text) throw new Error("No response from Hakeem Engine");
        
        // JSON Sanitization (Clean Code Policy)
        // Removes markdown code blocks to ensure pure JSON parsing
        text = text.replace(/```json|```/g, '').trim();
        
        return JSON.parse(text);
    } catch (error) {
        console.error("Hakeem Engine Error:", error);
        
        // Fallback Logic ensures the game can start even if the API fails
        return {
            id: "fallback-001",
            target_id: "IO",
            target_specialty: language === 'ar' ? "علم النفس التنظيمي (المبتكر المرن)" : "I/O Psychology (The Agile Bricoleur)",
            alert_text: language === 'ar' 
                ? "إشارة من شبكة المنطقة: العمال في المصنع عاملين إضراب صامت بسبب نظام الورديات الجديد. الإنتاج واقف والكل مخنوق."
                : "SIGNAL: Silent strike in the factory due to shift rigidity. Production halted. Morale critical.",
            correct_reasoning: language === 'ar'
                ? "هذا يتطلب عقلية 'المبتكر المرن' (Al-Mubtakir) لاستخدام **الذكاء التكيفي (إنك تعرف تتصرف وتغزل برجل حمار)** لإعادة تصميم بيئة العمل."
                : "This requires the 'Agile Bricoleur' (Al-Mubtakir) mindset to apply Adaptive Resource Management and redesign the workflow.",
            learn_more_key: "workforce_data"
        };
    }
};