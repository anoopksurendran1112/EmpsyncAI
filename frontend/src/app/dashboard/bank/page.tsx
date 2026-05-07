"use client"

import React, { useState, useEffect } from 'react'
import { 
  Plus, Pencil, Trash2, Landmark, Building2, CreditCard, Banknote, 
  Loader2, CheckCircle2, Circle, User, Hash, MapPin, CreditCard as CardIcon 
} from 'lucide-react'
import { Button } from "@/components/ui/button"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

const getFullName = (bank: BankDetail) => {
  return `${bank.acc_holder_fname} ${bank.acc_holder_mname ? bank.acc_holder_mname + ' ' : ''}${bank.acc_holder_lname}`
}

const getBankColor = (bankName: string) => {
  const colors = [
    'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-gradient-to-br from-emerald-500 to-emerald-600',
    'bg-gradient-to-br from-purple-500 to-purple-600',
    'bg-gradient-to-br from-amber-500 to-amber-600',
    'bg-gradient-to-br from-rose-500 to-rose-600',
    'bg-gradient-to-br from-indigo-500 to-indigo-600',
    'bg-gradient-to-br from-teal-500 to-teal-600',
  ]
  let hash = 0
  for (let i = 0; i < bankName.length; i++) {
    hash = ((hash << 5) - hash) + bankName.charCodeAt(i)
    hash |= 0
  }
  return colors[Math.abs(hash) % colors.length]
}

// ✅ Updated BankAccountCard with Green for Primary, Red for Secondary
const BankAccountCard = ({ bank, onEdit, onDelete }: { bank: BankDetail; onEdit: (bank: BankDetail) => void; onDelete: (id: number) => void }) => {
  const bankColorClass = getBankColor(bank.bank_name)
  const firstLetter = bank.bank_name.charAt(0).toUpperCase()
  const isPrimary = bank.is_primary

  return (
    <div className="group relative rounded-xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
      {/* Top accent bar - Green for Primary, Red for Secondary */}
      <div className={`h-2 w-full ${
        isPrimary 
          ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' 
          : 'bg-gradient-to-r from-rose-500 to-red-600'
      }`} />
      
      <div className="p-5 space-y-4">
        {/* Header with Bank Icon + Name & Actions */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bankColorClass} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
              {firstLetter}
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800 tracking-tight">{bank.bank_name}</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {bank.branch_name || "Main Branch"}
              </p>
            </div>
          </div>
          <div className="flex gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" onClick={() => onEdit(bank)} className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50">
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(bank.id)} className="h-8 w-8 text-gray-500 hover:text-rose-600 hover:bg-rose-50">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Primary / Secondary Badge - Green for Primary, Red for Secondary */}
        <div>
          {isPrimary ? (
            <Badge className="bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-0 shadow-sm gap-1 px-3 py-1">
              <CheckCircle2 className="w-3 h-3" /> Primary Account
            </Badge>
          ) : (
            <Badge className="bg-gradient-to-r from-rose-100 to-red-200 text-red-800 border-0 shadow-sm gap-1 px-3 py-1">
              <Circle className="w-3 h-3" /> Secondary Account
            </Badge>
          )}
        </div>

        {/* Account Details */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <User className="w-4 h-4" />
              <span>Account Holder</span>
            </div>
            <span className="font-semibold text-gray-800 text-sm">{getFullName(bank)}</span>
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <CardIcon className="w-4 h-4" />
              <span>Account Number</span>
            </div>
            <span className="font-mono font-bold text-gray-800 text-sm tracking-wider">{bank.account_number}</span>
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Hash className="w-4 h-4" />
              <span>IFSC Code</span>
            </div>
            <span className="font-mono font-medium text-gray-800 text-sm">{bank.ifsc_code}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Landmark className="w-4 h-4" />
              <span>Account Type</span>
            </div>
            <span className="text-sm font-medium text-gray-700">Savings Account</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BankAccountPage() {
  const [banks, setBanks] = useState<BankDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBank, setEditingBank] = useState<BankDetail | null>(null)
  
  const { toast } = useToast()

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

  const totalAccounts = banks.length
  const primaryAccounts = banks.filter(b => b.is_primary).length
  const secondaryAccounts = banks.filter(b => !b.is_primary).length
  const totalBanks = new Set(banks.map(b => b.bank_name)).size

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/40 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
              <Landmark className="w-4 h-4" />
              <span>Dashboard / Banking</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Bank Accounts
              </span>
            </h1>
            <p className="text-gray-500 mt-2 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Securely manage your payment & payroll accounts
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-6">
                <Plus className="w-4 h-4" /> Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl border-0 shadow-2xl">
              <form onSubmit={handleSubmit}>
                <DialogHeader className="pb-2">
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {editingBank ? 'Edit Account' : 'New Account'}
                  </DialogTitle>
                  <DialogDescription>
                    Fill in the bank account details below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">Full Name</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Input 
                        placeholder="First" 
                        name="acc_holder_fname" 
                        value={formData.acc_holder_fname} 
                        onChange={handleInputChange} 
                        required 
                        className="rounded-lg border-gray-200 focus:border-indigo-300"
                      />
                      <Input 
                        placeholder="Last" 
                        name="acc_holder_lname" 
                        value={formData.acc_holder_lname} 
                        onChange={handleInputChange} 
                        required 
                        className="rounded-lg border-gray-200 focus:border-indigo-300"
                      />
                    </div>
                    <Input 
                      placeholder="Middle Name (Optional)" 
                      name="acc_holder_mname" 
                      value={formData.acc_holder_mname} 
                      onChange={handleInputChange} 
                      className="rounded-lg border-gray-200 focus:border-indigo-300"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">Bank Details</Label>
                    <Input 
                      placeholder="Bank Name" 
                      name="bank_name" 
                      value={formData.bank_name} 
                      onChange={handleInputChange} 
                      required 
                      className="rounded-lg border-gray-200 focus:border-indigo-300"
                    />
                    <Input 
                      placeholder="Branch Name" 
                      name="branch_name" 
                      value={formData.branch_name} 
                      onChange={handleInputChange} 
                      className="rounded-lg border-gray-200 focus:border-indigo-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">Account Information</Label>
                    <Input 
                      placeholder="Account Number" 
                      name="account_number" 
                      value={formData.account_number} 
                      onChange={handleInputChange} 
                      required 
                      className="rounded-lg border-gray-200 focus:border-indigo-300"
                    />
                    <Input 
                      placeholder="IFSC Code" 
                      name="ifsc_code" 
                      value={formData.ifsc_code} 
                      onChange={handleInputChange} 
                      required 
                      className="rounded-lg border-gray-200 focus:border-indigo-300 uppercase"
                    />
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-indigo-50/50 rounded-xl">
                    <input 
                      type="checkbox" 
                      id="is_primary" 
                      name="is_primary" 
                      className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={formData.is_primary} 
                      onChange={handleInputChange} 
                    />
                    <Label htmlFor="is_primary" className="text-sm font-medium text-gray-700">
                      Set as Primary Account
                    </Label>
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={isSubmitLoading} className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-full px-8">
                    {isSubmitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingBank ? 'Update Account' : 'Save Account'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards (unchanged) */}
        <div className="grid gap-5 md:grid-cols-4">
          <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden relative">
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-blue-200/50 blur-2xl"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
              <CardTitle className="text-sm font-semibold text-blue-800">Total Accounts</CardTitle>
              <CreditCard className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{totalAccounts}</div>
              <p className="text-xs text-blue-700/70 mt-1">Linked accounts</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden relative">
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-emerald-200/50 blur-2xl"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-emerald-800">Primary Accounts</CardTitle>
              <Banknote className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900">{primaryAccounts}</div>
              <p className="text-xs text-emerald-700/70">Active primary</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-rose-50 to-red-100/50 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden relative">
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-rose-200/50 blur-2xl"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-rose-800">Secondary Accounts</CardTitle>
              <Building2 className="h-5 w-5 text-rose-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-rose-900">{secondaryAccounts}</div>
              <p className="text-xs text-rose-700/70">Additional accounts</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden relative">
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-purple-200/50 blur-2xl"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-purple-800">Total Banks</CardTitle>
              <Landmark className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{totalBanks}</div>
              <p className="text-xs text-purple-700/70">Unique institutions</p>
            </CardContent>
          </Card>
        </div>

        {/* Accounts List */}
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-gray-200/80 pb-3">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
              All Accounts
            </h2>
            {!isLoading && banks.length > 0 && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600 rounded-full px-3 py-1">
                {banks.length} total
              </Badge>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-inner">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Fetching your accounts...</p>
            </div>
          ) : banks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                <Landmark className="w-8 h-8 text-gray-400" />
              </div>
              <p className="font-semibold text-xl text-gray-700">No Bank Accounts Found</p>
              <p className="text-sm text-gray-500 mb-6 mt-1">Add your first account to get started.</p>
              <Button variant="outline" onClick={() => setIsDialogOpen(true)} className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-50">
                + Add Account
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
              {banks.map((bank) => (
                <BankAccountCard
                  key={bank.id}
                  bank={bank}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
          
          {!isLoading && banks.length > 0 && (
            <div className="flex justify-end pt-4 text-sm text-gray-400 border-t border-gray-100">
              <span>Showing {banks.length} of {banks.length} accounts</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}