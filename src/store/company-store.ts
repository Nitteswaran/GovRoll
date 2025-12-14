import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface Company {
  id: string
  user_id: string
  company_name: string
  registration_number: string
  epf_number: string
  socso_number: string
  income_tax_number: string
  address: string
  created_at: string
  updated_at: string
}

interface CompanyState {
  company: Company | null
  loading: boolean
  setCompany: (company: Company | null) => void
  setLoading: (loading: boolean) => void
  fetchCompany: (userId: string) => Promise<void>
}

export const useCompanyStore = create<CompanyState>((set) => ({
  company: null,
  loading: false,
  setCompany: (company) => set({ company }),
  setLoading: (loading) => set({ loading }),
  fetchCompany: async (userId: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle()

      if (error) throw error

      console.log('Fetched company:', data)
      set({ company: data, loading: false })
    } catch (error) {
      console.error('Error fetching company:', error)
      set({ company: null, loading: false })
    }
  },
}))

