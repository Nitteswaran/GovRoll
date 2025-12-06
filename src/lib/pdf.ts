import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export interface PayslipData {
  companyName: string
  employeeName: string
  icNumber: string
  period: string
  baseSalary: number
  allowance: number
  overtime?: number
  bonus?: number
  grossSalary: number
  epfEmployee: number
  epfEmployer: number
  socsoEmployee: number
  socsoEmployer: number
  pcb: number
  deductions?: number
  totalDeductions: number
  netPay: number
  bankName: string
  bankAccount: string
}

export async function generatePayslipPDF(data: PayslipData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4 size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  
  const { width, height } = page.getSize()
  const margin = 50
  let y = height - margin
  
  // Title
  page.drawText('PAYSLIP', {
    x: margin,
    y,
    size: 24,
    font: boldFont,
    color: rgb(0, 0, 0),
  })
  
  y -= 40
  
  // Company Name
  page.drawText(data.companyName, {
    x: margin,
    y,
    size: 14,
    font: boldFont,
  })
  
  y -= 30
  
  // Period
  page.drawText(`Pay Period: ${data.period}`, {
    x: margin,
    y,
    size: 10,
    font,
  })
  
  y -= 40
  
  // Employee Info
  page.drawText('Employee Information', {
    x: margin,
    y,
    size: 12,
    font: boldFont,
  })
  
  y -= 20
  
  page.drawText(`Name: ${data.employeeName}`, {
    x: margin,
    y,
    size: 10,
    font,
  })
  
  y -= 15
  
  page.drawText(`IC Number: ${data.icNumber}`, {
    x: margin,
    y,
    size: 10,
    font,
  })
  
  y -= 15
  
  page.drawText(`Bank: ${data.bankName} - ${data.bankAccount}`, {
    x: margin,
    y,
    size: 10,
    font,
  })
  
  y -= 40
  
  // Earnings
  page.drawText('EARNINGS', {
    x: margin,
    y,
    size: 12,
    font: boldFont,
  })
  
  y -= 20
  
  const earnings = [
    ['Base Salary', data.baseSalary.toFixed(2)],
    ['Allowance', data.allowance.toFixed(2)],
    ...(data.overtime ? [['Overtime', data.overtime.toFixed(2)]] : []),
    ...(data.bonus ? [['Bonus', data.bonus.toFixed(2)]] : []),
  ]
  
  earnings.forEach(([label, amount]) => {
    page.drawText(label, {
      x: margin + 20,
      y,
      size: 10,
      font,
    })
    
    page.drawText(`RM ${amount}`, {
      x: width - margin - 100,
      y,
      size: 10,
      font,
    })
    
    y -= 15
  })
  
  page.drawText('Gross Salary', {
    x: margin,
    y,
    size: 10,
    font: boldFont,
  })
  
  page.drawText(`RM ${data.grossSalary.toFixed(2)}`, {
    x: width - margin - 100,
    y,
    size: 10,
    font: boldFont,
  })
  
  y -= 30
  
  // Deductions
  page.drawText('DEDUCTIONS', {
    x: margin,
    y,
    size: 12,
    font: boldFont,
  })
  
  y -= 20
  
  const deductions = [
    ['EPF (Employee)', data.epfEmployee.toFixed(2)],
    ['SOCSO (Employee)', data.socsoEmployee.toFixed(2)],
    ['PCB', data.pcb.toFixed(2)],
    ...(data.deductions ? [['Other Deductions', data.deductions.toFixed(2)]] : []),
  ]
  
  deductions.forEach(([label, amount]) => {
    page.drawText(label, {
      x: margin + 20,
      y,
      size: 10,
      font,
    })
    
    page.drawText(`RM ${amount}`, {
      x: width - margin - 100,
      y,
      size: 10,
      font,
    })
    
    y -= 15
  })
  
  page.drawText('Total Deductions', {
    x: margin,
    y,
    size: 10,
    font: boldFont,
  })
  
  page.drawText(`RM ${data.totalDeductions.toFixed(2)}`, {
    x: width - margin - 100,
    y,
    size: 10,
    font: boldFont,
  })
  
  y -= 30
  
  // Net Pay
  page.drawText('NET PAY', {
    x: margin,
    y,
    size: 14,
    font: boldFont,
  })
  
  page.drawText(`RM ${data.netPay.toFixed(2)}`, {
    x: width - margin - 100,
    y,
    size: 14,
    font: boldFont,
  })
  
  // Footer
  y = 50
  page.drawText('This is a computer-generated payslip.', {
    x: margin,
    y,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  })
  
  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

