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

    const anomalies = []

    for (const item of payrollItems || []) {
      if (!item.employee) continue

      const grossSalary =
        item.employee.base_salary +
        item.employee.allowance +
        (item.overtime || 0) +
        (item.bonus || 0)

      // Check 1: EPF calculation
      const expectedEPF = Math.min(grossSalary, 6000) * (item.employee.epf_rate_employee / 100)
      const actualEPF = expectedEPF // Would calculate from payroll
      if (Math.abs(actualEPF - expectedEPF) > 0.01) {
        anomalies.push({
          payroll_run_id,
          company_id: payrollRun.company_id,
          anomaly_type: 'epf_miscalculation',
          severity: 'high',
          description: `EPF calculation mismatch for ${item.employee.name}. Expected: ${expectedEPF}, Actual: ${actualEPF}`,
          affected_employee_id: item.employee.id,
        })
      }

      // Check 2: Missing EPF/SOCSO
      if (item.employee.epf_rate_employee === 0) {
        anomalies.push({
          payroll_run_id,
          company_id: payrollRun.company_id,
          anomaly_type: 'missing_contribution',
          severity: 'critical',
          description: `Missing EPF contribution for ${item.employee.name}`,
          affected_employee_id: item.employee.id,
        })
      }

      // Check 3: Salary anomaly (unusual change)
      if (grossSalary < 1000 || grossSalary > 100000) {
        anomalies.push({
          payroll_run_id,
          company_id: payrollRun.company_id,
          anomaly_type: 'salary_anomaly',
          severity: 'medium',
          description: `Unusual salary amount for ${item.employee.name}: RM${grossSalary}`,
          affected_employee_id: item.employee.id,
        })
      }

      // Check 4: PCB calculation
      const epfDeduction = expectedEPF
      const socsoDeduction = Math.min(grossSalary, 5000) * 0.005
      const taxableIncome = grossSalary - epfDeduction - socsoDeduction - 9000
      if (taxableIncome > 5000 && !item.pcb) {
        anomalies.push({
          payroll_run_id,
          company_id: payrollRun.company_id,
          anomaly_type: 'missing_pcb',
          severity: 'high',
          description: `Missing PCB deduction for ${item.employee.name} with taxable income of RM${taxableIncome}`,
          affected_employee_id: item.employee.id,
        })
      }
    }

    // Insert anomalies
    if (anomalies.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('anomaly_detections')
        .insert(anomalies)

      if (insertError) throw insertError
    }

    return new Response(
      JSON.stringify({
        success: true,
        anomalies_detected: anomalies.length,
        anomalies,
      }),
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

