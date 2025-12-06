import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

interface Employee {
  id: string
  company_id: string
  name: string
  ic_number: string
  bank_name: string
  bank_account: string
  base_salary: number
  allowance: number
  epf_rate_employee: number
  epf_rate_employer: number
  socso_category: string
  pcb_category: string
  created_at: string
}

export function EmployeesPage() {
  const navigate = useNavigate()
  const { company } = useCompanyStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    ic_number: '',
    bank_name: '',
    bank_account: '',
    base_salary: '',
    allowance: '',
    epf_rate_employee: '11',
    epf_rate_employer: '12',
    socso_category: '1',
    pcb_category: '1',
  })

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees', company?.id],
    queryFn: async () => {
      if (!company?.id) return []
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Employee[]
    },
    enabled: !!company?.id,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employees').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast({
        title: 'Success',
        description: 'Employee deleted successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete employee',
        variant: 'destructive',
      })
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingEmployee) {
        const { error } = await supabase
          .from('employees')
          .update(data)
          .eq('id', editingEmployee.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('employees').insert({
          company_id: company?.id,
          ...data,
        })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setDialogOpen(false)
      resetForm()
      toast({
        title: 'Success',
        description: editingEmployee
          ? 'Employee updated successfully'
          : 'Employee created successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save employee',
        variant: 'destructive',
      })
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      ic_number: '',
      bank_name: '',
      bank_account: '',
      base_salary: '',
      allowance: '',
      epf_rate_employee: '11',
      epf_rate_employer: '12',
      socso_category: '1',
      pcb_category: '1',
    })
    setEditingEmployee(null)
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      name: employee.name,
      ic_number: employee.ic_number,
      bank_name: employee.bank_name,
      bank_account: employee.bank_account,
      base_salary: employee.base_salary.toString(),
      allowance: employee.allowance.toString(),
      epf_rate_employee: employee.epf_rate_employee.toString(),
      epf_rate_employer: employee.epf_rate_employer.toString(),
      socso_category: employee.socso_category,
      pcb_category: employee.pcb_category,
    })
    setDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate({
      name: formData.name,
      ic_number: formData.ic_number,
      bank_name: formData.bank_name,
      bank_account: formData.bank_account,
      base_salary: parseFloat(formData.base_salary),
      allowance: parseFloat(formData.allowance),
      epf_rate_employee: parseInt(formData.epf_rate_employee),
      epf_rate_employer: parseInt(formData.epf_rate_employer),
      socso_category: formData.socso_category,
      pcb_category: formData.pcb_category,
    })
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="pt-6">
            <p>Please create a company profile first</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-gray-600 mt-2">Manage your employees</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? 'Edit Employee' : 'Add Employee'}
              </DialogTitle>
              <DialogDescription>
                Enter employee information for payroll processing
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ic_number">IC Number *</Label>
                  <Input
                    id="ic_number"
                    value={formData.ic_number}
                    onChange={(e) =>
                      setFormData({ ...formData, ic_number: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <Label htmlFor="bank_name">Bank Name *</Label>
                    <Input
                      id="bank_name"
                      value={formData.bank_name}
                      onChange={(e) =>
                        setFormData({ ...formData, bank_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bank_account">Bank Account *</Label>
                    <Input
                      id="bank_account"
                      value={formData.bank_account}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bank_account: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <Label htmlFor="base_salary">Base Salary (RM) *</Label>
                    <Input
                      id="base_salary"
                      type="number"
                      step="0.01"
                      value={formData.base_salary}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          base_salary: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="allowance">Allowance (RM) *</Label>
                    <Input
                      id="allowance"
                      type="number"
                      step="0.01"
                      value={formData.allowance}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          allowance: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <Label htmlFor="epf_rate_employee">EPF Rate Employee (%)</Label>
                    <Input
                      id="epf_rate_employee"
                      type="number"
                      value={formData.epf_rate_employee}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          epf_rate_employee: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="epf_rate_employer">EPF Rate Employer (%)</Label>
                    <Input
                      id="epf_rate_employer"
                      type="number"
                      value={formData.epf_rate_employer}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          epf_rate_employer: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <Label htmlFor="socso_category">SOCSO Category</Label>
                    <Input
                      id="socso_category"
                      value={formData.socso_category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socso_category: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="pcb_category">PCB Category</Label>
                    <Input
                      id="pcb_category"
                      value={formData.pcb_category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pcb_category: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending
                    ? 'Saving...'
                    : editingEmployee
                    ? 'Update'
                    : 'Create'}
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
          ) : employees && employees.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>IC Number</TableHead>
                  <TableHead>Base Salary</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.ic_number}</TableCell>
                    <TableCell>RM {employee.base_salary.toFixed(2)}</TableCell>
                    <TableCell>
                      {employee.bank_name} - {employee.bank_account}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(employee)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (
                              confirm(
                                'Are you sure you want to delete this employee?'
                              )
                            ) {
                              deleteMutation.mutate(employee.id)
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
              No employees yet. Add your first employee to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

