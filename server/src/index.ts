import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { documentProcessor } from './services/documentProcessor';
import { geminiService } from './services/gemini';
import { vectorStore } from './services/vectorStore';
import { authMiddleware, AuthenticatedRequest } from './middleware/auth';
import { usageService } from './services/usage';

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
// @ts-ignore
app.post('/api/upload', authMiddleware, upload.single('file'), async (req: AuthenticatedRequest, res: express.Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // COST PROTECTION: Check limits before processing
        const usageCheck = await usageService.checkUsage(req.user.id, 'upload_count');
        if (!usageCheck.allowed) {
            return res.status(403).json({ error: usageCheck.message });
        }

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
            const saved = await vectorStore.saveDocument(chunk.content, chunk.metadata, embedding, req.user.id);
            savedChunks.push(saved);
        }

        // Increment usage after successful processing
        await usageService.incrementUsage(req.user.id, 'upload_count');

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
// @ts-ignore
app.post('/api/chat', authMiddleware, async (req: AuthenticatedRequest, res: express.Response) => {
    try {
        const { question } = req.body;

        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        // COST PROTECTION: Check limits before Gemini calls
        const usageCheck = await usageService.checkUsage(req.user.id, 'message_count');
        if (!usageCheck.allowed) {
            // Return upgrade message as the "answer" so the UI displays it cleanly
            return res.json({ answer: usageCheck.message });
        }

        // 1. Generate embedding for the question
        const queryEmbedding = await geminiService.getEmbedding(question);

        // 2. Search for relevant documents
        // Using 0.4 as threshold to decide between document vs general knowledge
        const relevantDocs = await vectorStore.searchSimilarDocuments(queryEmbedding, 0.4, 5, req.user.id);

        // 3. Routing Logic
        // Check if we have any documents that met the similarity threshold
        const hasRelevantDocs = relevantDocs && relevantDocs.length > 0;

        let answer = '';
        let context = null;

        if (hasRelevantDocs) {
            // 3a. Document Mode
            context = relevantDocs.map((doc: any) => doc.content).join('\n\n');
            answer = await geminiService.chat(context, question, 'document');
        } else {
            // 3b. General Knowledge Mode
            answer = await geminiService.chat('', question, 'general');
        }

        // Increment usage after successful generation
        await usageService.incrementUsage(req.user.id, 'message_count');

        res.json({ answer, context });
    } catch (error: any) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error.message });
    }
});

// List Documents Endpoint
// @ts-ignore
app.get('/api/documents', authMiddleware, async (req: AuthenticatedRequest, res: express.Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const documents = await vectorStore.listDocuments(req.user.id);
        res.json(documents);
    } catch (error: any) {
        console.error('List documents error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete Document Endpoint
// @ts-ignore
app.delete('/api/documents/:filename', authMiddleware, async (req: AuthenticatedRequest, res: express.Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { filename } = req.params;
        await vectorStore.deleteDocument(filename, req.user.id);
        res.json({ message: 'Document deleted successfully' });
    } catch (error: any) {
        console.error('Delete document error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
