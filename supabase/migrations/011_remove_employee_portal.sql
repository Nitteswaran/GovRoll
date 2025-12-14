-- 011_remove_employee_portal.sql
-- Remove Employee Portal features
-- Dropping tables and columns added for employee login and self-service.

-- Drop tables
DROP TABLE IF EXISTS employee_invites;
DROP TABLE IF EXISTS employee_accounts;

-- Drop dependent policies first
DROP POLICY IF EXISTS "Employees can view their own payslips" ON payslips;
DROP POLICY IF EXISTS "Employees can view their own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Employees can create leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Employees can view their own attendance" ON attendance;
DROP POLICY IF EXISTS "Employees can clock in/out" ON attendance;

DROP POLICY IF EXISTS "Employees can view their own profile" ON employees;
DROP POLICY IF EXISTS "Employees can update their own profile" ON employees;

-- Remove auth_user_id from employees and cascade to policies
ALTER TABLE employees DROP COLUMN IF EXISTS auth_user_id CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS accept_company_invitation;
DROP FUNCTION IF EXISTS get_my_invitations;
DROP FUNCTION IF EXISTS sync_employee_identity;
DROP FUNCTION IF EXISTS get_user_id_by_email;

-- Revert/Fix manual.sql idempotent policy if needed (it was added there)
-- Safe to assume above DROP POLICY handles it if named correctly.

-- Ensure attendance/payslips/leave_requests remain but remove employee-specific policies if any?
-- Employee view policies usually rely on auth_user_id check or similar.
-- Checking 002_employee_extension.sql:
-- "Employers can view attendance for their companies" -> relies on company_id -> KEEP.
-- Payslips: "Employers can manage payslips" -> KEEP.
-- Leave Requests: "Employers can manage..." -> KEEP.

-- If there were any policies allowing employees to view their own payslips, they should be dropped.
-- Based on previous file reads, I didn't see explicit "Employee view" policies for payslips in 002.
