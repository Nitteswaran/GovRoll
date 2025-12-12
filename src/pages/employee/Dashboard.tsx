import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Building2, CheckCircle2 } from 'lucide-react'

export function EmployeeDashboard() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: invitations, isLoading } = useQuery({
    queryKey: ['my-invitations'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_invitations')
      if (error) throw error
      return data
    },
  })

  const acceptMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const { error } = await supabase.rpc('accept_company_invitation', {
        target_company_id: companyId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invitations'] })
      queryClient.invalidateQueries({ queryKey: ['user-companies'] }) // Refresh available companies
      toast({
        title: 'Invitation Accepted',
        description: 'You have joined the company successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept invitation',
        variant: 'destructive',
      })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employee Dashboard</h1>
          <p className="text-gray-600">Overview of your payslips, attendance, leave, and notifications.</p>
        </div>
      </div>

      {/* Invitations Section */}
      {invitations && invitations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Pending Invitations
            </CardTitle>
            <CardDescription className="text-blue-600">
              You have been invited to join the following companies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invite: any) => (
                <div
                  key={invite.company_id}
                  className="flex items-center justify-between bg-white p-4 rounded-lg border border-blue-100 shadow-sm"
                >
                  <div>
                    <h3 className="font-semibold text-lg">{invite.company_name}</h3>
                    <p className="text-sm text-gray-500">Role: {invite.role}</p>
                    <p className="text-xs text-gray-400">
                      Invited: {new Date(invite.invited_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => acceptMutation.mutate(invite.company_id)}
                    disabled={acceptMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {acceptMutation.isPending ? 'Joining...' : 'Accept Invite'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Placeholder for other dashboard content if needed, or just keep it minimal for now */}
    </div>
  )
}
