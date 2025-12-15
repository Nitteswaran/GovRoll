import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn("Supabase credentials missing in backend.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export const vectorStore = {
    async listDocuments() {
        const { data, error } = await supabase
            .from('documents')
            .select('metadata');

        if (error) throw error;

        // Group by source unique
        const uniqueDocs = new Map();
        data.forEach(row => {
            const source = row.metadata?.source;
            if (source) {
                if (!uniqueDocs.has(source)) {
                    uniqueDocs.set(source, { source, count: 0 });
                }
                uniqueDocs.get(source).count++;
            }
        });

        return Array.from(uniqueDocs.values());
    },

    async deleteDocument(filename: string) {
        const { error } = await supabase
            .from('documents')
            .delete()
            .filter('metadata->>source', 'eq', filename);

        if (error) throw error;
        return true;
    },

    async saveDocument(content: string, metadata: any, embedding: number[]) {
        const { data, error } = await supabase
            .from('documents')
            .insert({
                content,
                metadata,
                embedding
            })
            .select();

        if (error) {
            console.error('Error saving document:', error);
            throw error;
        }
        return data;
    },

    async searchSimilarDocuments(queryEmbedding: number[], matchThreshold = 0.5, matchCount = 5) {
        const { data, error } = await supabase
            .rpc('match_documents', {
                query_embedding: queryEmbedding,
                match_threshold: matchThreshold,
                match_count: matchCount
            });

        if (error) {
            console.error('Error searching documents:', error);
            throw error;
        }
        return data;
    }
};
