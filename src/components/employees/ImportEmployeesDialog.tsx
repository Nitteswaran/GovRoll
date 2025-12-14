import { useState } from 'react'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useCompanyStore } from '@/store/company-store'

interface ImportEmployeesDialogProps {
    onSuccess: () => void
}

interface CSVRow {
    EmployeeID: string
    FirstName: string
    LastName: string
    Email: string
    Position: string
    Salary: string
    BankName: string
    BankAccount: string
}

interface ValidationError {
    row: number
    message: string
}

export function ImportEmployeesDialog({ onSuccess }: ImportEmployeesDialogProps) {
    const [open, setOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [parsedData, setParsedData] = useState<CSVRow[]>([])
    const [errors, setErrors] = useState<ValidationError[]>([])
    const [uploading, setUploading] = useState(false)
    const { company } = useCompanyStore()
    const { toast } = useToast()

    const resetState = () => {
        setFile(null)
        setParsedData([])
        setErrors([])
        setUploading(false)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast({
                    title: 'Error',
                    description: 'File size exceeds 5MB limit',
                    variant: 'destructive',
                })
                return
            }
            setFile(selectedFile)
            parseCSV(selectedFile)
        }
    }

    const parseCSV = (file: File) => {
        Papa.parse<CSVRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const rows = results.data
                setParsedData(rows)
                validateRows(rows)
            },
            error: (error) => {
                toast({
                    title: 'Error Parsing CSV',
                    description: error.message,
                    variant: 'destructive',
                })
            },
        })
    }

    const validateRows = (rows: CSVRow[]) => {
        const newErrors: ValidationError[] = []
        const employeeIds = new Set<string>()

        rows.forEach((row, index) => {
            const rowNum = index + 1

            // Required fields
            if (!row.EmployeeID || !row.FirstName || !row.LastName || !row.Email || !row.Salary) {
                newErrors.push({ row: rowNum, message: 'Missing required fields' })
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (row.Email && !emailRegex.test(row.Email)) {
                newErrors.push({ row: rowNum, message: 'Invalid email format' })
            }

            // Salary validation
            if (row.Salary && isNaN(parseFloat(row.Salary))) {
                newErrors.push({ row: rowNum, message: 'Salary must be a number' })
            }

            // Duplicate ID check within file
            if (row.EmployeeID) {
                if (employeeIds.has(row.EmployeeID)) {
                    newErrors.push({ row: rowNum, message: 'Duplicate EmployeeID in file' })
                }
                employeeIds.add(row.EmployeeID)
            }
        })

        setErrors(newErrors)
    }

    const handleImport = async () => {
        if (!company) return
        if (errors.length > 0) {
            toast({
                title: 'Validation Errors',
                description: 'Please fix the errors before importing.',
                variant: 'destructive',
            })
            return
        }

        setUploading(true)
        let successCount = 0
        let failCount = 0

        try {
            // Prepare data for insertion
            const attempts = parsedData.map(async (row) => {
                const { error } = await supabase.from('employees').insert({
                    company_id: company.id,
                    employee_number: row.EmployeeID,
                    name: `${row.FirstName} ${row.LastName}`,
                    email: row.Email,
                    position: row.Position,
                    base_salary: parseFloat(row.Salary),
                    bank_name: row.BankName || 'N/A', // Default if missing
                    bank_account: row.BankAccount || 'N/A',
                    ic_number: 'N/A', // Not in CSV requirement, defaulting
                })

                if (error) throw error
            })

            const results = await Promise.allSettled(attempts)

            results.forEach((result) => {
                if (result.status === 'fulfilled') {
                    successCount++
                } else {
                    failCount++
                    console.error(result.reason)
                }
            })

            if (successCount > 0) {
                toast({
                    title: 'Import Completed',
                    description: `Successfully imported ${successCount} employees. ${failCount} failed.`,
                })
                onSuccess()
                setOpen(false)
                resetState()
            } else {
                toast({
                    title: 'Import Failed',
                    description: `All ${failCount} rows failed to import. Check console for details.`,
                    variant: 'destructive',
                })
            }

        } catch (error: any) {
            toast({
                title: 'Import Error',
                description: error.message || 'An unexpected error occurred',
                variant: 'destructive',
            })
        } finally {
            setUploading(false)
        }
    }

    const downloadTemplate = () => {
        const headers = ['EmployeeID', 'FirstName', 'LastName', 'Email', 'Position', 'Salary', 'BankName', 'BankAccount']
        const csvContent = headers.join(',') + '\n' + 'EMP001,John,Doe,john@example.com,Software Engineer,5000,Maybank,1234567890'
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'employee_import_template.csv'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val)
            if (!val) resetState()
        }}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Bulk Import Employees</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file to add multiple employees at once.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex justify-end">
                        <Button variant="link" onClick={downloadTemplate} className="text-sm">
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Download Template
                        </Button>
                    </div>

                    {!file ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:bg-gray-50 transition-colors">
                            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">Upload CSV File</h3>
                            <p className="text-sm text-gray-500 mt-1">Drag and drop or click to select</p>
                            <Input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                id="file-upload"
                                onChange={handleFileChange}
                            />
                            <Label htmlFor="file-upload" >
                                <Button variant="secondary" className="mt-4 pointer-events-none">Select File</Button>
                            </Label>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                                    <div>
                                        <p className="font-medium">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={resetState}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {errors.length > 0 && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Validation Errors</AlertTitle>
                                    <AlertDescription>
                                        Found {errors.length} errors. Please correct your CSV and upload again.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {parsedData.length > 0 && (
                                <div className="border rounded-md max-h-[300px] overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Row</TableHead>
                                                <TableHead>ID</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Salary</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {parsedData.slice(0, 5).map((row, i) => {
                                                const rowErrors = errors.filter(e => e.row === i + 1)
                                                const hasError = rowErrors.length > 0
                                                return (
                                                    <TableRow key={i} className={hasError ? 'bg-red-50' : ''}>
                                                        <TableCell>{i + 1}</TableCell>
                                                        <TableCell>{row.EmployeeID}</TableCell>
                                                        <TableCell>{row.FirstName} {row.LastName}</TableCell>
                                                        <TableCell>{row.Email}</TableCell>
                                                        <TableCell>{row.Salary}</TableCell>
                                                        <TableCell>
                                                            {hasError ? (
                                                                <span className="text-red-600 text-xs flex items-center">
                                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                                    {rowErrors[0].message}
                                                                </span>
                                                            ) : (
                                                                <span className="text-green-600 text-xs flex items-center">
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    Valid
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                            {parsedData.length > 5 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center text-gray-500 text-sm">
                                                        ... and {parsedData.length - 5} more rows
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleImport}
                        disabled={!file || errors.length > 0 || uploading}
                    >
                        {uploading ? 'Importing...' : `Import ${parsedData.length} Employees`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
