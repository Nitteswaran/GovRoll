import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useEmployee } from '@/hooks/use-employee'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Download, Eye } from 'lucide-react'

export function EmployeePayslips() {
  const { employee, isLoading: isEmployeeLoading } = useEmployee()
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null)


  const { data: payslips, isLoading } = useQuery({
    queryKey: ['employee-payslips', employee?.id],
    queryFn: async () => {
      if (!employee?.id) return []
      const { data, error } = await supabase
        .from('payslips')
        .select('*')
        .eq('employee_id', employee.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!employee?.id,
  })

  // Helper to get month name
  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })
  }

  if (isEmployeeLoading) {
    return <div>Loading employee data...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Payslips</h1>
        <p className="text-gray-600">View and download your payment history</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payslip History</CardTitle>
          <CardDescription>
            All issued payslips
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading payslips...</div>
          ) : payslips && payslips.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Date Issued</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell className="font-medium">
                      {getMonthName(payslip.month)} {payslip.year}
                    </TableCell>
                    <TableCell>RM {payslip.net_pay.toFixed(2)}</TableCell>
                    <TableCell>{new Date(payslip.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPayslip(payslip)}
                      >
                        <Eye className="h-4 w-4 mr-2" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-gray-500">
              No payslips found
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedPayslip} onOpenChange={(open) => !open && setSelectedPayslip(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payslip Details</DialogTitle>
            <DialogDescription>
              {selectedPayslip && `${getMonthName(selectedPayslip.month)} ${selectedPayslip.year}`}
            </DialogDescription>
          </DialogHeader>

          {selectedPayslip && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Net Pay</p>
                  <p className="text-2xl font-bold text-green-600">RM {selectedPayslip.net_pay.toFixed(2)}</p>
                </div>
                {selectedPayslip.file_url && (
                  <div className="flex justify-end items-center">
                    <Button variant="outline" onClick={() => window.open(selectedPayslip.file_url, '_blank')}>
                      <Download className="h-4 w-4 mr-2" /> Download PDF
                    </Button>
                  </div>
                )}
              </div>

              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Earnings</h3>
                  {/* Basic Breakdown - this depends on the JSON structure of salary_breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Base Salary</span>
                      <span>RM {Number(selectedPayslip.salary_breakdown?.base_salary || 0).toFixed(2)}</span>
                    </div>
                    {/* Add other earnings if available in breakdown */}
                  </div>
                </div>

                <div className="space-y-4 mt-6 md:mt-0">
                  <h3 className="font-semibold text-lg border-b pb-2">Deductions</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>EPF (Employee)</span>
                      <span>RM {selectedPayslip.epf.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SOCSO</span>
                      <span>RM {selectedPayslip.socso.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>EIS</span>
                      <span>RM {selectedPayslip.eis.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PCB (Tax)</span>
                      <span>RM {selectedPayslip.pcb.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
