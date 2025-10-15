import { env } from '$env/dynamic/private';
import { GoogleGenAI } from '@google/genai';

export function hasGemini(overrideKey) {
    return Boolean(overrideKey || env.GEMINI_API_KEY);
}

export async function geminiGenerate({ contents, systemPrompt = '', config ={} }) {
    try {
        const key = env.GEMINI_API_KEY;
        if (!key) throw new Error('GEMINI_API_KEY not set');

        // Validate inputs
        if (!Array.isArray(contents)) {
            throw new Error('Contents must be an array');
        }

        const ai = new GoogleGenAI({ apiKey: key });
        if (systemPrompt) {
            config.systemInstruction = { role: 'model', parts: [{ text: systemPrompt }] };
        }

        const request = {
            model: 'gemini-2.5-flash',
            contents: contents,
            config: config
        };

        const response = await ai.models.generateContent(request);
        
        // Validate response structure
        if (!response) {
            throw new Error('Empty response from Gemini API');
        }

        const text = typeof response?.text === 'string' ? response.text : '';
        
        // Check for common error patterns in the response
        if (!text || text.trim().length === 0) {
            throw new Error('Empty text response from Gemini API');
        }

        return { text, raw: response };
    } catch (error) {
        console.error('Gemini API error:', error);
        
        // Re-throw with more context
        if (error.message.includes('GEMINI_API_KEY')) {
            throw new Error('Gemini API key not configured');
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
            throw new Error('Gemini API quota exceeded');
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
            throw new Error('Network error connecting to Gemini API');
        } else {
            throw new Error(`Gemini API error: ${error.message}`);
        }
    }
}



