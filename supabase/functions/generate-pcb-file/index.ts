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

    // Generate PCB file
    const lines: string[] = []
    lines.push('CP39 MONTHLY TAX DEDUCTION')
    lines.push('='.repeat(80))
    lines.push('')

    lines.push(
      [
        'No'.padEnd(6),
        'IC Number'.padEnd(15),
        'Name'.padEnd(30),
        'Wages'.padStart(12),
        'EPF'.padStart(10),
        'SOCSO'.padStart(10),
        'PCB'.padStart(10),
        'Net Pay'.padStart(12),
      ].join(' | ')
    )

    lines.push('-'.repeat(80))

    payrollItems
      .filter((item: any) => item.employee)
      .forEach((item: any, index: number) => {
        const employee = item.employee
        const grossSalary = employee.base_salary + employee.allowance + (item.overtime || 0) + (item.bonus || 0)
        
        // Calculate deductions (simplified)
        const epf = Math.min(grossSalary, 6000) * (employee.epf_rate_employee / 100)
        const socso = Math.min(grossSalary, 5000) * 0.005
        const taxableIncome = grossSalary - epf - socso - 9000 // Personal relief
        const pcb = taxableIncome > 0 ? taxableIncome * 0.01 : 0 // Simplified
        const netPay = grossSalary - epf - socso - pcb - (item.deductions || 0)

        const row = [
          (index + 1).toString().padEnd(6),
          employee.ic_number.padEnd(15),
          employee.name.substring(0, 30).padEnd(30),
          grossSalary.toFixed(2).padStart(12),
          epf.toFixed(2).padStart(10),
          socso.toFixed(2).padStart(10),
          pcb.toFixed(2).padStart(10),
          netPay.toFixed(2).padStart(12),
        ].join(' | ')

        lines.push(row)
      })

    lines.push('-'.repeat(80))

    // Summary
    const totals = payrollItems.reduce((acc: any, item: any) => {
      if (!item.employee) return acc
      const grossSalary = item.employee.base_salary + item.employee.allowance + (item.overtime || 0) + (item.bonus || 0)
      const epf = Math.min(grossSalary, 6000) * (item.employee.epf_rate_employee / 100)
      const socso = Math.min(grossSalary, 5000) * 0.005
      const taxableIncome = grossSalary - epf - socso - 9000
      const pcb = taxableIncome > 0 ? taxableIncome * 0.01 : 0
      const netPay = grossSalary - epf - socso - pcb - (item.deductions || 0)

      return {
        wages: acc.wages + grossSalary,
        epf: acc.epf + epf,
        socso: acc.socso + socso,
        pcb: acc.pcb + pcb,
        netPay: acc.netPay + netPay,
      }
    }, { wages: 0, epf: 0, socso: 0, pcb: 0, netPay: 0 })

    lines.push('TOTAL:')
    lines.push(
      [
        ''.padEnd(6),
        ''.padEnd(15),
        ''.padEnd(30),
        totals.wages.toFixed(2).padStart(12),
        totals.epf.toFixed(2).padStart(10),
        totals.socso.toFixed(2).padStart(10),
        totals.pcb.toFixed(2).padStart(10),
        totals.netPay.toFixed(2).padStart(12),
      ].join(' | ')
    )

    const fileContent = lines.join('\r\n')

    // Upload to storage
    const fileName = `PCB_${payrollRun.period.replace(/\s+/g, '_')}_${Date.now()}.txt`
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

