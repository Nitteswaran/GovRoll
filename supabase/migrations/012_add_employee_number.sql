-- Add employee_number to employees table
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS employee_number TEXT;

-- Add constraint to ensure employee_number is unique per company
-- This prevents duplicates within the same company
ALTER TABLE employees
ADD CONSTRAINT employees_company_id_employee_number_key UNIQUE (company_id, employee_number);

-- Update RLS policies?
-- Existing policies cover INSERT based on company_id, so they should apply to this new column as well.
