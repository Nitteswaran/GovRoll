/**
 * SOCSO CSV Generator
 * Format for SOCSO submission
 */

export interface SOCSORecord {
  no: string
  icNumber: string
  name: string
  wages: number
  employeeContribution: number
  employerContribution: number
  category: string
}

export function generateSOCSOFile(records: SOCSORecord[]): string {
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
  
  records.forEach((record) => {
    const row = [
      record.no,
      record.icNumber,
      `"${record.name}"`,
      record.wages.toFixed(2),
      record.employeeContribution.toFixed(2),
      record.employerContribution.toFixed(2),
      record.category,
    ].join(',')
    
    lines.push(row)
  })
  
  // Summary row
  const totalWages = records.reduce((sum, r) => sum + r.wages, 0)
  const totalEmployee = records.reduce((sum, r) => sum + r.employeeContribution, 0)
  const totalEmployer = records.reduce((sum, r) => sum + r.employerContribution, 0)
  
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
  
  return lines.join('\r\n')
}

