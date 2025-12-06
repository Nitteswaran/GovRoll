import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get all active scheduled payrolls that are due
    const now = new Date()
    const { data: scheduledPayrolls, error: fetchError } = await supabaseClient
      .from('scheduled_payrolls')
      .select('*, company:companies(*)')
      .eq('status', 'active')
      .lte('next_run_at', now.toISOString())

    if (fetchError) throw fetchError

    if (!scheduledPayrolls || scheduledPayrolls.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No scheduled payrolls due' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    const results = []

    for (const schedule of scheduledPayrolls) {
      try {
        // Create payroll run
        const period = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
        const { data: payrollRun, error: runError } = await supabaseClient
          .from('payroll_runs')
          .insert({
            company_id: schedule.company_id,
            period,
            status: 'draft',
          })
          .select()
          .single()

        if (runError) throw runError

        // Get all employees for the company
        const { data: employees, error: employeesError } = await supabaseClient
          .from('employees')
          .select('*')
          .eq('company_id', schedule.company_id)

        if (employeesError) throw employeesError

        // Create payroll items for each employee
        if (employees && employees.length > 0) {
          const payrollItems = employees.map((emp: any) => ({
            payroll_run_id: payrollRun.id,
            employee_id: emp.id,
            overtime: null,
            bonus: null,
            deductions: null,
          }))

          const { error: itemsError } = await supabaseClient
            .from('payroll_items')
            .insert(payrollItems)

          if (itemsError) throw itemsError
        }

        // Update schedule
        const nextRun = new Date(now)
        nextRun.setMonth(nextRun.getMonth() + 1)
        nextRun.setDate(schedule.day_of_month)

        await supabaseClient
          .from('scheduled_payrolls')
          .update({
            last_run_at: now.toISOString(),
            next_run_at: nextRun.toISOString(),
          })
          .eq('id', schedule.id)

        // Auto-generate files if enabled
        if (schedule.auto_generate_files) {
          // Trigger file generation (simplified - would call other functions)
          await supabaseClient.functions.invoke('generate-epf-file', {
            body: { payroll_run_id: payrollRun.id },
          })
        }

        // Auto-send payslips if enabled
        if (schedule.auto_send_payslips) {
          await supabaseClient.functions.invoke('send-bulk-payslips', {
            body: { payroll_run_id: payrollRun.id },
          })
        }

        results.push({
          schedule_id: schedule.id,
          payroll_run_id: payrollRun.id,
          status: 'success',
        })
      } catch (error: any) {
        results.push({
          schedule_id: schedule.id,
          status: 'error',
          error: error.message,
        })
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

