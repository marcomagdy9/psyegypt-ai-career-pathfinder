import { GoogleGenAI, Modality } from "@google/genai";

// Implemented lazy initialization for the AI client.
// This prevents the app from crashing on startup if the API key is not immediately available.
// The client is created only when the first API call is made.
let ai = null;

/**
 * Lazily initializes and returns the GoogleGenAI client instance.
 * Throws an error if the API key is not available in the environment.
 * @returns {GoogleGenAI} The initialized AI client.
 */
const getAiClient = () => {
    if (!ai) {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            // This error will be caught by the calling function's try/catch block,
            // allowing the UI to display a proper error message.
            throw new Error("API Key not found. Please ensure it is configured correctly.");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

/**
 * Generates speech from text using the Gemini TTS model.
 * @param {string} text The input text to convert to speech. The text is lightly cleaned to remove markdown.
 * @returns {Promise<string>} A promise that resolves to the base64 encoded audio data.
 * @throws Will throw an error if the API call fails or returns no audio data.
 */
export const generateSpeech = async (text) => {
    try {
        const client = getAiClient();
        // Simple text cleaning to remove markdown characters that can be read aloud.
        const cleanText = text.replace(/[*#`]/g, '');

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: cleanText }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        // Using a neutral, clear voice for accessibility.
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
