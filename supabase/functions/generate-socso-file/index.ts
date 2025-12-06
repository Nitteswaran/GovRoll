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
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { payroll_run_id } = await req.json()

    const { data: payrollRun, error: runError } = await supabaseClient
      .from('payroll_runs')
      .select('*')
      .eq('id', payroll_run_id)
      .single()

    if (runError) throw runError

    const { data: payrollItems, error: itemsError } = await supabaseClient
      .from('payroll_items')
      .select('*, employee:employees(*)')
      .eq('payroll_run_id', payroll_run_id)

    if (itemsError) throw itemsError

    // Generate SOCSO CSV
    const headers = [
      'No',
      'IC Number',
      'Name',
      'Wages (RM)',
      'Employee Contribution (RM)',
      'Employer Contribution (RM)',
      'Category'
    ]

    const lines: string[] = [headers.join(',')]

    payrollItems
      .filter((item: any) => item.employee)
      .forEach((item: any, index: number) => {
        const employee = item.employee
        const grossSalary = employee.base_salary + employee.allowance + (item.overtime || 0) + (item.bonus || 0)
        
        // Calculate SOCSO (simplified)
        const socsoEmployee = Math.min(grossSalary, 5000) * 0.005
        const socsoEmployer = Math.min(grossSalary, 5000) * 0.0175

        const row = [
          (index + 1).toString(),
          employee.ic_number,
          `"${employee.name}"`,
          grossSalary.toFixed(2),
          socsoEmployee.toFixed(2),
          socsoEmployer.toFixed(2),
          employee.socso_category,
        ].join(',')

        lines.push(row)
      })

    // Summary
    const totalWages = payrollItems.reduce((sum: number, item: any) => {
      if (!item.employee) return sum
      return sum + item.employee.base_salary + item.employee.allowance + (item.overtime || 0) + (item.bonus || 0)
    }, 0)

    const totalEmployee = payrollItems.reduce((sum: number, item: any) => {
      if (!item.employee) return sum
      const grossSalary = item.employee.base_salary + item.employee.allowance + (item.overtime || 0) + (item.bonus || 0)
      return sum + Math.min(grossSalary, 5000) * 0.005
    }, 0)

    const totalEmployer = payrollItems.reduce((sum: number, item: any) => {
      if (!item.employee) return sum
      const grossSalary = item.employee.base_salary + item.employee.allowance + (item.overtime || 0) + (item.bonus || 0)
      return sum + Math.min(grossSalary, 5000) * 0.0175
    }, 0)

    const summary = [
      'TOTAL',
      '',
      '',
      totalWages.toFixed(2),
      totalEmployee.toFixed(2),
      totalEmployer.toFixed(2),
      '',
    ].join(',')

    lines.push(summary)
    const fileContent = lines.join('\r\n')

    // Upload to storage
    const fileName = `SOCSO_${payrollRun.period.replace(/\s+/g, '_')}_${Date.now()}.csv`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('submissions')
      .upload(fileName, fileContent, {
        contentType: 'text/csv',
        upsert: false,
      })

    if (uploadError) throw uploadError

    return new Response(
      JSON.stringify({ success: true, fileName, fileContent }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

