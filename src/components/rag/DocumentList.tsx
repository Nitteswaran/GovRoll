import { useEffect, useState } from 'react'
import { FileText, Trash2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface Document {
    source: string
    count: number
}

export function DocumentList() {
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const fetchDocuments = async () => {
        setLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
            const response = await fetch(`${API_URL}/api/documents`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (!response.ok) throw new Error('Failed to fetch documents')
            const data = await response.json()
            setDocuments(data)
        } catch (error) {
            console.error('Error fetching documents:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDocuments()
    }, [])

    const handleDelete = async (filename: string) => {
        if (!confirm(`Are you sure you want to delete ${filename}?`)) return

        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
            const response = await fetch(`${API_URL}/api/documents/${encodeURIComponent(filename)}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) throw new Error('Failed to delete document')

            toast({
                title: 'Success',
                description: 'Document deleted successfully',
            })
            fetchDocuments()
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete document',
                variant: 'destructive',
            })
        }
    }

    return (
        <div className="border rounded-lg bg-white shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-500" />
                    Indexed Documents
                </h3>
                <Button variant="ghost" size="sm" onClick={fetchDocuments} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                    No documents indexed yet. Upload one above.
                </div>
            ) : (
                <div className="space-y-2">
                    {documents.map((doc) => (
                        <div
                            key={doc.source}
                            className="flex items-center justify-between p-3 rounded-md bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="bg-white p-2 rounded-md border text-xs font-mono text-gray-400">
                                    {doc.source.split('.').pop()?.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-sm truncate text-gray-900" title={doc.source}>
                                        {doc.source}
                                    </p>
                                    <p className="text-xs text-gray-500">{doc.count} chunks</p>
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                                onClick={() => handleDelete(doc.source)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
