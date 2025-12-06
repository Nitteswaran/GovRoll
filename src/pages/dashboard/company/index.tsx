import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useCompanyStore } from '@/store/company-store'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export function CompanyPage() {
  const { user } = useAuthStore()
  const { company, fetchCompany } = useCompanyStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    company_name: '',
    registration_number: '',
    epf_number: '',
    socso_number: '',
    income_tax_number: '',
    address: '',
  })

  useEffect(() => {
    if (company) {
      setFormData({
        company_name: company.company_name || '',
        registration_number: company.registration_number || '',
        epf_number: company.epf_number || '',
        socso_number: company.socso_number || '',
        income_tax_number: company.income_tax_number || '',
        address: company.address || '',
      })
    }
  }, [company])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)

    try {
      if (company) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', company.id)

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Company profile updated successfully',
        })
      } else {
        // Create new company
        const { error } = await supabase.from('companies').insert({
          user_id: user.id,
          ...formData,
        })

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Company profile created successfully',
        })
      }

      await fetchCompany(user.id)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save company profile',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Company Profile</h1>
        <p className="text-gray-600 mt-2">Manage your company information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{company ? 'Edit Company' : 'Create Company'}</CardTitle>
          <CardDescription>
            Enter your company details for payroll processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
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
                    setFormData({
                      ...formData,
                      registration_number: e.target.value,
                    })
                  }
                  required
                />
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="income_tax_number">Income Tax Number</Label>
                <Input
                  id="income_tax_number"
                  value={formData.income_tax_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      income_tax_number: e.target.value,
                    })
                  }
                />
              </div>
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

            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : company ? 'Update Company' : 'Create Company'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

