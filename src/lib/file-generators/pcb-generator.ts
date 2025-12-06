/**
 * PCB CP39 Text Generator
 * Format for PCB (Monthly Tax Deduction) submission
 */

export interface PCBRecord {
  no: string
  icNumber: string
  name: string
  wages: number
  epf: number
  socso: number
  pcb: number
  netPay: number
}

export function generatePCBFile(records: PCBRecord[]): string {
  const lines: string[] = []
  
  // Header
  lines.push('CP39 MONTHLY TAX DEDUCTION')
  lines.push('='.repeat(80))
  lines.push('')
  
  // Column headers
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
  
  // Data rows
  records.forEach((record) => {
    const row = [
      record.no.padEnd(6),
      record.icNumber.padEnd(15),
      record.name.substring(0, 30).padEnd(30),
      record.wages.toFixed(2).padStart(12),
      record.epf.toFixed(2).padStart(10),
      record.socso.toFixed(2).padStart(10),
      record.pcb.toFixed(2).padStart(10),
      record.netPay.toFixed(2).padStart(12),
    ].join(' | ')
    
    lines.push(row)
  })
  
  lines.push('-'.repeat(80))
  
  // Summary
  const totalWages = records.reduce((sum, r) => sum + r.wages, 0)
  const totalEPF = records.reduce((sum, r) => sum + r.epf, 0)
  const totalSOCSO = records.reduce((sum, r) => sum + r.socso, 0)
  const totalPCB = records.reduce((sum, r) => sum + r.pcb, 0)
  const totalNetPay = records.reduce((sum, r) => sum + r.netPay, 0)
  
  lines.push('TOTAL:')
  lines.push(
    [
      ''.padEnd(6),
      ''.padEnd(15),
      ''.padEnd(30),
      totalWages.toFixed(2).padStart(12),
      totalEPF.toFixed(2).padStart(10),
      totalSOCSO.toFixed(2).padStart(10),
      totalPCB.toFixed(2).padStart(10),
      totalNetPay.toFixed(2).padStart(12),
    ].join(' | ')
  )
  
  return lines.join('\r\n')
}

