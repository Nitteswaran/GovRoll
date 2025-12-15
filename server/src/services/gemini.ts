import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

export const geminiService = {
    async getEmbedding(text: string) {
        if (!API_KEY) throw new Error("GEMINI_API_KEY is not set");
        const model = genAI.getGenerativeModel({ model: "embedding-001" });
        const result = await model.embedContent(text);
        const embedding = result.embedding;
        return embedding.values;
    },

    async chat(context: string, question: string) {
        if (!API_KEY) throw new Error("GEMINI_API_KEY is not set");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `
      You are a helpful assistant for the GovRoll application.
      Use the following context to answer the user's question.
      If the answer is not found in the context, respond exactly with: "I cannot find this information in the uploaded documents."
      
      Context:
      ${context}

      Question:
      ${question}
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }
};
