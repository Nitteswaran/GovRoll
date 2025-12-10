# GovRoll - Malaysian Payroll & Compliance Generator

A complete SaaS web application for managing Malaysian payroll and generating compliance files (EPF, SOCSO, PCB) and payslips.

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Styling**: TailwindCSS + Shadcn UI
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Routing**: React Router
- **Backend**: Supabase (Database, Auth, Storage)
- **File Generation**: pdf-lib, custom generators

## Features

- ✅ Email/Password Authentication
- ✅ Company Profile Management
- ✅ Employee CRUD Operations
- ✅ Payroll Run Creation & Management
- ✅ Automatic Payroll Calculations (EPF, SOCSO, PCB)
- ✅ File Generators:
  - EPF File A (.txt)
  - SOCSO CSV (.csv)
  - PCB CP39 (.txt)
  - PDF Payslips
- ✅ Protected Routes
- ✅ Responsive Dashboard UI

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Supabase**
   - Create a new Supabase project
   - Copy your project URL and anon key
   - Create a `.env` file in the root directory:
     ```
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

3. **Set up Database Schema**
   
   Run these SQL commands in your Supabase SQL editor:

   ```sql
   -- Companies table
   CREATE TABLE companies (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     company_name TEXT NOT NULL,
     registration_number TEXT NOT NULL,
     epf_number TEXT,
     socso_number TEXT,
     income_tax_number TEXT,
     address TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Employees table
   CREATE TABLE employees (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     ic_number TEXT NOT NULL,
     bank_name TEXT NOT NULL,
     bank_account TEXT NOT NULL,
     base_salary DECIMAL(10, 2) NOT NULL,
     allowance DECIMAL(10, 2) NOT NULL DEFAULT 0,
     epf_rate_employee INTEGER DEFAULT 11,
     epf_rate_employer INTEGER DEFAULT 12,
     socso_category TEXT DEFAULT '1',
     pcb_category TEXT DEFAULT '1',
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Payroll runs table
   CREATE TABLE payroll_runs (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
     period TEXT NOT NULL,
     status TEXT DEFAULT 'draft',
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Payroll items table
   CREATE TABLE payroll_items (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     payroll_run_id UUID REFERENCES payroll_runs(id) ON DELETE CASCADE,
     employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
     overtime DECIMAL(10, 2),
     bonus DECIMAL(10, 2),
     deductions DECIMAL(10, 2),
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE(payroll_run_id, employee_id)
   );

   -- Enable Row Level Security
   ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
   ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
   ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
   ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;

   -- RLS Policies for companies
   CREATE POLICY "Users can view their own companies"
     ON companies FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert their own companies"
     ON companies FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can update their own companies"
     ON companies FOR UPDATE
     USING (auth.uid() = user_id);

   -- RLS Policies for employees
   CREATE POLICY "Users can view employees of their companies"
     ON employees FOR SELECT
     USING (
       company_id IN (
         SELECT id FROM companies WHERE user_id = auth.uid()
       )
     );

   CREATE POLICY "Users can insert employees to their companies"
     ON employees FOR INSERT
     WITH CHECK (
       company_id IN (
         SELECT id FROM companies WHERE user_id = auth.uid()
       )
     );

   CREATE POLICY "Users can update employees of their companies"
     ON employees FOR UPDATE
     USING (
       company_id IN (
         SELECT id FROM companies WHERE user_id = auth.uid()
       )
     );

   CREATE POLICY "Users can delete employees of their companies"
     ON employees FOR DELETE
     USING (
       company_id IN (
         SELECT id FROM companies WHERE user_id = auth.uid()
       )
     );

   -- RLS Policies for payroll_runs
   CREATE POLICY "Users can view payroll runs of their companies"
     ON payroll_runs FOR SELECT
     USING (
       company_id IN (
         SELECT id FROM companies WHERE user_id = auth.uid()
       )
     );

   CREATE POLICY "Users can insert payroll runs to their companies"
     ON payroll_runs FOR INSERT
     WITH CHECK (
       company_id IN (
         SELECT id FROM companies WHERE user_id = auth.uid()
       )
     );

   CREATE POLICY "Users can update payroll runs of their companies"
     ON payroll_runs FOR UPDATE
     USING (
       company_id IN (
         SELECT id FROM companies WHERE user_id = auth.uid()
       )
     );

   -- RLS Policies for payroll_items
   CREATE POLICY "Users can view payroll items of their companies"
     ON payroll_items FOR SELECT
     USING (
       payroll_run_id IN (
         SELECT pr.id FROM payroll_runs pr
         JOIN companies c ON pr.company_id = c.id
         WHERE c.user_id = auth.uid()
       )
     );

   CREATE POLICY "Users can insert payroll items to their companies"
     ON payroll_items FOR INSERT
     WITH CHECK (
       payroll_run_id IN (
         SELECT pr.id FROM payroll_runs pr
         JOIN companies c ON pr.company_id = c.id
         WHERE c.user_id = auth.uid()
       )
     );

   CREATE POLICY "Users can update payroll items of their companies"
     ON payroll_items FOR UPDATE
     USING (
       payroll_run_id IN (
         SELECT pr.id FROM payroll_runs pr
         JOIN companies c ON pr.company_id = c.id
         WHERE c.user_id = auth.uid()
       )
     );

   CREATE POLICY "Users can delete payroll items of their companies"
     ON payroll_items FOR DELETE
     USING (
       payroll_run_id IN (
         SELECT pr.id FROM payroll_runs pr
         JOIN companies c ON pr.company_id = c.id
         WHERE c.user_id = auth.uid()
       )
     );
   ```

4. **Set up Storage Buckets** (Optional - for file storage)
   
   In Supabase Dashboard:
   - Go to Storage
   - Create bucket: `submissions` (public)
   - Create bucket: `payslips` (public)

5. **Run Development Server**
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/
│   ├── ui/              # Shadcn UI components
│   └── layout/           # Layout components
├── pages/
│   ├── auth/             # Authentication pages
│   └── dashboard/        # Dashboard pages
├── lib/
│   ├── supabase.ts       # Supabase client
│   ├── protected-route.tsx
│   ├── payroll-calculator.ts
│   ├── file-generators/  # File generation utilities
│   └── pdf.ts            # PDF generation
├── store/                # Zustand stores
├── hooks/                # Custom hooks
├── App.tsx
└── main.tsx
```

## Usage

1. **Register/Login**: Create an account or login
2. **Create Company**: Set up your company profile
3. **Add Employees**: Add employees with their details
4. **Create Payroll Run**: Create a monthly payroll run
5. **Add Payroll Items**: Add employees to the run and adjust overtime/bonus/deductions
6. **Generate Files**: Download EPF, SOCSO, PCB files and payslips

## Notes

- The payroll calculations use simplified formulas. For production, you may need to implement the full Malaysian tax brackets and rules.
- File formats follow standard Malaysian compliance formats but should be verified with official requirements.
- Edge Functions are not included in this MVP but can be added for server-side file generation if needed.

## Premium Features

GovRoll now includes Premium subscription features:

- ✅ Multi-Company & Multi-User Management
- ✅ Auto Payroll Scheduling
- ✅ Bulk Payslip Distribution
- ✅ Anomaly Detection
- ✅ Custom Report Generator
- ✅ Automation Rules
- ✅ Audit Logs & Versioning

See [PREMIUM_FEATURES.md](./PREMIUM_FEATURES.md) for complete documentation.

### Stripe Integration

Premium features require a Stripe subscription (RM79/month). Set up:

1. Create Stripe account and get API keys
2. Add to `.env`:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   VITE_STRIPE_PRICE_PREMIUM=price_...
   ```
3. Configure webhook in Stripe Dashboard
4. Deploy `stripe-webhook` Edge Function

## License

MIT

## GovRoll AI – Live Autonomous HR Agent (Planned)

GovRoll AI is a planned intelligent agent that will live inside the GovRoll payroll system and perform complex HR and payroll tasks on command. Instead of just answering questions or generating static reports, it will:

- Retrieve live data from your system and display it dynamically (e.g. last month’s OT for a specific employee).
- Generate payroll-related documents (EPF, SOCSO, payslips) and other compliance reports automatically.
- Execute multi-step tasks by interacting with the database and internal pages like a human-like agent.
- Provide contextual answers to Malaysian compliance questions and HR best practices.

In short, the AI acts as a live assistant that observes, reasons, and acts on your payroll data in real time, responding to natural-language prompts from managers or HR.

### Recommended RAG + Agent Tech Stack (Draft)

- **Base Model**
  - LLaMA 3 8B (local inference or free/low-cost cloud, e.g. vLLM, Hugging Face)
  - Supports fine-tuning and custom embeddings if needed

- **Vector Store / Knowledge Base**
  - Supabase + `pgvector` for:
    - Structured employee + payroll data
    - Past reports
    - Compliance documents and HR manuals
  - Used for RAG retrieval during reasoning

- **Agent Orchestration / Action Execution**
  - LangChain (Node.js or Python) for chaining reasoning + tool calls:
    - Fetch data from Supabase
    - Generate documents
    - Stream results back to the UI
  - Define tool wrappers such as:
    - `getEmployeeOT(employeeId)`
    - `generateEPFReport(employeeId | companyId)`

- **Embeddings / RAG Layer**
  - Convert internal HR manuals, compliance PDFs, and historical payroll data into embeddings.
  - Use Gemini or LLaMA-based embeddings (local or hosted).

- **Frontend Interaction**
  - React / (optionally Next.js for future) UI that streams AI actions live (Cursor-style):
    - Show progress while the AI fetches data, generates PDFs, or visualizes stats.
    - Allow step-by-step confirmations from HR/management for sensitive actions.

- **PDF / Report Generation**
  - `pdf-lib` or `jsPDF` for dynamic PDF and report creation (aligned with existing GovRoll generators).

- **Security & Compliance**
  - Row-level security (RLS) and row-level access control in Supabase so the agent only sees allowed data.
  - Full action logging for audit and compliance review (what the AI accessed, generated, or changed).

> This section is design/reference only for now and will guide the future GovRoll AI implementation.

