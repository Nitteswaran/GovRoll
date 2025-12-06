/**
 * EPF File A Generator (KWSP Format A)
 * Fixed-width format for EPF submission
 */

export interface EPFRecord {
  no: string // 6 digits
  icNumber: string // 12 digits
  name: string // 50 chars
  wages: string // 12 digits (RM cents)
  employeeContribution: string // 10 digits (RM cents)
  employerContribution: string // 10 digits (RM cents)
}

export function generateEPFFile(records: EPFRecord[]): string {
  const lines: string[] = []
  
  // Header record (if required by format)
  // Format: H + date + company info
  
  // Data records
  records.forEach((record) => {
    const line = [
      record.no.padStart(6, '0'),
      record.icNumber.padStart(12, '0'),
      record.name.padEnd(50, ' ').substring(0, 50),
      record.wages.padStart(12, '0'),
      record.employeeContribution.padStart(10, '0'),
      record.employerContribution.padStart(10, '0'),
    ].join('')
    
    lines.push(line)
  })
  
  // Trailer record (total summary)
  const totalWages = records.reduce((sum, r) => sum + parseInt(r.wages), 0)
  const totalEmployee = records.reduce((sum, r) => sum + parseInt(r.employeeContribution), 0)
  const totalEmployer = records.reduce((sum, r) => sum + parseInt(r.employerContribution), 0)
  
  const trailer = [
    'T'.padEnd(6, ' '),
    ''.padStart(12, '0'),
    'TOTAL'.padEnd(50, ' '),
    totalWages.toString().padStart(12, '0'),
    totalEmployee.toString().padStart(10, '0'),
    totalEmployer.toString().padStart(10, '0'),
  ].join('')
  
  lines.push(trailer)
  
  return lines.join('\r\n')
}

/**
 * Convert amount in RM to cents (string format for fixed-width)
 */
export function amountToCents(amount: number): string {
  return Math.round(amount * 100).toString()
}

