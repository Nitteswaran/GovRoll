import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCompanyStore } from '@/store/company-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Users, Calculator, FileText } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function Dashboard() {
  const navigate = useNavigate()
  const { company } = useCompanyStore()

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', company?.id],
    queryFn: async () => {
      if (!company?.id) return null

      const [employeesResult, payrollResult] = await Promise.all([
        supabase
          .from('employees')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', company.id),
        supabase
          .from('payroll_runs')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', company.id),
      ])

      return {
        employees: employeesResult.count || 0,
        payrollRuns: payrollResult.count || 0,
      }
    },
    enabled: !!company?.id,
  })

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to GovRoll</CardTitle>
            <CardDescription>
              Get started by creating your company profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard/company')}>
              Create Company Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back to GovRoll</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Company</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{company.company_name}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {company.registration_number}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.employees || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payroll Runs</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.payrollRuns || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total runs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground mt-1">
              View submissions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/dashboard/employees')}
            >
              <Users className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/dashboard/payroll')}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Create Payroll Run
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No recent activity
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

