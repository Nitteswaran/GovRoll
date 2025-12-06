import { supabase } from './supabase'

export interface AuditLogData {
  company_id: string
  user_id: string
  action: string
  entity_type: string
  entity_id?: string
  old_values?: any
  new_values?: any
  ip_address?: string
  user_agent?: string
}

export async function createAuditLog(data: AuditLogData) {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      ...data,
      ip_address: data.ip_address || 'unknown',
      user_agent: data.user_agent || 'unknown',
    })

    if (error) {
      console.error('Failed to create audit log:', error)
    }
  } catch (error) {
    console.error('Error creating audit log:', error)
  }
}

