import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export function EmployeeDocuments() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Documents</h1>
        <p className="text-gray-600">Access your employment contracts and company policies</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Documents</CardTitle>
          <CardDescription>
            Official documents shared by your employer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No documents yet</h3>
            <p className="text-gray-500 max-w-sm mt-2">
              There are no documents available for you to view at this time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
