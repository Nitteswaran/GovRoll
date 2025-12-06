import Decimal from 'decimal.js'

// EPF Rates (Employee/Employer)
const EPF_RATES: Record<number, { employee: number; employer: number }> = {
  11: { employee: 11, employer: 12 },
  12: { employee: 12, employer: 13 },
}

// SOCSO Categories and Rates
const SOCSO_CATEGORIES: Record<string, { employee: number; employer: number; maxWage: number }> = {
  '1': { employee: 0.5, employer: 1.75, maxWage: 5000 },
  '2': { employee: 0.5, employer: 1.75, maxWage: 5000 },
  '3': { employee: 0.5, employer: 1.75, maxWage: 5000 },
}

// PCB Tax Brackets (simplified - actual brackets are more complex)
const PCB_BRACKETS = [
  { min: 0, max: 5000, rate: 0 },
  { min: 5001, max: 20000, rate: 1 },
  { min: 20001, max: 35000, rate: 3 },
  { min: 35001, max: 50000, rate: 6 },
  { min: 50001, max: 70000, rate: 11 },
  { min: 70001, max: 100000, rate: 19 },
  { min: 100001, max: Infinity, rate: 25 },
]

export interface PayrollItem {
  baseSalary: number
  allowance: number
  overtime?: number
  bonus?: number
  deductions?: number
  epfRate: number
  socsoCategory: string
  pcbCategory: string
}

export function calcEPF(grossSalary: number, epfRate: number): { employee: number; employer: number } {
  const rate = EPF_RATES[epfRate] || EPF_RATES[11]
  const maxContribution = 6000 // EPF maximum contribution base
  
  const contributionBase = Decimal.min(new Decimal(grossSalary), new Decimal(maxContribution))
  const employee = contributionBase.mul(rate.employee).div(100).toDecimalPlaces(2)
  const employer = contributionBase.mul(rate.employer).div(100).toDecimalPlaces(2)
  
  return {
    employee: employee.toNumber(),
    employer: employer.toNumber(),
  }
}

export function calcSOCSO(grossSalary: number, category: string): { employee: number; employer: number } {
  const socso = SOCSO_CATEGORIES[category] || SOCSO_CATEGORIES['1']
  const contributionBase = Decimal.min(new Decimal(grossSalary), new Decimal(socso.maxWage))
  
  const employee = contributionBase.mul(socso.employee).div(100).toDecimalPlaces(2)
  const employer = contributionBase.mul(socso.employer).div(100).toDecimalPlaces(2)
  
  return {
    employee: employee.toNumber(),
    employer: employer.toNumber(),
  }
}

export function calcPCB(grossSalary: number, epfDeduction: number, socsoDeduction: number): number {
  const taxableIncome = new Decimal(grossSalary)
    .minus(epfDeduction)
    .minus(socsoDeduction)
    .minus(9000) // Personal relief (simplified)
    .toNumber()

  if (taxableIncome <= 0) return 0

  for (const bracket of PCB_BRACKETS) {
    if (taxableIncome > bracket.min && taxableIncome <= bracket.max) {
      const tax = new Decimal(taxableIncome)
        .minus(bracket.min)
        .mul(bracket.rate)
        .div(100)
        .toDecimalPlaces(2)
      return tax.toNumber()
    }
  }

  return 0
}

export function totalEarnings(item: PayrollItem): number {
  return new Decimal(item.baseSalary)
    .plus(item.allowance || 0)
    .plus(item.overtime || 0)
    .plus(item.bonus || 0)
    .toNumber()
}

export function totalDeductions(item: PayrollItem, epf: number, socso: number, pcb: number): number {
  return new Decimal(epf)
    .plus(socso)
    .plus(pcb)
    .plus(item.deductions || 0)
    .toNumber()
}

export function netPay(item: PayrollItem): {
  grossSalary: number
  epf: { employee: number; employer: number }
  socso: { employee: number; employer: number }
  pcb: number
  totalDeductions: number
  netPay: number
} {
  const grossSalary = totalEarnings(item)
  const epf = calcEPF(grossSalary, item.epfRate)
  const socso = calcSOCSO(grossSalary, item.socsoCategory)
  const pcb = calcPCB(grossSalary, epf.employee, socso.employee)
  const deductions = totalDeductions(item, epf.employee, socso.employee, pcb)
  const net = new Decimal(grossSalary).minus(deductions).toNumber()

  return {
    grossSalary,
    epf,
    socso,
    pcb,
    totalDeductions: deductions,
    netPay: net,
  }
}

