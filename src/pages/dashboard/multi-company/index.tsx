import { useState } from 'react'
import { FeatureGate } from '@/hooks/use-feature-gate'
import { useCompanyStore } from '@/store/company-store'
import { useAuthStore } from '@/store/auth-store'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import RippleWaveLoader from '@/components/ui/ripple-wave-loader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Building2, Crown } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

export function MultiCompanyPage() {
  const { user } = useAuthStore()
  const { company, fetchCompany, setCompany } = useCompanyStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: companies, isLoading } = useQuery({
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

  // ... createCompanyMutation ...

  const switchCompany = (selectedCompany: any) => {
    setCompany(selectedCompany)
    toast({
      title: 'Company Switched',
      description: `You are now viewing ${selectedCompany.company_name}`,
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
            <p className="text-gray-600 mt-2">Manage multiple companies</p>
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
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <RippleWaveLoader />
                </div>
              ) : companies && companies.length > 0 ? (
                <div className="space-y-2">
                  {companies.map((comp: any) => (
                    <Button
                      key={comp.id}
                      variant={company?.id === comp.id ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => switchCompany(comp)}
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

