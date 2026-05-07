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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

const PREDEFINED_BANKS = [
  { name: "State Bank of India", domain: "sbi.co.in" },
  { name: "HDFC Bank", domain: "hdfcbank.com" },
  { name: "ICICI Bank", domain: "icicibank.com" },
  { name: "Axis Bank", domain: "axisbank.com" },
  { name: "Kotak Mahindra Bank", domain: "kotak.com" },
  { name: "Punjab National Bank", domain: "pnbindia.in" },
  { name: "Bank of Baroda", domain: "bankofbaroda.in" },
  { name: "Canara Bank", domain: "canarabank.com" },
  { name: "Union Bank of India", domain: "unionbankofindia.co.in" },
  { name: "IndusInd Bank", domain: "indusind.com" },
  { name: "IDBI Bank", domain: "idbibank.in" },
  { name: "Yes Bank", domain: "yesbank.in" },
  { name: "IDFC FIRST Bank", domain: "idfcfirstbank.com" },
  { name: "Federal Bank", domain: "federalbank.co.in" },
  { name: "South Indian Bank", domain: "southindianbank.com" },
];

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

// ✅ Updated BankAccountCard with Logo integration
const BankAccountCard = ({ bank, onEdit, onDelete }: { bank: BankDetail; onEdit: (bank: BankDetail) => void; onDelete: (id: number) => void }) => {
  const bankColorClass = getBankColor(bank.bank_name)
  const firstLetter = bank.bank_name.charAt(0).toUpperCase()
  const isPrimary = bank.is_primary

  // Try to find the domain for logo
  const bankInfo = PREDEFINED_BANKS.find(b => b.name === bank.bank_name);
  const logoUrl = bankInfo ? `https://www.google.com/s2/favicons?domain=${bankInfo.domain}&sz=128` : null;
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="group relative rounded-xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-xl overflow-hidden">
      {/* Top accent bar - Green for Primary, Blue for Secondary */}
      <div className={`h-2 w-full ${
        isPrimary 
          ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' 
          : 'bg-gradient-to-r from-blue-400 to-blue-600'
      }`} />
      
      <div className="p-5 space-y-4">
        {/* Header with Bank Icon + Name & Actions */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm ${!logoUrl || logoError ? bankColorClass : 'bg-white'}`}>
              {logoUrl && !logoError ? (
                <img 
                  src={logoUrl} 
                  alt={bank.bank_name} 
                  className="w-8 h-8 object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="text-white font-bold text-xl">{firstLetter}</span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800 tracking-tight leading-tight">{bank.bank_name}</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {bank.branch_name || "Main Branch"}
              </p>
            </div>
          </div>
          <div className="flex gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" onClick={() => onEdit(bank)} className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50">
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(bank.id)} className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Primary / Secondary Badge */}
        <div>
          {isPrimary ? (
            <Badge className="bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-0 shadow-sm gap-1 px-3 py-1">
              <CheckCircle2 className="w-3 h-3" /> Primary Account
            </Badge>
          ) : (
            <Badge className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-0 shadow-sm gap-1 px-3 py-1">
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Hash className="w-4 h-4" />
              <span>IFSC Code</span>
            </div>
            <span className="font-mono font-medium text-gray-800 text-sm">{bank.ifsc_code}</span>
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
  
  const [selectedBankType, setSelectedBankType] = useState<string>("")
  const [customBankName, setCustomBankName] = useState<string>("")

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
    
    // Combine selected bank type or custom name
    const finalBankName = selectedBankType === "Other" ? customBankName : selectedBankType;
    
    if (!finalBankName) {
      toast({
        variant: "destructive",
        title: "Missing Bank Name",
        description: "Please select or enter a bank name.",
      })
      setIsSubmitLoading(false)
      return
    }

    const submissionData = {
      ...formData,
      bank_name: finalBankName
    }

    const method = editingBank ? 'PUT' : 'POST'
    const payload = editingBank ? { ...submissionData, id: editingBank.id } : submissionData

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

    const isPredefined = PREDEFINED_BANKS.some(b => b.name === bank.bank_name);
    if (isPredefined) {
      setSelectedBankType(bank.bank_name);
      setCustomBankName("");
    } else {
      setSelectedBankType("Other");
      setCustomBankName(bank.bank_name);
    }

    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingBank(null)
    setSelectedBankType("")
    setCustomBankName("")
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
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Securely manage your payment & payroll accounts
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Plus className="w-4 h-4" /> Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingBank ? 'Edit Account' : 'New Account'}
                </DialogTitle>
                <DialogDescription>
                  Fill in the bank account details below.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                    <Input 
                      placeholder="First" 
                      name="acc_holder_fname" 
                      value={formData.acc_holder_fname} 
                      onChange={handleInputChange} 
                      required 
                    />
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      placeholder="Middle (Optional)" 
                      name="acc_holder_mname" 
                      value={formData.acc_holder_mname} 
                      onChange={handleInputChange} 
                    />
                    <Input 
                      placeholder="Last" 
                      name="acc_holder_lname" 
                      value={formData.acc_holder_lname} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Bank Details</Label>
                  <Select 
                    onValueChange={(value) => setSelectedBankType(value)}
                    value={selectedBankType}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREDEFINED_BANKS.map((bank) => (
                        <SelectItem key={bank.name} value={bank.name}>
                          <div className="flex items-center gap-2">
                            <img 
                              src={`https://www.google.com/s2/favicons?domain=${bank.domain}&sz=64`} 
                              alt="" 
                              className="w-4 h-4 object-contain"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                            {bank.name}
                          </div>
                        </SelectItem>
                      ))}
                      <SelectItem value="Other">Other Bank</SelectItem>
                    </SelectContent>
                  </Select>

                  {selectedBankType === "Other" && (
                    <Input 
                      placeholder="Enter Bank Name" 
                      value={customBankName} 
                      onChange={(e) => setCustomBankName(e.target.value)} 
                      required 
                      className="animate-in fade-in slide-in-from-top-1"
                    />
                  )}

                  <Input 
                    placeholder="Branch Name" 
                    name="branch_name" 
                    value={formData.branch_name} 
                    onChange={handleInputChange} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Account Information</Label>
                  <Input 
                    placeholder="Account Number" 
                    name="account_number" 
                    value={formData.account_number} 
                    onChange={handleInputChange} 
                    required 
                  />
                  <Input 
                    placeholder="IFSC Code" 
                    name="ifsc_code" 
                    value={formData.ifsc_code} 
                    onChange={handleInputChange} 
                    required 
                    className="uppercase"
                  />
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <input 
                    type="checkbox" 
                    id="is_primary" 
                    name="is_primary" 
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={formData.is_primary} 
                    onChange={handleInputChange} 
                  />
                  <Label htmlFor="is_primary" className="text-sm font-medium text-gray-700">
                    Set as Primary Account
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitLoading} className="bg-blue-600 hover:bg-blue-700">
                  {isSubmitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingBank ? 'Update Account' : 'Save Account'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">
              Total Banks
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {totalBanks}
            </p>
          </div>
          <div className="p-3 bg-purple-100 rounded-full">
            <Landmark className="h-6 w-6 text-purple-600" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">
              Total Accounts
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {totalAccounts}
            </p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <CreditCard className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Accounts List Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-1">
          <Landmark className="h-5 w-5 text-gray-600" />
          All Accounts
        </h2>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-lg border border-gray-200">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm text-gray-500 font-medium">Fetching your accounts...</p>
          </div>
        ) : banks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-300/40 rounded-lg border border-dashed border-gray-300">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 shadow-sm">
              <Landmark className="w-8 h-8 text-gray-400" />
            </div>
            <p className="font-semibold text-xl text-gray-700">No Bank Accounts Found</p>
            <p className="text-sm text-gray-500 mb-6 mt-1">Add your first account to get started.</p>
            <Button variant="outline" onClick={() => setIsDialogOpen(true)} className="rounded-md shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Add Account
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
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
  )
}
