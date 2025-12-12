import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth-store'

export function useEmployee() {
    const { user } = useAuthStore()
    const queryClient = useQueryClient()

    // Mutation to try and sync identity
    const syncMutation = useMutation({
        mutationFn: async () => {
            const { data, error } = await supabase.rpc('sync_employee_identity')
            if (error) throw error
            return data
        },
        onSuccess: (linked) => {
            if (linked) {
                queryClient.invalidateQueries({ queryKey: ['employee-basic-info'] })
            }
        }
    })

    const { data: employee, isLoading, error, refetch } = useQuery({
        queryKey: ['employee-basic-info', user?.id],
        queryFn: async () => {
            console.log('useEmployee: Starting fetch for user', user?.id)
            if (!user?.id) return null

            // First try to get the employee
            const { data, error } = await supabase
                .from('employees')
                .select('id, company_id, company:companies(company_name)')
                .eq('auth_user_id', user.id)
                .maybeSingle()

            console.log('useEmployee: Initial fetch result', { data, error })

            // If no data or error, try to sync
            if (!data) {
                console.log('useEmployee: No profile found, attempting sync...')
                try {
                    const { data: linked, error: syncError } = await supabase.rpc('sync_employee_identity')
                    console.log('useEmployee: Sync result', { linked, syncError })

                    if (linked) {
                        // Retry fetch immediately if linked
                        const { data: retryData, error: retryError } = await supabase
                            .from('employees')
                            .select('id, company_id, company:companies(company_name)')
                            .eq('auth_user_id', user.id)
                            .single()

                        console.log('useEmployee: Retry fetch result', { retryData, retryError })

                        if (retryError) throw retryError
                        return retryData
                    }
                } catch (err) {
                    console.error('useEmployee: Sync RPC failed', err)
                }
            }

            if (error) throw error
            return data
        },
        enabled: !!user?.id,
        retry: 1,
    })

    return {
        employee,
        isLoading: isLoading || syncMutation.isPending,
        error,
        refetch,
        isAuthenticated: !!user
    }
}
