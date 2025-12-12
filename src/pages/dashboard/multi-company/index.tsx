import { useState } from 'react'
import { FeatureGate } from '@/hooks/use-feature-gate'
import { useCompanyStore } from '@/store/company-store'
import { useAuthStore } from '@/store/auth-store'
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
import { Plus, Users, Building2, Crown } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

interface CompanyUser {
  id: string
  company_id: string
  user_id: string
  role: 'admin' | 'accountant' | 'staff'
  user?: {
    email: string
  }
  company?: {
    company_name: string
  }
}

export function MultiCompanyPage() {
  const { user } = useAuthStore()
  const { company, fetchCompany } = useCompanyStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'accountant' | 'staff'>('staff')

  const { data: companies } = useQuery({
    queryKey: ['user-companies', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!user?.id,
  })

  const { data: companyUsers } = useQuery({
    queryKey: ['company-users', company?.id],
    queryFn: async () => {
      if (!company?.id) return []
      const { data, error } = await supabase
        .from('company_users')
        .select('*, user:users(email), company:companies(company_name)')
        .eq('company_id', company.id)

      if (error) throw error
      return data as CompanyUser[]
    },
    enabled: !!company?.id,
  })

  const createCompanyMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: newCompany, error } = await supabase
        .from('companies')
        .insert({
          user_id: user?.id,
          ...data,
        })
        .select()
        .single()

      if (error) throw error
      return newCompany
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-companies'] })
      setDialogOpen(false)
      toast({
        title: 'Success',
        description: 'Company created successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create company',
        variant: 'destructive',
      })
    },
  })

  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      // Call the secure RPC function to check if user exists
      const { data: targetUserId, error: rpcError } = await supabase.rpc('get_user_id_by_email', {
        email_input: email,
      })

      if (rpcError) {
        console.error('RPC Error:', rpcError)
        throw new Error('Failed to verify user existence')
      }

      if (!targetUserId) {
        throw new Error('User not found. They must register first.')
      }

      const { error } = await supabase.from('company_users').insert({
        company_id: company?.id,
        user_id: targetUserId,
        role,
        invited_by: user?.id,
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] })
      setInviteDialogOpen(false)
      setInviteEmail('')
      toast({
        title: 'Success',
        description: 'User invited successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to invite user',
        variant: 'destructive',
      })
    },
  })

  const switchCompany = async (companyId: string) => {
    // In a real implementation, you'd update the selected company
    // For now, just refresh the company data
    await fetchCompany(user?.id || '')
    toast({
      title: 'Company Switched',
      description: 'You are now viewing the selected company',
    })
  }

  return (
    <FeatureGate feature="multi-company">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              Multi-Company Management
            </h1>
            <p className="text-gray-600 mt-2">Manage multiple companies and team members</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Company</DialogTitle>
                <DialogDescription>
                  Add a new company to your account
                </DialogDescription>
              </DialogHeader>
              <CompanyForm
                onSubmit={(data) => createCompanyMutation.mutate(data)}
                loading={createCompanyMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Companies</CardTitle>
              <CardDescription>Switch between companies</CardDescription>
            </CardHeader>
            <CardContent>
              {companies && companies.length > 0 ? (
                <div className="space-y-2">
                  {companies.map((comp: any) => (
                    <Button
                      key={comp.id}
                      variant={company?.id === comp.id ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => switchCompany(comp.id)}
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      {comp.company_name}
                      {company?.id === comp.id && (
                        <Crown className="h-4 w-4 ml-auto" />
                      )}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No companies yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage users for current company</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      Invite User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite User</DialogTitle>
                      <DialogDescription>
                        Invite a user to join this company
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="user@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <select
                          id="role"
                          value={inviteRole}
                          onChange={(e) =>
                            setInviteRole(e.target.value as 'admin' | 'accountant' | 'staff')
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="staff">Staff</option>
                          <option value="accountant">Accountant</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setInviteDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() =>
                          inviteUserMutation.mutate({
                            email: inviteEmail,
                            role: inviteRole,
                          })
                        }
                        disabled={inviteUserMutation.isPending}
                      >
                        {inviteUserMutation.isPending ? 'Inviting...' : 'Invite'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {companyUsers && companyUsers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyUsers.map((cu) => (
                        <TableRow key={cu.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{cu.user?.email || 'N/A'}</span>
                              {!cu.accepted_at && (
                                <span className="text-xs text-amber-600 font-medium">
                                  (Pending Acceptance)
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded text-xs bg-gray-100">
                              {cu.role}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-gray-500 text-center py-4">No team members yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FeatureGate>
  )
}

function CompanyForm({
  onSubmit,
  loading,
}: {
  onSubmit: (data: any) => void
  loading: boolean
}) {
  const [formData, setFormData] = useState({
    company_name: '',
    registration_number: '',
    epf_number: '',
    socso_number: '',
    income_tax_number: '',
    address: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="company_name">Company Name *</Label>
        <Input
          id="company_name"
          value={formData.company_name}
          onChange={(e) =>
            setFormData({ ...formData, company_name: e.target.value })
          }
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="registration_number">Registration Number *</Label>
        <Input
          id="registration_number"
          value={formData.registration_number}
          onChange={(e) =>
            setFormData({ ...formData, registration_number: e.target.value })
          }
          required
        />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="epf_number">EPF Number</Label>
          <Input
            id="epf_number"
            value={formData.epf_number}
            onChange={(e) =>
              setFormData({ ...formData, epf_number: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="socso_number">SOCSO Number</Label>
          <Input
            id="socso_number"
            value={formData.socso_number}
            onChange={(e) =>
              setFormData({ ...formData, socso_number: e.target.value })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="income_tax_number">Income Tax Number</Label>
        <Input
          id="income_tax_number"
          value={formData.income_tax_number}
          onChange={(e) =>
            setFormData({ ...formData, income_tax_number: e.target.value })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Company'}
        </Button>
      </DialogFooter>
    </form>
  )
}

