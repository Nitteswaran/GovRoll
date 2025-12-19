import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);


const PROMPT_DOCUMENT = `
You are a helpful assistant that answers using the provided uploaded documents.
If the answer is not found in the documents, politely say you don't have that information in the uploaded files.

Rules:
1. Answer in a natural, conversational tone.
2. Direct the answer to the user (use "you" or just answer directly).
3. Do not start with "Source: Uploaded Documents".
4. Be concise and accurate.
`;

const PROMPT_GENERAL = `
You are an assistant knowledgeable in Malaysian payroll, HR, and employment compliance law.
Answer accurately based on general knowledge in a natural, helpful tone.

Rules:
1. Answer naturally without stating "Source: ...".
2. If providing legal info, add a small disclaimer at the end that this is not professional legal advice.
`;

export const geminiService = {
    async getEmbedding(text: string) {
        if (!API_KEY) throw new Error("GEMINI_API_KEY is not set");
        const model = genAI.getGenerativeModel({ model: "embedding-001" });
        const result = await model.embedContent(text);
        const embedding = result.embedding;
        return embedding.values;
    },

    async chat(context: string, question: string, mode: 'document' | 'general' = 'document') {
        if (!API_KEY) throw new Error("GEMINI_API_KEY is not set");

        let prompt = "";

        if (mode === 'document') {
            prompt = `
            ${PROMPT_DOCUMENT}

            Context:
            ${context}

            Question:
            ${question}
            `;
        } else {
            prompt = `
            ${PROMPT_GENERAL}

            Question:
            ${question}
            `;
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }
};

