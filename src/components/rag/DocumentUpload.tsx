import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Loader2 } from 'lucide-react'

import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

export function DocumentUpload() {
    const [uploading, setUploading] = useState(false)
    const { toast } = useToast()

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
            const response = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // request is FormData, so Content-Type is set automatically
                },
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed')
            }

            toast({
                title: 'Success',
                description: `Document processed. ${data.chunks} chunks indexed.`,
            })
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            })
        } finally {
            setUploading(false)
        }
    }, [toast])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'text/plain': ['.txt'],
        },
        maxFiles: 1,
    })

    return (
        <div className="w-full max-w-xl mx-auto mb-8">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-300 hover:border-primary'
                    }`}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-gray-100">
                        {uploading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        ) : (
                            <Upload className="h-8 w-8 text-gray-500" />
                        )}
                    </div>
                    <div>
                        <p className="text-lg font-medium text-gray-900">
                            {uploading ? 'Processing Document...' : 'Upload Knowledge Base'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            Drag & drop PDF or TXT files here, or click to select
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
