import { useState } from 'react'
import { FeatureGate } from '@/hooks/use-feature-gate'
import { useCompanyStore } from '@/store/company-store'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Mail, Send, Eye, CheckCircle, XCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useParams } from 'react-router-dom'

export function BulkPayslipsPage() {
  const { company } = useCompanyStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)

  const { data: payrollRuns } = useQuery({
    queryKey: ['payroll-runs', company?.id],
    queryFn: async () => {
      if (!company?.id) return []
      const { data, error } = await supabase
        .from('payroll_runs')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data
    },
    enabled: !!company?.id,
  })

  const { data: payrollItems } = useQuery({
    queryKey: ['payroll-items-bulk', selectedRunId],
    queryFn: async () => {
      if (!selectedRunId) return []
      const { data, error } = await supabase
        .from('payroll_items')
        .select('*, employee:employees(*)')
        .eq('payroll_run_id', selectedRunId)

      if (error) throw error
      return data
    },
    enabled: !!selectedRunId,
  })

  const sendBulkMutation = useMutation({
    mutationFn: async (runId: string) => {
      // Call Edge Function to send bulk payslips
      const { data, error } = await supabase.functions.invoke('send-bulk-payslips', {
        body: { payroll_run_id: runId },
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-notifications'] })
      toast({
        title: 'Success',
        description: 'Bulk payslips are being sent',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send payslips',
        variant: 'destructive',
      })
    },
  })

  return (
    <FeatureGate feature="bulk-payslips">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8" />
            Bulk Payslip Distribution
          </h1>
          <p className="text-gray-600 mt-2">
            Generate and send payslips to all employees via email
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Payroll Run</CardTitle>
            <CardDescription>
              Choose a payroll run to send payslips for
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payrollRuns && payrollRuns.length > 0 ? (
              <div className="space-y-2">
                {payrollRuns.map((run: any) => (
                  <Button
                    key={run.id}
                    variant={selectedRunId === run.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setSelectedRunId(run.id)}
                  >
                    {run.period} - {run.status}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No payroll runs available
              </p>
            )}
          </CardContent>
        </Card>

        {selectedRunId && payrollItems && (
          <Card>
            <CardHeader>
              <CardTitle>Preview & Send</CardTitle>
              <CardDescription>
                Review the payslips before sending
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {payrollItems.length} employees will receive payslips
                  </p>
                  <Button
                    onClick={() => sendBulkMutation.mutate(selectedRunId)}
                    disabled={sendBulkMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendBulkMutation.isPending
                      ? 'Sending...'
                      : 'Send All Payslips'}
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollItems.map((item: any) => {
                      if (!item.employee) return null
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.employee.name}
                          </TableCell>
                          <TableCell>
                            {item.employee.email || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded text-xs bg-gray-100">
                              Pending
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </FeatureGate>
  )
}

