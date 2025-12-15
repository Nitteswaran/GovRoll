import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { documentProcessor } from './services/documentProcessor';
import { geminiService } from './services/gemini';
import { vectorStore } from './services/vectorStore';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// File upload setup (memory storage for processing)
const upload = multer({ storage: multer.memoryStorage() });

// Routes
app.get('/health', (req, res) => {
    res.send('RAG Backend is running');
});

// Upload Document Endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // 1. Process and chunk the document
        const chunks = await documentProcessor.processFile(req.file);
        console.log(`Processed ${chunks.length} chunks from ${req.file.originalname}`);

        // 2. Generate embeddings and save to vector store
        const savedChunks = [];
        for (const chunk of chunks) {
            const embedding = await geminiService.getEmbedding(chunk.content);
            const saved = await vectorStore.saveDocument(chunk.content, chunk.metadata, embedding);
            savedChunks.push(saved);
        }

        res.json({
            message: 'Document processed and indexed successfully',
            chunks: savedChunks.length
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Chat Endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        // 1. Generate embedding for the question
        const queryEmbedding = await geminiService.getEmbedding(question);

        // 2. Search for relevant documents
        const relevantDocs = await vectorStore.searchSimilarDocuments(queryEmbedding);

        // 3. Construct context
        const context = relevantDocs?.map((doc: any) => doc.content).join('\n\n') || '';

        if (!context) {
            return res.json({ answer: "I cannot find this information in the uploaded documents." });
        }

        // 4. Generate answer using Gemini
        const answer = await geminiService.chat(context, question);

        res.json({ answer, context }); // sending context back for debugging/transparency if needed
    } catch (error: any) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error.message });
    }
});

// List Documents Endpoint
app.get('/api/documents', async (req, res) => {
    try {
        const documents = await vectorStore.listDocuments();
        res.json(documents);
    } catch (error: any) {
        console.error('List documents error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete Document Endpoint
app.delete('/api/documents/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        await vectorStore.deleteDocument(filename);
        res.json({ message: 'Document deleted successfully' });
    } catch (error: any) {
        console.error('Delete document error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
