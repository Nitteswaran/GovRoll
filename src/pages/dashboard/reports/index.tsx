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
import { BarChart3, Download, FileText } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

export function ReportsPage() {
  const { company } = useCompanyStore()
  const { toast } = useToast()
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    department: '',
    minSalary: '',
    maxSalary: '',
  })

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['report-data', company?.id, filters],
    queryFn: async () => {
      if (!company?.id) return []

      let query = supabase
        .from('payroll_items')
        .select(`
          *,
          employee:employees(*),
          payroll_run:payroll_runs(*)
        `)
        .eq('payroll_run.company_id', company.id)

      if (filters.startDate) {
        query = query.gte('payroll_run.created_at', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('payroll_run.created_at', filters.endDate)
      }

      const { data, error } = await query

      if (error) throw error

      // Filter by salary range if provided
      let filtered = data || []
      if (filters.minSalary) {
        filtered = filtered.filter(
          (item: any) =>
            item.employee?.base_salary >= parseFloat(filters.minSalary)
        )
      }
      if (filters.maxSalary) {
        filtered = filtered.filter(
          (item: any) =>
            item.employee?.base_salary <= parseFloat(filters.maxSalary)
        )
      }

      return filtered
    },
    enabled: !!company?.id,
  })

  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) {
      toast({
        title: 'Error',
        description: 'No data to export',
        variant: 'destructive',
      })
      return
    }

    const headers = [
      'Period',
      'Employee Name',
      'IC Number',
      'Base Salary',
      'Allowance',
      'Overtime',
      'Bonus',
      'Deductions',
      'Gross Salary',
    ]

    const rows = reportData.map((item: any) => [
      item.payroll_run?.period || '',
      item.employee?.name || '',
      item.employee?.ic_number || '',
      item.employee?.base_salary || 0,
      item.employee?.allowance || 0,
      item.overtime || 0,
      item.bonus || 0,
      item.deductions || 0,
      (item.employee?.base_salary || 0) +
        (item.employee?.allowance || 0) +
        (item.overtime || 0) +
        (item.bonus || 0),
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payroll-report-${new Date().toISOString()}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: 'Success',
      description: 'Report exported successfully',
    })
  }

  return (
    <FeatureGate feature="custom-reports">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Custom Reports
            </h1>
            <p className="text-gray-600 mt-2">
              Generate custom payroll reports with filters
            </p>
          </div>
          <Button onClick={handleExportCSV} disabled={!reportData || reportData.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Apply filters to your report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minSalary">Min Salary (RM)</Label>
                <Input
                  id="minSalary"
                  type="number"
                  value={filters.minSalary}
                  onChange={(e) =>
                    setFilters({ ...filters, minSalary: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxSalary">Max Salary (RM)</Label>
                <Input
                  id="maxSalary"
                  type="number"
                  value={filters.maxSalary}
                  onChange={(e) =>
                    setFilters({ ...filters, maxSalary: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Results</CardTitle>
            <CardDescription>
              {reportData?.length || 0} records found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : reportData && reportData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Overtime</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Gross</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((item: any, index: number) => {
                    if (!item.employee) return null
                    const gross =
                      (item.employee.base_salary || 0) +
                      (item.employee.allowance || 0) +
                      (item.overtime || 0) +
                      (item.bonus || 0)
                    return (
                      <TableRow key={item.id || index}>
                        <TableCell>
                          {item.payroll_run?.period || 'N/A'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.employee.name}
                        </TableCell>
                        <TableCell>
                          RM {item.employee.base_salary?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell>
                          RM {item.overtime?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell>
                          RM {item.bonus?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell className="font-medium">
                          RM {gross.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No data found. Adjust your filters and try again.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  )
}

