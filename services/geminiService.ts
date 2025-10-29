
import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const getBasePrompt = (language: 'en' | 'ar') => `
You are 'The PsyEgypt Career Pathfinder,' an AI assistant from 'PsyEgypt - The Psychology Community in Egypt.' Your persona is that of a knowledgeable and encouraging guide who helps psychology students in Egypt and the MENA region.
Your core mission is a direct execution of the APA's "Engaging Psychology's Future" (EPF) Presidential Initiative.
Your response MUST be in ${language === 'ar' ? 'Modern Standard Arabic' : 'English'}.
`;

export const getPersonalizedGreeting = async (challenge: string, language: 'en' | 'ar'): Promise<string> => {
    try {
        const exampleEn = `
        Example 1 (challenge):
        User's input: "I'm in my final year and I love research but I'm worried I won't get into a good Master's program."
        Your response: "Thank you for sharing that. It's completely understandable to have concerns when you're aiming for a competitive Master's program. We can definitely explore ways to strengthen your application and build your confidence."

        Example 2 (neutral question):
        User's input: "What are the main career paths in psychology?"
        Your response: "That's an excellent question. Understanding the primary career paths is a great first step, and I can certainly help you explore the main options available to psychology graduates."
        
        Example 3 (goal statement):
        User's input: "I want to become a clinical psychologist in a hospital setting."
        Your response: "That's a fantastic and ambitious goal! Working in a hospital setting is a very impactful path. I can certainly provide you with information on the steps, skills, and qualifications you'll need to achieve that."
        `;
        const exampleAr = `
        مثال 1 (تحدي):
        إدخال المستخدم: "أنا في سنتي الأخيرة وأحب البحث ولكني قلق من عدم قبولي في برنامج ماجستير جيد."
        ردك: "شكراً لمشاركتنا هذا. من المفهوم تماماً أن تكون لديك مخاوف عند استهداف برنامج ماجستير تنافسي. يمكننا بالتأكيد استكشاف طرق لتعزيز طلبك وبناء ثقتك."

        مثال 2 (سؤال محايد):
        إدخال المستخدم: "ما هي المسارات المهنية الرئيسية في علم النفس؟"
        ردك: "هذا سؤال ممتاز. فهم المسارات المهنية الرئيسية هو خطوة أولى رائعة، ويمكنني بالتأكيد مساعدتك في استكشاف الخيارات الرئيسية المتاحة لخريجي علم النفس."

        مثال 3 (تحديد هدف):
        إدخال المستخدم: "أريد أن أصبح أخصائيًا نفسيًا إكلينيكيًا في مستشفى."
        ردك: "هذا هدف رائع وطموح! العمل في بيئة المستشفى هو مسار مؤثر للغاية. يمكنني بالتأكيد تزويدك بالمعلومات حول الخطوات والمهارات والمؤهلات التي ستحتاجها لتحقيق ذلك."
        `;
        const prompt = `
        ${getBasePrompt(language)}

        A user has just shared their biggest challenge or question with you.
        User's input: "${challenge}"

        Your task is to generate a short (2-3 sentences), personalized first response that PERFECTLY matches the user's emotional tone.
        - **Tone Detection is CRITICAL.** Analyze the user's input to classify it.
        - If the input is a **Challenge** (e.g., expressing worry, fear, concern), your tone MUST be supportive and empathetic.
        - If the input is a **Neutral Question** (e.g., "what are the paths..."), your tone MUST be professional and informative.
        - If the input is a **Goal Statement** (e.g., "I want to become..."), your tone MUST be encouraging and motivating.
        - Your response must be concise and seamlessly transition into offering help.

        ${language === 'ar' ? exampleAr : exampleEn}

        Now, generate a response for the user's input provided above.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error generating personalized greeting:", error);
        // Re-throw the error to be handled by the UI component
        throw error;
    }
};

// New function for chat with search grounding
export const getChatResponse = async (history: { role: string; parts: { text: string }[] }[], question: string, language: 'en' | 'ar') => {
    try {
        const fullHistory = [
            ...history,
            { role: 'user', parts: [{ text: question }] }
        ];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullHistory,
            config: {
                tools: [{ googleSearch: {} }],
                systemInstruction: getBasePrompt(language),
            },
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = groundingChunks
            .map((chunk: any) => chunk.web)
            .filter(Boolean) // Filter out any non-web chunks
            .map((web: any) => ({
                uri: web.uri,
                title: web.title,
            }));

        return { text: response.text, sources };
    } catch (error) {
        console.error("Error getting chat response:", error);
        throw error;
    }
};

// New function for deep analysis with thinking mode
export const getAnalysisResponse = async (question: string, language: 'en' | 'ar'): Promise<string> => {
    try {
        const prompt = `${getBasePrompt(language)}\n\nPlease provide a deep and thoughtful analysis of the following user query:\n\n${question}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });

        return response.text;
    } catch (error) {
        console.error("Error getting analysis response:", error);
        throw error;
    }
};


// FIX: The `contents` parameter for the TTS model was incorrect. It has been updated to use the required `[{ parts: [{ text: '...' }] }]` structure.
// New function for Text-to-Speech
export const generateSpeech = async (text: string): Promise<string> => {
    try {
        // Simple text cleaning
        const cleanText = text.replace(/[*#`]/g, '');

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: cleanText }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        // Using a neutral voice
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data returned from API.");
        }
        return base64Audio;

    } catch (error) {
        console.error("Error generating speech:", error);
        throw error;
    }
};
