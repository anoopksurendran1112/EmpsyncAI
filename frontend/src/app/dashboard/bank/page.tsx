"use client"

import React, { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Landmark, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface BankDetail {
  id: number
  acc_holder_fname: string
  acc_holder_mname?: string
  acc_holder_lname: string
  bank_name: string
  account_number: string
  ifsc_code: string
  branch_name?: string
  is_primary: boolean
}

export default function BankAccountPage() {
  const [banks, setBanks] = useState<BankDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBank, setEditingBank] = useState<BankDetail | null>(null)
  
  const { toast } = useToast()

  // Form states
  const [formData, setFormData] = useState({
    acc_holder_fname: '',
    acc_holder_mname: '',
    acc_holder_lname: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    branch_name: '',
    is_primary: false
  })

  const fetchBanks = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/manage-banks/')
      const result = await response.json()
      if (result.success) {
        setBanks(result.data)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "Failed to fetch bank accounts",
        })
      }
    } catch (error) {
      console.error('Fetch error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong while fetching data.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBanks()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitLoading(true)
    
    const method = editingBank ? 'PUT' : 'POST'
    const payload = editingBank ? { ...formData, id: editingBank.id } : formData

    try {
      const response = await fetch('/api/manage-banks/', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: editingBank ? "Bank account updated" : "Bank account added",
        })
        setIsDialogOpen(false)
        resetForm()
        fetchBanks()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "Action failed",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      })
    } finally {
      setIsSubmitLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this bank account?')) return

    try {
      const response = await fetch(`/api/manage-banks/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Deleted",
          description: "Bank account removed successfully",
        })
        fetchBanks()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "Failed to delete",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete bank account.",
      })
    }
  }

  const handleEdit = (bank: BankDetail) => {
    setEditingBank(bank)
    setFormData({
      acc_holder_fname: bank.acc_holder_fname,
      acc_holder_mname: bank.acc_holder_mname || '',
      acc_holder_lname: bank.acc_holder_lname,
      bank_name: bank.bank_name,
      account_number: bank.account_number,
      ifsc_code: bank.ifsc_code,
      branch_name: bank.branch_name || '',
      is_primary: bank.is_primary
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingBank(null)
    setFormData({
      acc_holder_fname: '',
      acc_holder_mname: '',
      acc_holder_lname: '',
      bank_name: '',
      account_number: '',
      ifsc_code: '',
      branch_name: '',
      is_primary: false
    })
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bank Accounts</h1>
          <p className="text-muted-foreground">Manage your bank details for payments and payroll.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingBank ? 'Edit Bank Account' : 'Add New Bank Account'}</DialogTitle>
                <DialogDescription>
                  Enter the details of your bank account.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="acc_holder_fname">Acc Holder First Name</Label>
                  <Input 
                    id="acc_holder_fname" 
                    name="acc_holder_fname" 
                    value={formData.acc_holder_fname} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="acc_holder_mname">Acc Holder Middle Name <span className="text-gray-500 font-normal text-xs">*Optional</span></Label>
                  <Input 
                    id="acc_holder_mname" 
                    name="acc_holder_mname" 
                    value={formData.acc_holder_mname} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="acc_holder_lname">Acc Holder Last Name</Label>
                  <Input 
                    id="acc_holder_lname" 
                    name="acc_holder_lname" 
                    value={formData.acc_holder_lname} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input 
                    id="bank_name" 
                    name="bank_name" 
                    value={formData.bank_name} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                    <Label htmlFor="branch_name">Branch Name</Label>
                    <Input 
                        id="branch_name" 
                        name="branch_name" 
                        value={formData.branch_name} 
                        onChange={handleInputChange} 
                    />
                    </div>
                    <div className="grid gap-2">
                    <Label htmlFor="ifsc_code">IFSC Code</Label>
                    <Input 
                        id="ifsc_code" 
                        name="ifsc_code" 
                        value={formData.ifsc_code} 
                        onChange={handleInputChange} 
                        required 
                    />
                    </div>
                </div>
                <div className="grid gap-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input 
                    id="account_number" 
                    name="account_number" 
                    value={formData.account_number} 
                    onChange={handleInputChange} 
                    required 
                />
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="is_primary" 
                    name="is_primary" 
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={formData.is_primary} 
                    onChange={handleInputChange} 
                  />
                  <Label htmlFor="is_primary" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Set as Primary Account
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitLoading}>
                  {isSubmitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingBank ? 'Update Account' : 'Save Account'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Linked Accounts</CardTitle>
          <CardDescription>A list of all bank accounts associated with your profile.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Fetching your accounts...</p>
            </div>
          ) : banks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg bg-muted/30">
              <Landmark className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <p className="font-semibold text-lg">No Bank Accounts Found</p>
              <p className="text-sm text-muted-foreground mb-4">You haven't added any bank accounts yet.</p>
              <Button variant="outline" onClick={() => setIsDialogOpen(true)}>Add your first account</Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Account Holder</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>IFSC</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banks.map((bank) => (
                    <TableRow key={bank.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        {`${bank.acc_holder_fname} ${bank.acc_holder_mname ? bank.acc_holder_mname + ' ' : ''}${bank.acc_holder_lname}`}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{bank.bank_name}</span>
                          <span className="text-xs text-muted-foreground">{bank.branch_name || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{bank.ifsc_code}</TableCell>
                      <TableCell className="font-mono text-sm">{bank.account_number}</TableCell>
                      <TableCell>
                        {bank.is_primary ? (
                          <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                            Primary
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-500 hover:bg-gray-100">
                            Secondary
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(bank)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(bank.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}