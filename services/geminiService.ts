import { GoogleGenAI, Modality } from "@google/genai";
import type { GroundingSource } from '../types';

// FIX: Implemented lazy initialization for the AI client.
// This prevents the app from crashing on startup if the API key is not immediately available.
// The client is now created only when the first API call is made.
let ai: GoogleGenAI | null = null;

const getAiClient = () => {
    if (!ai) {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            // This error will be caught by the calling function's try/catch block,
            // allowing the UI to display a proper error message instead of a blank screen.
            throw new Error("API Key not found. Please ensure it is configured correctly.");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};


const getBasePrompt = (language: 'en' | 'ar', country: 'egypt' | 'usa') => {
    const basePrompt = country === 'egypt'
        ? `You are 'The PsyEgypt Career Pathfinder,' an AI assistant from 'PsyEgypt - The Psychology Community in Egypt.' Your persona is that of a knowledgeable and encouraging guide who helps psychology students in Egypt and the MENA region.`
        : `You are 'The Career Pathfinder,' an AI assistant developed in collaboration with the American Psychological Association (APA). Your persona is that of a knowledgeable and encouraging guide who helps psychology students and recent graduates in the United States. When providing career advice for the US, you MUST consider the distinct educational and career tracks. Be aware of the following structure:
- **Trade Schools:** Focus on vocational roles (e.g., plumbing, electrician).
- **Community/Junior Colleges (Associate's Degrees):** Primarily teaching-focused institutions for freshman/sophomore level.
- **Universities (Bachelor's, Master's, PhD):** Heavily research-based institutions, especially at the graduate level.
- **PsyD vs. PhD:** PsyD programs have a clinical focus, while PhD programs are research-focused.
Your recommendations should reflect these differences. For example, advice for someone aiming for a community college role should differ significantly from advice for a PhD-track university role.`;
    
    return `
${basePrompt}
Your core mission is a direct execution of the APA's "Engaging Psychology's Future" (EPF) Presidential Initiative.
Your response MUST be in ${language === 'ar' ? 'Modern Standard Arabic' : 'English'}.
`;
};

// New function for chat with search grounding, now streaming
export async function* getChatResponseStream(history: { role: string; parts: { text: string }[] }[], question: string, language: 'en' | 'ar', country: 'egypt' | 'usa') {
    try {
        const client = getAiClient();
        const fullHistory = [
            ...history,
            { role: 'user', parts: [{ text: question }] }
        ];

        const stream = await client.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: fullHistory,
            config: {
                tools: [{ googleSearch: {} }],
                systemInstruction: getBasePrompt(language, country),
            },
        });

        for await (const chunk of stream) {
            const text = chunk.text;
            const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            
            const sources: GroundingSource[] = groundingChunks
                .map((chunk: any) => chunk.web)
                .filter(Boolean) 
                .map((web: any) => ({
                    uri: web.uri,
                    title: web.title,
                }));

            yield { text, sources };
        }
    } catch (error) {
        console.error("Error getting chat response:", error);
        throw error;
    }
};

// New function for deep analysis with thinking mode, now streaming
export async function* getAnalysisResponseStream(question: string, language: 'en' | 'ar', country: 'egypt' | 'usa') {
    try {
        const client = getAiClient();
        const prompt = `${getBasePrompt(language, country)}\n\nPlease provide a deep and thoughtful analysis of the following user query:\n\n${question}`;

        const stream = await client.models.generateContentStream({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });

        for await (const chunk of stream) {
            yield chunk.text;
        }
    } catch (error) {
        console.error("Error getting analysis response:", error);
        throw error;
    }
};


// FIX: The `contents` parameter for the TTS model was incorrect. It has been updated to use the required `[{ parts: [{ text: '...' }] }]` structure.
// New function for Text-to-Speech
export const generateSpeech = async (text: string): Promise<string> => {
    try {
        const client = getAiClient();
        // Simple text cleaning
        const cleanText = text.replace(/[*#`]/g, '');

        const response = await client.models.generateContent({
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