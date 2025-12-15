import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);


const PROMPT_DOCUMENT = `
You are an assistant that answers ONLY using the provided uploaded documents.
If the answer is not found in the documents, say you cannot find it.

Rules:
1. Start your response with "Source: Uploaded Documents".
2. Never hallucinate document content.
3. Be concise and accurate.
`;

const PROMPT_GENERAL = `
You are an assistant knowledgeable in Malaysian payroll, HR, and employment compliance law.
Answer accurately based on general knowledge.
If unsure, say so. Include a legal disclaimer.

Rules:
1. Start your response with "Source: General Malaysian Compliance Knowledge".
2. Include a legal disclaimer that this is not professional legal advice.
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

