import { FeatureGate } from '@/hooks/use-feature-gate'
import { useCompanyStore } from '@/store/company-store'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { History, User } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

interface AuditLog {
  id: string
  company_id: string
  user_id: string
  action: string
  entity_type: string
  entity_id?: string
  old_values?: any
  new_values?: any
  created_at: string
  user?: {
    email: string
  }
}

export function AuditLogsPage() {
  const { company } = useCompanyStore()
  const [filter, setFilter] = useState('')

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', company?.id, filter],
    queryFn: async () => {
      if (!company?.id) return []

      let query = supabase
        .from('audit_logs')
        .select('*, user:users(email)')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (filter) {
        query = query.or(`action.ilike.%${filter}%,entity_type.ilike.%${filter}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []) as AuditLog[]
    },
    enabled: !!company?.id,
  })

  return (
    <FeatureGate feature="audit-logs">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="h-8 w-8" />
            Audit Logs
          </h1>
          <p className="text-gray-600 mt-2">
            View complete history of all changes and actions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              Complete audit trail of all system activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label htmlFor="filter">Search</Label>
              <Input
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search by action or entity type..."
              />
            </div>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : logs && logs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Changes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>{log.user?.email || 'System'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.action}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded text-xs bg-gray-100">
                          {log.entity_type}
                        </span>
                      </TableCell>
                      <TableCell>
                        {log.old_values || log.new_values ? (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-primary">
                              View Changes
                            </summary>
                            <div className="mt-2 space-y-1">
                              {log.old_values && (
                                <div>
                                  <strong>Old:</strong>{' '}
                                  <pre className="inline">
                                    {JSON.stringify(log.old_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.new_values && (
                                <div>
                                  <strong>New:</strong>{' '}
                                  <pre className="inline">
                                    {JSON.stringify(log.new_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </details>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No audit logs found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  )
}

