import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useEmployee } from '@/hooks/use-employee'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { User, Mail, Phone, Building2, Briefcase, Calendar, CreditCard, Banknote } from 'lucide-react'

export function EmployeeProfile() {
  const { employee: basicEmployee, isLoading: isLinkLoading, error: linkError } = useEmployee()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    ic_number: '',
    email: '',
    phone: '',
    bank_name: '',
    bank_account: '',
  })

  // Full fetch to get all details
  const { data: employee, isLoading: isProfileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['employee-full-profile', basicEmployee?.id],
    queryFn: async () => {
      if (!basicEmployee?.id) return null
      const { data, error } = await supabase
        .from('employees')
        .select('*, company:companies(company_name)')
        .eq('id', basicEmployee.id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!basicEmployee?.id
  })

  // Set initial form data
  useEffect(() => {
    if (employee && !isEditing) {
      setFormData({
        name: employee.name || '',
        ic_number: employee.ic_number || '',
        email: employee.email || '',
        phone: employee.phone || '',
        bank_name: employee.bank_name || '',
        bank_account: employee.bank_account || '',
      })
    }
  }, [employee, isEditing])

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!employee?.id) throw new Error('No employee record found')

      const { error } = await supabase
        .from('employees')
        .update({
          name: data.name,
          ic_number: data.ic_number,
          email: data.email,
          phone: data.phone,
          bank_name: data.bank_name,
          bank_account: data.bank_account
        })
        .eq('id', employee.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-full-profile'] })
      queryClient.invalidateQueries({ queryKey: ['employee-basic-info'] })
      refetchProfile()
      setIsEditing(false)
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      })
    },
  })

  const isLoading = isLinkLoading || (!!basicEmployee?.id && isProfileLoading)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    )
  }

  if (!basicEmployee && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Profile not found. Please contact your administrator.</p>
      </div>
    )
  }

  // Guard against render before full profile loads
  if (!employee) return null

  // Check if employed by a company (for conditional display)
  const isEmployed = !!employee.company_id

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-gray-600">View and manage your personal information</p>
        </div>
        <div className="flex gap-2">
          {isEditing && (
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          )}
          <Button
            variant={isEditing ? 'default' : 'outline'}
            onClick={() => {
              if (isEditing) {
                updateProfileMutation.mutate(formData)
              } else {
                setIsEditing(true)
              }
            }}
            disabled={updateProfileMutation.isPending}
          >
            {isEditing ? (updateProfileMutation.isPending ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Info - Always Visible */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Basic details about you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={isEditing ? formData.name : employee.name}
                disabled={!isEditing}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>IC Number</Label>
              <Input
                value={isEditing ? formData.ic_number : employee.ic_number}
                disabled={!isEditing}
                onChange={(e) => setFormData({ ...formData, ic_number: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email
              </Label>
              <Input
                id="email"
                value={isEditing ? formData.email : (employee.email || '')}
                disabled={!isEditing}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> Phone
              </Label>
              <Input
                id="phone"
                value={isEditing ? formData.phone : (employee.phone || '')}
                disabled={!isEditing}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Bank Details - Always Visible/Editable */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Bank Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input
                  value={isEditing ? formData.bank_name : (employee.bank_name || '')}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="e.g. Maybank"
                />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  value={isEditing ? formData.bank_account : (employee.bank_account || '')}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                  placeholder="e.g. 1234567890"
                />
              </div>
            </CardContent>
          </Card>

          {/* Employment & Stats - Only if Employed */}
          {isEmployed && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Employment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Company
                    </Label>
                    <Input value={employee.company?.company_name} disabled className="bg-gray-100" />
                  </div>
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Input value={employee.position || 'N/A'} disabled className="bg-gray-100" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Hire Date
                    </Label>
                    <Input
                      value={employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'N/A'}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Banknote className="h-5 w-5" />
                    Financial & Statutory
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500">Base Salary</Label>
                      <p className="font-semibold">RM {employee.base_salary}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500">Fixed Allowance</Label>
                      <p className="font-semibold">{employee.allowance ? `RM ${employee.allowance}` : 'RM 0.00'}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4 grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">EPF Rate</Label>
                      <p className="text-sm font-medium">{employee.epf_rate_employee}%</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">SOCSO Cat</Label>
                      <p className="text-sm font-medium">{employee.socso_category || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">PCB Cat</Label>
                      <p className="text-sm font-medium">{employee.pcb_category || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
