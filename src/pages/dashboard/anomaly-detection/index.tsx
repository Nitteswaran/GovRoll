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
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

interface Anomaly {
  id: string
  payroll_run_id: string
  company_id: string
  anomaly_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  affected_employee_id?: string
  detected_at: string
  resolved_at?: string
  resolved_by?: string
  employee?: {
    name: string
  }
  payroll_run?: {
    period: string
  }
}

export function AnomalyDetectionPage() {
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

  const { data: anomalies, isLoading } = useQuery({
    queryKey: ['anomalies', selectedRunId || company?.id],
    queryFn: async () => {
      let query = supabase
        .from('anomaly_detections')
        .select('*, employee:employees(name), payroll_run:payroll_runs(period)')
        .order('detected_at', { ascending: false })

      if (selectedRunId) {
        query = query.eq('payroll_run_id', selectedRunId)
      } else if (company?.id) {
        query = query.eq('company_id', company.id)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []) as Anomaly[]
    },
    enabled: !!(selectedRunId || company?.id),
  })

  const runDetectionMutation = useMutation({
    mutationFn: async (runId: string) => {
      const { data, error } = await supabase.functions.invoke('detect-anomalies', {
        body: { payroll_run_id: runId },
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies'] })
      toast({
        title: 'Success',
        description: 'Anomaly detection completed',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to run detection',
        variant: 'destructive',
      })
    },
  })

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('anomaly_detections')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
        })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies'] })
      toast({
        title: 'Success',
        description: 'Anomaly marked as resolved',
      })
    },
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <FeatureGate feature="anomaly-detection">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-8 w-8" />
              Anomaly Detection
            </h1>
            <p className="text-gray-600 mt-2">
              Detect potential issues in payroll calculations
            </p>
          </div>
          {selectedRunId && (
            <Button
              onClick={() => runDetectionMutation.mutate(selectedRunId)}
              disabled={runDetectionMutation.isPending}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Detection
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Payroll Run</CardTitle>
            <CardDescription>
              Choose a payroll run to analyze
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payrollRuns && payrollRuns.length > 0 ? (
              <div className="space-y-2">
                <Button
                  variant={selectedRunId === null ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setSelectedRunId(null)}
                >
                  All Runs
                </Button>
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

        <Card>
          <CardHeader>
            <CardTitle>Detected Anomalies</CardTitle>
            <CardDescription>
              Review and resolve detected issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : anomalies && anomalies.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anomalies.map((anomaly) => (
                    <TableRow key={anomaly.id}>
                      <TableCell className="font-medium">
                        {anomaly.anomaly_type}
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(anomaly.severity)}>
                          {anomaly.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>{anomaly.description}</TableCell>
                      <TableCell>
                        {anomaly.employee?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {anomaly.resolved_at ? (
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolved
                          </span>
                        ) : (
                          <span className="flex items-center text-orange-600">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Open
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {!anomaly.resolved_at && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resolveMutation.mutate(anomaly.id)}
                          >
                            Mark Resolved
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No anomalies detected. Select a payroll run and run detection.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  )
}

