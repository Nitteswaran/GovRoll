import pdf from 'pdf-parse';

// Simple character text splitter
function splitText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
    const chunks: string[] = [];
    let index = 0;

    while (index < text.length) {
        const end = Math.min(index + chunkSize, text.length);
        const chunk = text.slice(index, end);
        chunks.push(chunk);

        // Move forward by chunkSize - overlap
        index += (chunkSize - overlap);
    }

    return chunks;
}

function cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

export const documentProcessor = {
    async processFile(file: Express.Multer.File) {
        console.log(`[DocumentProcessor] Processing file: ${file.originalname}`);
        console.log(`[DocumentProcessor] Mimetype: ${file.mimetype}`);
        console.log(`[DocumentProcessor] Size: ${file.size} bytes`);

        if (file.size === 0) {
            throw new Error('Uploaded file is empty');
        }

        let text = '';

        if (file.mimetype === 'application/pdf') {
            const data = await pdf(file.buffer);
            text = data.text;
        } else if (file.mimetype === 'text/plain' || file.mimetype.includes('text/')) {
            text = file.buffer.toString('utf-8');
        } else {
            // Fallback to extension check
            if (file.originalname.endsWith('.txt')) {
                text = file.buffer.toString('utf-8');
            } else {
                throw new Error(`Unsupported file type: ${file.mimetype}`);
            }
        }

        const cleanedText = cleanText(text);
        console.log(`[DocumentProcessor] Extracted text length: ${text.length}`);
        console.log(`[DocumentProcessor] Cleaned text length: ${cleanedText.length}`);

        if (cleanedText.length === 0) {
            throw new Error('Could not extract text from file. The file might be empty or contain only images (scanned PDF).');
        }

        const chunks = splitText(cleanedText);

        return chunks.map((chunk, index) => ({
            content: chunk,
            metadata: {
                source: file.originalname,
                chunkIndex: index
            }
        }));
    }
};
