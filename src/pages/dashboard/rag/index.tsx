import { DocumentUpload } from '@/components/rag/DocumentUpload'
import { ChatInterface } from '@/components/rag/ChatInterface'
import { DocumentList } from '@/components/rag/DocumentList'

export default function RagChatPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">RAG Knowledge Base</h1>
                <p className="text-muted-foreground">
                    Upload documents and chat with your custom knowledge base using AI.
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <DocumentUpload />
                    <h2 className="text-2xl font-semibold tracking-tight">Chat with Documents</h2>
                    <ChatInterface />
                </div>
                <div>
                    <DocumentList />
                </div>
            </div>
        </div>
    )
}
