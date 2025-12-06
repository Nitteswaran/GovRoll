import { useState } from 'react'
import { FeatureGate } from '@/hooks/use-feature-gate'
import { useCompanyStore } from '@/store/company-store'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Calendar, Play, Pause, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

interface ScheduledPayroll {
  id: string
  company_id: string
  run_month: string
  day_of_month: number
  auto_generate_files: boolean
  auto_send_payslips: boolean
  status: 'active' | 'paused' | 'completed'
  last_run_at?: string
  next_run_at?: string
}

export function ScheduledPayrollPage() {
  const { company } = useCompanyStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    run_month: '',
    day_of_month: 25,
    auto_generate_files: true,
    auto_send_payslips: false,
  })

  const { data: scheduledPayrolls, isLoading } = useQuery({
    queryKey: ['scheduled-payrolls', company?.id],
    queryFn: async () => {
      if (!company?.id) return []
      const { data, error } = await supabase
        .from('scheduled_payrolls')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as ScheduledPayroll[]
    },
    enabled: !!company?.id,
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const nextRun = calculateNextRun(data.day_of_month)
      const { data: scheduled, error } = await supabase
        .from('scheduled_payrolls')
        .insert({
          company_id: company?.id,
          ...data,
          status: 'active',
          next_run_at: nextRun.toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return scheduled
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-payrolls'] })
      setDialogOpen(false)
      toast({
        title: 'Success',
        description: 'Scheduled payroll created successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create scheduled payroll',
        variant: 'destructive',
      })
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('scheduled_payrolls')
        .update({ status })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-payrolls'] })
      toast({
        title: 'Success',
        description: 'Schedule updated successfully',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_payrolls')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-payrolls'] })
      toast({
        title: 'Success',
        description: 'Scheduled payroll deleted',
      })
    },
  })

  function calculateNextRun(dayOfMonth: number): Date {
    const now = new Date()
    const nextRun = new Date(now.getFullYear(), now.getMonth(), dayOfMonth)
    if (nextRun < now) {
      nextRun.setMonth(nextRun.getMonth() + 1)
    }
    return nextRun
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  return (
    <FeatureGate feature="scheduled-payroll">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              Scheduled Payroll
            </h1>
            <p className="text-gray-600 mt-2">
              Automatically generate payroll runs on a schedule
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Schedule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Scheduled Payroll</DialogTitle>
                <DialogDescription>
                  Set up automatic payroll generation
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="run_month">Run Month Pattern</Label>
                  <Input
                    id="run_month"
                    value={formData.run_month}
                    onChange={(e) =>
                      setFormData({ ...formData, run_month: e.target.value })
                    }
                    placeholder="January, February, March..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="day_of_month">Day of Month</Label>
                  <Input
                    id="day_of_month"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.day_of_month}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        day_of_month: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.auto_generate_files}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          auto_generate_files: e.target.checked,
                        })
                      }
                    />
                    <span>Auto-generate compliance files</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.auto_send_payslips}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          auto_send_payslips: e.target.checked,
                        })
                      }
                    />
                    <span>Auto-send payslips via email</span>
                  </label>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : scheduledPayrolls && scheduledPayrolls.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Run Month</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledPayrolls.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">
                        {schedule.run_month}
                      </TableCell>
                      <TableCell>Day {schedule.day_of_month}</TableCell>
                      <TableCell>
                        {schedule.next_run_at
                          ? new Date(schedule.next_run_at).toLocaleDateString()
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            schedule.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {schedule.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                id: schedule.id,
                                status:
                                  schedule.status === 'active'
                                    ? 'paused'
                                    : 'active',
                              })
                            }
                          >
                            {schedule.status === 'active' ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (
                                confirm(
                                  'Are you sure you want to delete this schedule?'
                                )
                              ) {
                                deleteMutation.mutate(schedule.id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No scheduled payrolls yet. Create one to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  )
}

