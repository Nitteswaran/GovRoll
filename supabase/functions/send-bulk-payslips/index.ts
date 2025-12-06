import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib@^1.17.1'

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

    const results = []

    for (const item of payrollItems || []) {
      if (!item.employee) continue

      try {
        // Generate payslip PDF (simplified - would use actual PDF generation)
        const pdfBytes = new Uint8Array(0) // Placeholder

        // Upload to storage
        const fileName = `payslip_${item.employee.id}_${payrollRun.period.replace(/\s+/g, '_')}.pdf`
        const { error: uploadError } = await supabaseClient.storage
          .from('payslips')
          .upload(fileName, pdfBytes, {
            contentType: 'application/pdf',
            upsert: false,
          })

        if (uploadError) throw uploadError

        // Create email notification
        const { error: emailError } = await supabaseClient
          .from('email_notifications')
          .insert({
            company_id: payrollRun.company_id,
            user_id: item.employee.id, // Would need employee user_id
            notification_type: 'payslip',
            recipient_email: item.employee.email || '',
            subject: `Payslip for ${payrollRun.period}`,
            body: `Your payslip for ${payrollRun.period} is attached.`,
            status: 'pending',
          })

        if (emailError) throw emailError

        results.push({
          employee_id: item.employee.id,
          status: 'success',
        })
      } catch (error: any) {
        results.push({
          employee_id: item.employee?.id,
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

