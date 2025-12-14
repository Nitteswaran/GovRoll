import { useState } from 'react'
import { FeatureGate } from '@/hooks/use-feature-gate'
import { useCompanyStore } from '@/store/company-store'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
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
import { Plus, Zap, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import RippleWaveLoader from '@/components/ui/ripple-wave-loader'

interface AutomationRule {
  id: string
  company_id: string
  rule_type: 'overtime' | 'bonus' | 'allowance' | 'deduction'
  rule_name: string
  conditions: any
  actions: any
  is_active: boolean
}

export function AutomationPage() {
  const { company } = useCompanyStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    rule_type: 'overtime' as 'overtime' | 'bonus' | 'allowance' | 'deduction',
    rule_name: '',
    conditions: {},
    actions: {},
  })

  const { data: rules, isLoading } = useQuery({
    queryKey: ['automation-rules', company?.id],
    queryFn: async () => {
      if (!company?.id) return []
      const { data, error } = await supabase
        .from('payroll_automation_rules')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as AutomationRule[]
    },
    enabled: !!company?.id,
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: rule, error } = await supabase
        .from('payroll_automation_rules')
        .insert({
          company_id: company?.id,
          ...data,
        })
        .select()
        .single()

      if (error) throw error
      return rule
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] })
      setDialogOpen(false)
      setFormData({
        rule_type: 'overtime',
        rule_name: '',
        conditions: {},
        actions: {},
      })
      toast({
        title: 'Success',
        description: 'Automation rule created successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create rule',
        variant: 'destructive',
      })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('payroll_automation_rules')
        .update({ is_active: isActive })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payroll_automation_rules')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] })
      toast({
        title: 'Success',
        description: 'Rule deleted successfully',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  return (
    <FeatureGate feature="automation-rules">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Zap className="h-8 w-8" />
              Automation Rules
            </h1>
            <p className="text-gray-600 mt-2">
              Configure automatic overtime, bonus, and allowance rules
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Automation Rule</DialogTitle>
                <DialogDescription>
                  Set up rules to automatically calculate payroll items
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rule_type">Rule Type</Label>
                  <select
                    id="rule_type"
                    value={formData.rule_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rule_type: e.target.value as any,
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="overtime">Overtime</option>
                    <option value="bonus">Bonus</option>
                    <option value="allowance">Allowance</option>
                    <option value="deduction">Deduction</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rule_name">Rule Name *</Label>
                  <Input
                    id="rule_name"
                    value={formData.rule_name}
                    onChange={(e) =>
                      setFormData({ ...formData, rule_name: e.target.value })
                    }
                    required
                    placeholder="e.g., Weekend Overtime 1.5x"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conditions (JSON)</Label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={JSON.stringify(formData.conditions, null, 2)}
                    onChange={(e) => {
                      try {
                        setFormData({
                          ...formData,
                          conditions: JSON.parse(e.target.value),
                        })
                      } catch { }
                    }}
                    placeholder='{"hours": ">40", "day": "weekend"}'
                  />
                </div>
                <div className="space-y-2">
                  <Label>Actions (JSON)</Label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={JSON.stringify(formData.actions, null, 2)}
                    onChange={(e) => {
                      try {
                        setFormData({
                          ...formData,
                          actions: JSON.parse(e.target.value),
                        })
                      } catch { }
                    }}
                    placeholder='{"multiplier": 1.5, "base_rate": "hourly"}'
                  />
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
                    {createMutation.isPending ? 'Creating...' : 'Create Rule'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <RippleWaveLoader />
              </div>
            ) : rules && rules.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">
                        {rule.rule_name}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded text-xs bg-gray-100">
                          {rule.rule_type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            toggleMutation.mutate({
                              id: rule.id,
                              isActive: !rule.is_active,
                            })
                          }
                        >
                          {rule.is_active ? (
                            <ToggleRight className="h-5 w-5 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-gray-400" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (
                              confirm(
                                'Are you sure you want to delete this rule?'
                              )
                            ) {
                              deleteMutation.mutate(rule.id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No automation rules yet. Create one to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  )
}

