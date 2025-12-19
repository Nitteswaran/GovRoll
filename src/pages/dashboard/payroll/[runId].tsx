import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
import { ArrowLeft, Plus, Download, FileText } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { netPay } from '@/lib/payroll-calculator'
import { generateEPFFile, amountToCents } from '@/lib/file-generators/epf-generator'
import { generateSOCSOFile } from '@/lib/file-generators/socso-generator'
import { generatePCBFile } from '@/lib/file-generators/pcb-generator'
import { generatePayslipPDF } from '@/lib/pdf'

interface PayrollItem {
  id: string
  payroll_run_id: string
  employee_id: string
  overtime?: number
  bonus?: number
  deductions?: number
  employee?: {
    id: string
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
  }
}

export function PayrollRunDetailPage() {
  const { runId } = useParams()
  const navigate = useNavigate()
  const { company } = useCompanyStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [formData, setFormData] = useState({
    overtime: '',
    bonus: '',
    deductions: '',
  })

  const { data: payrollRun } = useQuery({
    queryKey: ['payroll-run', runId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_runs')
        .select('*')
        .eq('id', runId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!runId,
  })

  const { data: employees } = useQuery({
    queryKey: ['employees', company?.id],
    queryFn: async () => {
      if (!company?.id) return []
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', company.id)

      if (error) throw error
      return data
    },
    enabled: !!company?.id,
  })

  const { data: payrollItems, isLoading } = useQuery({
    queryKey: ['payroll-items', runId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_items')
        .select('*, employee:employees(*)')
        .eq('payroll_run_id', runId)

      if (error) throw error
      return (data || []) as PayrollItem[]
    },
    enabled: !!runId,
  })

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const existing = payrollItems?.find(
        (item) => item.employee_id === selectedEmployeeId
      )

      if (existing) {
        const { error } = await supabase
          .from('payroll_items')
          .update(data)
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('payroll_items').insert({
          payroll_run_id: runId,
          employee_id: selectedEmployeeId,
          ...data,
        })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-items'] })
      setDialogOpen(false)
      resetForm()
      toast({
        title: 'Success',
        description: 'Payroll item saved successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save payroll item',
        variant: 'destructive',
      })
    },
  })

  const resetForm = () => {
    setFormData({ overtime: '', bonus: '', deductions: '' })
    setSelectedEmployeeId('')
  }

  const handleAddEmployee = (employeeId: string) => {
    const existing = payrollItems?.find((item) => item.employee_id === employeeId)
    if (existing) {
      setFormData({
        overtime: existing.overtime?.toString() || '',
        bonus: existing.bonus?.toString() || '',
        deductions: existing.deductions?.toString() || '',
      })
    } else {
      resetForm()
    }
    setSelectedEmployeeId(employeeId)
    setDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate({
      overtime: formData.overtime ? parseFloat(formData.overtime) : null,
      bonus: formData.bonus ? parseFloat(formData.bonus) : null,
      deductions: formData.deductions ? parseFloat(formData.deductions) : null,
    })
  }

  const handleGenerateEPF = async () => {
    if (!payrollItems || !company) return

    try {
      const records = payrollItems
        .filter((item) => item.employee)
        .map((item, index) => {
          const employee = item.employee!
          const calculations = netPay({
            baseSalary: employee.base_salary,
            allowance: employee.allowance,
            overtime: item.overtime || 0,
            bonus: item.bonus || 0,
            deductions: item.deductions || 0,
            epfRate: employee.epf_rate_employee,
            socsoCategory: employee.socso_category,
            pcbCategory: employee.pcb_category,
          })

          return {
            no: (index + 1).toString(),
            icNumber: employee.ic_number.replace(/-/g, ''),
            name: employee.name,
            wages: amountToCents(calculations.grossSalary),
            employeeContribution: amountToCents(calculations.epf.employee),
            employerContribution: amountToCents(calculations.epf.employer),
          }
        })

      const fileContent = generateEPFFile(records)
      const blob = new Blob([fileContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `EPF_${payrollRun?.period.replace(/\s+/g, '_')}.txt`
      a.click()
      URL.revokeObjectURL(url)

      toast({
        title: 'Success',
        description: 'EPF file generated successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate EPF file',
        variant: 'destructive',
      })
    }
  }

  const handleGenerateSOCSO = async () => {
    if (!payrollItems || !company) return

    try {
      const records = payrollItems
        .filter((item) => item.employee)
        .map((item) => {
          const employee = item.employee!
          const calculations = netPay({
            baseSalary: employee.base_salary,
            allowance: employee.allowance,
            overtime: item.overtime || 0,
            bonus: item.bonus || 0,
            deductions: item.deductions || 0,
            epfRate: employee.epf_rate_employee,
            socsoCategory: employee.socso_category,
            pcbCategory: employee.pcb_category,
          })

          return {
            no: '1',
            icNumber: employee.ic_number,
            name: employee.name,
            wages: calculations.grossSalary,
            employeeContribution: calculations.socso.employee,
            employerContribution: calculations.socso.employer,
            category: employee.socso_category,
          }
        })

      const fileContent = generateSOCSOFile(records)
      const blob = new Blob([fileContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SOCSO_${payrollRun?.period.replace(/\s+/g, '_')}.csv`
      a.click()
      URL.revokeObjectURL(url)

      toast({
        title: 'Success',
        description: 'SOCSO file generated successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate SOCSO file',
        variant: 'destructive',
      })
    }
  }

  const handleGeneratePCB = async () => {
    if (!payrollItems || !company) return

    try {
      const records = payrollItems
        .filter((item) => item.employee)
        .map((item, index) => {
          const employee = item.employee!
          const calculations = netPay({
            baseSalary: employee.base_salary,
            allowance: employee.allowance,
            overtime: item.overtime || 0,
            bonus: item.bonus || 0,
            deductions: item.deductions || 0,
            epfRate: employee.epf_rate_employee,
            socsoCategory: employee.socso_category,
            pcbCategory: employee.pcb_category,
          })

          return {
            no: (index + 1).toString(),
            icNumber: employee.ic_number,
            name: employee.name,
            wages: calculations.grossSalary,
            epf: calculations.epf.employee,
            socso: calculations.socso.employee,
            pcb: calculations.pcb,
            netPay: calculations.netPay,
          }
        })

      const fileContent = generatePCBFile(records)
      const blob = new Blob([fileContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `PCB_${payrollRun?.period.replace(/\s+/g, '_')}.txt`
      a.click()
      URL.revokeObjectURL(url)

      toast({
        title: 'Success',
        description: 'PCB file generated successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate PCB file',
        variant: 'destructive',
      })
    }
  }

  const handleGeneratePayslip = async (item: PayrollItem) => {
    if (!item.employee || !company) return

    try {
      const calculations = netPay({
        baseSalary: item.employee.base_salary,
        allowance: item.employee.allowance,
        overtime: item.overtime || 0,
        bonus: item.bonus || 0,
        deductions: item.deductions || 0,
        epfRate: item.employee.epf_rate_employee,
        socsoCategory: item.employee.socso_category,
        pcbCategory: item.employee.pcb_category,
      })

      const pdfBytes = await generatePayslipPDF({
        companyName: company.company_name,
        employeeName: item.employee.name,
        icNumber: item.employee.ic_number,
        period: payrollRun?.period || '',
        baseSalary: item.employee.base_salary,
        allowance: item.employee.allowance,
        overtime: item.overtime,
        bonus: item.bonus,
        grossSalary: calculations.grossSalary,
        epfEmployee: calculations.epf.employee,
        epfEmployer: calculations.epf.employer,
        socsoEmployee: calculations.socso.employee,
        socsoEmployer: calculations.socso.employer,
        pcb: calculations.pcb,
        deductions: item.deductions,
        totalDeductions: calculations.totalDeductions,
        netPay: calculations.netPay,
        bankName: item.employee.bank_name,
        bankAccount: item.employee.bank_account,
      })

      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Payslip_${item.employee.name}_${payrollRun?.period.replace(/\s+/g, '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)

      toast({
        title: 'Success',
        description: 'Payslip generated successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate payslip',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/payroll')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{payrollRun?.period}</h1>
            <p className="text-gray-600 mt-2">Payroll run details</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleGenerateEPF}>
            <Download className="h-4 w-4 mr-2" />
            Generate EPF
          </Button>
          <Button variant="outline" onClick={handleGenerateSOCSO}>
            <Download className="h-4 w-4 mr-2" />
            Generate SOCSO
          </Button>
          <Button variant="outline" onClick={handleGeneratePCB}>
            <Download className="h-4 w-4 mr-2" />
            Generate PCB
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
          <CardDescription>
            Add employees to this payroll run or edit existing entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employees && employees.length > 0 ? (
            <div className="space-y-2 mb-4">
              {employees.map((employee) => (
                <Button
                  key={employee.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleAddEmployee(employee.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {employee.name}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 mb-4">No employees available</p>
          )}

          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : payrollItems && payrollItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Gross Salary</TableHead>
                  <TableHead>EPF</TableHead>
                  <TableHead>SOCSO</TableHead>
                  <TableHead>PCB</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollItems.map((item) => {
                  if (!item.employee) return null
                  const calculations = netPay({
                    baseSalary: item.employee.base_salary,
                    allowance: item.employee.allowance,
                    overtime: item.overtime || 0,
                    bonus: item.bonus || 0,
                    deductions: item.deductions || 0,
                    epfRate: item.employee.epf_rate_employee,
                    socsoCategory: item.employee.socso_category,
                    pcbCategory: item.employee.pcb_category,
                  })

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.employee.name}
                      </TableCell>
                      <TableCell>RM {calculations.grossSalary.toFixed(2)}</TableCell>
                      <TableCell>RM {calculations.epf.employee.toFixed(2)}</TableCell>
                      <TableCell>RM {calculations.socso.employee.toFixed(2)}</TableCell>
                      <TableCell>RM {calculations.pcb.toFixed(2)}</TableCell>
                      <TableCell className="font-medium">
                        RM {calculations.netPay.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleGeneratePayslip(item)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAddEmployee(item.employee_id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No payroll items yet. Add employees to get started.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payroll Item</DialogTitle>
            <DialogDescription>
              Update overtime, bonus, and deductions for this employee
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="overtime">Overtime (RM)</Label>
                <Input
                  id="overtime"
                  type="number"
                  step="0.01"
                  value={formData.overtime}
                  onChange={(e) =>
                    setFormData({ ...formData, overtime: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bonus">Bonus (RM)</Label>
                <Input
                  id="bonus"
                  type="number"
                  step="0.01"
                  value={formData.bonus}
                  onChange={(e) =>
                    setFormData({ ...formData, bonus: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deductions">Deductions (RM)</Label>
                <Input
                  id="deductions"
                  type="number"
                  step="0.01"
                  value={formData.deductions}
                  onChange={(e) =>
                    setFormData({ ...formData, deductions: e.target.value })
                  }
                />
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
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

