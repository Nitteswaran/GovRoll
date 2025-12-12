import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { useToast } from '@/hooks/use-toast'
import { Clock } from 'lucide-react'

export function EmployeeAttendance() {
  const { employee, isLoading: isEmployeeLoading } = useEmployee()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (isEmployeeLoading) {
    return <div>Loading employee data...</div>
  }


  // Fetch today's attendance to see last action
  const { data: todayAttendance } = useQuery({
    queryKey: ['employee-attendance-today', employee?.id],
    queryFn: async () => {
      if (!employee?.id) return []

      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employee.id)
        .gte('timestamp', startOfDay.toISOString())
        .lte('timestamp', endOfDay.toISOString())
        .order('timestamp', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!employee?.id,
  })

  const { data: history, isLoading } = useQuery({
    queryKey: ['employee-attendance-history', employee?.id],
    queryFn: async () => {
      if (!employee?.id) return []
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employee.id)
        .order('timestamp', { ascending: false })
        .limit(20)

      if (error) throw error
      return data
    },
    enabled: !!employee?.id,
  })

  const lastAction = todayAttendance?.[0]?.type
  const canClockIn = !todayAttendance?.length || lastAction === 'clock_out'
  const canClockOut = lastAction === 'clock_in'

  const clockMutation = useMutation({
    mutationFn: async (type: 'clock_in' | 'clock_out') => {
      if (!employee?.id || !employee?.company_id) throw new Error('Employee info missing')

      // Get location if possible (optional)
      // For now just sending empty location
      const { error } = await supabase.from('attendance').insert({
        employee_id: employee.id,
        company_id: employee.company_id,
        type,
        timestamp: new Date().toISOString(),
        device_info: navigator.userAgent,
      })

      if (error) throw error
    },
    onSuccess: (_, type) => {
      queryClient.invalidateQueries({ queryKey: ['employee-attendance-today'] })
      queryClient.invalidateQueries({ queryKey: ['employee-attendance-history'] })
      toast({
        title: type === 'clock_in' ? 'Clocked In' : 'Clocked Out',
        description: `Successfully recorded at ${new Date().toLocaleTimeString()}`,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record attendance',
        variant: 'destructive',
      })
    },
  })

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Attendance</h1>
            <p className="text-gray-600">Track your working hours</p>
          </div>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-blue-600" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center py-8">
              <div className="text-5xl font-bold tracking-tight text-gray-900">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <p className="text-gray-500 font-medium">
                {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <div className="flex justify-center gap-4 pt-4">
                <Button
                  size="lg"
                  className={`w-32 bg-green-600 hover:bg-green-700 text-white ${!canClockIn && 'opacity-50 cursor-not-allowed'}`}
                  disabled={!canClockIn || clockMutation.isPending}
                  onClick={() => clockMutation.mutate('clock_in')}
                >
                  Clock In
                </Button>
                <Button
                  size="lg"
                  className={`w-32 bg-red-600 hover:bg-red-700 text-white ${!canClockOut && 'opacity-50 cursor-not-allowed'}`}
                  disabled={!canClockOut || clockMutation.isPending}
                  onClick={() => clockMutation.mutate('clock_out')}
                >
                  Clock Out
                </Button>
              </div>

              <div className="text-sm text-gray-500 pt-2">
                {lastAction === 'clock_in' ? (
                  <span className="text-green-600 font-medium">Currently Working</span>
                ) : lastAction === 'clock_out' ? (
                  <span className="text-gray-600">Not Working</span>
                ) : (
                  <span>Ready to start your day</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Last 20 records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading...</div>
            ) : history && history.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.type === 'clock_in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {record.type === 'clock_in' ? 'Clock In' : 'Clock Out'}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {new Date(record.timestamp).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No attendance records yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
