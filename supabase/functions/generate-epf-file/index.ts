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

    // Fetch payroll run and items
    const { data: payrollRun, error: runError } = await supabaseClient
      .from('payroll_runs')
      .select('*, company:companies(*)')
      .eq('id', payroll_run_id)
      .single()

    if (runError) throw runError

    const { data: payrollItems, error: itemsError } = await supabaseClient
      .from('payroll_items')
      .select('*, employee:employees(*)')
      .eq('payroll_run_id', payroll_run_id)

    if (itemsError) throw itemsError

    // Generate EPF file content
    const records = payrollItems
      .filter((item: any) => item.employee)
      .map((item: any, index: number) => {
        const employee = item.employee
        const grossSalary = employee.base_salary + employee.allowance + (item.overtime || 0) + (item.bonus || 0)
        
        // Calculate EPF (simplified)
        const epfEmployee = Math.min(grossSalary, 6000) * (employee.epf_rate_employee / 100)
        const epfEmployer = Math.min(grossSalary, 6000) * (employee.epf_rate_employer / 100)

        return {
          no: (index + 1).toString().padStart(6, '0'),
          icNumber: employee.ic_number.replace(/-/g, '').padStart(12, '0'),
          name: employee.name.padEnd(50, ' ').substring(0, 50),
          wages: Math.round(grossSalary * 100).toString().padStart(12, '0'),
          employeeContribution: Math.round(epfEmployee * 100).toString().padStart(10, '0'),
          employerContribution: Math.round(epfEmployer * 100).toString().padStart(10, '0'),
        }
      })

    // Generate file content
    const lines: string[] = []
    records.forEach((record: any) => {
      const line = [
        record.no,
        record.icNumber,
        record.name,
        record.wages,
        record.employeeContribution,
        record.employerContribution,
      ].join('')
      lines.push(line)
    })

    // Trailer
    const totalWages = records.reduce((sum: number, r: any) => sum + parseInt(r.wages), 0)
    const totalEmployee = records.reduce((sum: number, r: any) => sum + parseInt(r.employeeContribution), 0)
    const totalEmployer = records.reduce((sum: number, r: any) => sum + parseInt(r.employerContribution), 0)

    const trailer = [
      'T'.padEnd(6, ' '),
      ''.padStart(12, '0'),
      'TOTAL'.padEnd(50, ' '),
      totalWages.toString().padStart(12, '0'),
      totalEmployee.toString().padStart(10, '0'),
      totalEmployer.toString().padStart(10, '0'),
    ].join('')

    lines.push(trailer)
    const fileContent = lines.join('\r\n')

    // Upload to storage
    const fileName = `EPF_${payrollRun.period.replace(/\s+/g, '_')}_${Date.now()}.txt`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('submissions')
      .upload(fileName, fileContent, {
        contentType: 'text/plain',
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

