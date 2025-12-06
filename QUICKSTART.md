# GovRoll Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)

## Step 1: Clone and Install

```bash
# Install dependencies
npm install
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (takes ~2 minutes)
3. Go to Project Settings > API
4. Copy your:
   - Project URL
   - Anon/Public key

## Step 3: Configure Environment

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Set Up Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Run the SQL script

This will create:
- `companies` table
- `employees` table
- `payroll_runs` table
- `payroll_items` table
- Row Level Security (RLS) policies

## Step 5: Set Up Storage (Optional)

1. Go to Storage in Supabase dashboard
2. Create a new bucket named `submissions` (public)
3. Create a new bucket named `payslips` (public)

## Step 6: Run the Application

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Step 7: Create Your First Account

1. Navigate to `/register`
2. Create an account with your email
3. Check your email for verification (if email confirmation is enabled)
4. Login at `/login`

## Step 8: Get Started

1. **Create Company Profile**: Go to Dashboard > Company
2. **Add Employees**: Go to Dashboard > Employees
3. **Create Payroll Run**: Go to Dashboard > Payroll
4. **Generate Files**: Open a payroll run and generate EPF, SOCSO, PCB files

## Troubleshooting

### "Supabase URL and Anon Key must be set"
- Make sure your `.env` file is in the root directory
- Restart the dev server after creating `.env`

### "Failed to fetch" errors
- Check that your Supabase project is active
- Verify your environment variables are correct
- Check browser console for detailed error messages

### Database errors
- Make sure you ran the SQL migration script
- Check that RLS policies are enabled
- Verify your user is authenticated

## Next Steps

- Customize payroll calculation formulas in `src/lib/payroll-calculator.ts`
- Adjust file formats in `src/lib/file-generators/`
- Deploy Edge Functions (see Supabase docs)
- Customize UI colors in `tailwind.config.js`

## Support

For issues or questions, check the main README.md file.

