"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  X,
  AlertCircle,
  CheckCircle,
  Truck,
  Package,
  DollarSign,
  Calendar,
  Search,
  FileText,
  Clock,
  Building2,
} from "lucide-react"
import { getPosData, savePosData, type Supplier } from "@/lib/data-persistence"
import { formatCurrency, formatDate, validatePhone, validateEmail } from "@/lib/utils"

interface FormData {
  name: string
  phone: string
  email: string
  address: string
  paymentTerms: string
  bankName?: string
  bankAccount?: string
  taxId?: string
}

interface SupplyData {
  productName: string
  quantity: number
  costPrice: number
  totalCost: number
  date: string
  paymentMethod: "cash" | "card" | "transfer"
}

export default function SuppliersPage() {
  const [featureDisabled, setFeatureDisabled] = useState(false)
  // States
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showSupplyModal, setShowSupplyModal] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPaymentTerms, setFilterPaymentTerms] = useState<string>("all")
  const [currencySymbol, setCurrencySymbol] = useState("₨")
  const [loading, setLoading] = useState(true)
  const [supplies, setSupplies] = useState<any[]>([])

  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    address: "",
    paymentTerms: "",
    bankName: "",
    bankAccount: "",
    taxId: "",
  })

  // Load data
  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = () => {
    try {
      const data = getPosData()
      const enabled = data?.settings?.featuresEnabled?.suppliers
      if (enabled === false) {
        setFeatureDisabled(true)
        setLoading(false)
        return
      } else {
        setFeatureDisabled(false)
      }
      setSuppliers(data.suppliers)
      setSupplies(data.supplies)
      setCurrencySymbol(data.settings.currencySymbol)
      setLoading(false)
    } catch (err) {
      setError("Failed to load suppliers")
      console.error(err)
      setLoading(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      paymentTerms: "",
      bankName: "",
      bankAccount: "",
      taxId: "",
    })
    setEditingId(null)
    setError("")
  }

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("Supplier name is required")
      return false
    }

    if (formData.email && !validateEmail(formData.email)) {
      setError("Please enter a valid email address")
      return false
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      setError("Please enter a valid phone number")
      return false
    }

    return true
  }

  // Add/Update supplier
  const handleAddSupplier = () => {
    setError("")

    if (!validateForm()) return

    try {
      const data = getPosData()

      if (editingId) {
        const updatedSuppliers = data.suppliers.map((s) =>
          s.id === editingId
            ? {
                ...s,
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                address: formData.address,
                paymentTerms: formData.paymentTerms,
              }
            : s,
        )
        data.suppliers = updatedSuppliers
        setSuppliers(updatedSuppliers)
        setSuccess("Supplier updated successfully")
      } else {
        const newSupplier: Supplier = {
          id: Date.now().toString(),
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          paymentTerms: formData.paymentTerms,
          createdAt: new Date().toISOString(),
        }
        data.suppliers.push(newSupplier)
        setSuppliers([...data.suppliers])
        setSuccess("Supplier added successfully")
      }

      savePosData(data)
      setShowForm(false)
      resetForm()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Failed to save supplier")
      console.error(err)
    }
  }

  // Edit supplier
  const handleEdit = (supplier: Supplier) => {
    setEditingId(supplier.id)
    setFormData({
      name: supplier.name,
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      paymentTerms: supplier.paymentTerms || "",
      bankName: "",
      bankAccount: "",
      taxId: "",
    })
    setShowForm(true)
    setError("")
  }

  // Delete supplier
  const handleDelete = (id: string) => {
    const confirmed = confirm(
      "Are you sure you want to delete this supplier? This action cannot be undone.",
    )
    if (!confirmed) return

    try {
      const data = getPosData()
      data.suppliers = data.suppliers.filter((s) => s.id !== id)
      setSuppliers(data.suppliers)
      savePosData(data)
      setSelectedSupplier(null)
      setSuccess("Supplier deleted successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Failed to delete supplier")
      console.error(err)
    }
  }

  // Cancel form
  const handleCancel = () => {
    setShowForm(false)
    resetForm()
  }

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Get current supplier details
  const currentSupplier = suppliers.find((s) => s.id === selectedSupplier)

  // Get supplier statistics
  const getSupplierStats = (supplierId: string) => {
    const supplierSupplies = supplies.filter((s) => s.supplierId === supplierId)
    const totalCost = supplierSupplies.reduce((sum, s) => sum + s.totalCost, 0)
    const totalItems = supplierSupplies.reduce((sum, s) => sum + s.quantity, 0)
    return {
      totalSupplies: supplierSupplies.length,
      totalCost,
      totalItems,
      lastSupply: supplierSupplies.length > 0 ? supplierSupplies[0].createdAt : null,
    }
  }

  // Get cash balance
  const getCashBalance = () => {
    const data = getPosData()
    const balance = data.cashDrawerTransactions.reduce((sum, t) => {
      if (t.type === "opening" || t.type === "sale") return sum + t.amount
      return sum + t.amount
    }, 0)
    return balance
  }

  const cashBalance = getCashBalance()

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading suppliers...</p>
        </div>
      </div>
    )
  }

  if (featureDisabled) {
    return (
      <div className="p-6 md:p-8">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">Suppliers Module Disabled</h2>
          <p className="text-sm text-muted-foreground">This feature has been disabled in Settings by the administrator.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Truck className="w-8 h-8" />
            Suppliers Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage suppliers and track supply orders</p>
        </div>
        <Button
          onClick={() => {
            if (showForm) {
              handleCancel()
            } else {
              setShowForm(true)
            }
          }}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive animate-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 animate-in">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <Card className="p-6 border-primary/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {editingId ? "Edit Supplier" : "Add New Supplier"}
            </h2>
            <button onClick={handleCancel} className="p-1 hover:bg-muted rounded-lg transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Basic Information */}
            <div className="bg-muted/30 p-4 rounded-lg border border-muted">
              <p className="text-sm font-semibold text-foreground mb-3">Basic Information</p>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Supplier Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter supplier name"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+92 300 1234567"
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="supplier@example.com"
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Full business address"
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-muted/30 p-4 rounded-lg border border-muted">
              <p className="text-sm font-semibold text-foreground mb-3">Payment Information</p>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    placeholder="e.g., Net 30, COD, Advance 50%"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bankName || ""}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      placeholder="Bank name"
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Account Number</label>
                    <input
                      type="text"
                      value={formData.bankAccount || ""}
                      onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                      placeholder="Bank account number"
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Tax ID / NTN</label>
                  <input
                    type="text"
                    value={formData.taxId || ""}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="Tax ID or NTN"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleAddSupplier} className="flex-1 bg-primary hover:bg-primary/90">
                <CheckCircle className="w-4 h-4 mr-2" />
                {editingId ? "Update Supplier" : "Add Supplier"}
              </Button>
              <Button onClick={handleCancel} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Total Suppliers: {suppliers.length}</p>
          </div>
        </Card>
      </div>

      {suppliers.length === 0 ? (
        /* Empty State */
        <Card className="p-12 text-center">
          <Truck className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="text-muted-foreground mb-4">No suppliers yet</p>
          <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add First Supplier
          </Button>
        </Card>
      ) : (
        /* Main Content */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Suppliers List */}
          <Card className="lg:col-span-2 p-0 overflow-hidden">
            <div className="bg-muted/50 px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground">Supplier List ({filteredSuppliers.length})</p>
            </div>

            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {filteredSuppliers.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">No suppliers match your search</div>
              ) : (
                filteredSuppliers.map((supplier) => {
                  const stats = getSupplierStats(supplier.id)
                  return (
                    <div
                      key={supplier.id}
                      className={`p-4 cursor-pointer hover:bg-muted transition-colors border-l-4 ${
                        selectedSupplier === supplier.id ? "bg-muted border-l-primary" : "border-l-transparent"
                      }`}
                      onClick={() => setSelectedSupplier(supplier.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground text-sm">{supplier.name}</h3>
                          <div className="text-xs text-muted-foreground mt-2 space-y-1">
                            {supplier.phone && (
                              <p className="flex items-center gap-2">
                                <Phone className="w-3 h-3" /> {supplier.phone}
                              </p>
                            )}
                            {supplier.email && (
                              <p className="flex items-center gap-2">
                                <Mail className="w-3 h-3" /> {supplier.email}
                              </p>
                            )}
                            {supplier.paymentTerms && (
                              <p className="flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> {supplier.paymentTerms}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-4 mt-3 pt-3 border-t border-border text-xs">
                            <div>
                              <p className="text-muted-foreground">Supplies</p>
                              <p className="font-semibold text-foreground">{stats.totalSupplies}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total Cost</p>
                              <p className="font-semibold text-primary">
                                {formatCurrency(stats.totalCost, currencySymbol)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Items</p>
                              <p className="font-semibold text-foreground">{stats.totalItems.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>

          {/* Details Panel */}
          {currentSupplier ? (
            <Card className="p-6 h-fit sticky top-20">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {currentSupplier.name}
              </h3>

              {/* Contact Information */}
              <div className="space-y-3 mb-6 pb-6 border-b border-border">
                {currentSupplier.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm text-foreground">{currentSupplier.phone}</p>
                    </div>
                  </div>
                )}
                {currentSupplier.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm text-foreground break-all">{currentSupplier.email}</p>
                    </div>
                  </div>
                )}
                {currentSupplier.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="text-sm text-foreground">{currentSupplier.address}</p>
                    </div>
                  </div>
                )}
                {currentSupplier.paymentTerms && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Payment Terms</p>
                      <p className="text-sm text-foreground">{currentSupplier.paymentTerms}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Statistics */}
              {(() => {
                const stats = getSupplierStats(currentSupplier.id)
                return (
                  <div className="space-y-3 mb-6 pb-6 border-b border-border">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Supply Statistics
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Total Supplies</span>
                        <span className="font-semibold text-foreground">{stats.totalSupplies}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Total Items</span>
                        <span className="font-semibold text-foreground">{stats.totalItems.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Total Cost</span>
                        <span className="font-semibold text-primary">
                          {formatCurrency(stats.totalCost, currencySymbol)}
                        </span>
                      </div>
                      {stats.lastSupply && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Last Supply
                          </span>
                          <span className="font-semibold text-foreground">{formatDate(stats.lastSupply)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button onClick={() => setShowSupplyModal(true)} className="w-full bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Supply
                </Button>
                <Button onClick={() => handleEdit(currentSupplier)} variant="outline" className="w-full">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Supplier
                </Button>
                <Button
                  onClick={() => handleDelete(currentSupplier.id)}
                  variant="outline"
                  className="w-full text-destructive hover:bg-destructive/10 border-destructive/20"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Supplier
                </Button>
              </div>

              {/* Created Date */}
              <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground text-center">
                <p>Added: {formatDate(currentSupplier.createdAt)}</p>
              </div>
            </Card>
          ) : (
            <Card className="p-6 h-fit sticky top-20 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground">Select a supplier to view details</p>
            </Card>
          )}
        </div>
      )}

      {/* Supply Modal */}
      {showSupplyModal && currentSupplier && (
        <SupplyModal
          supplier={currentSupplier}
          onClose={() => setShowSupplyModal(false)}
          cashBalance={cashBalance}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  )
}

/* Supply Modal Component */
interface SupplyModalProps {
  supplier: any
  onClose: () => void
  cashBalance: number
  currencySymbol: string
}

function SupplyModal({ supplier, onClose, cashBalance, currencySymbol }: SupplyModalProps) {
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [newProductMode, setNewProductMode] = useState(false)
  const [quantity, setQuantity] = useState("")
  const [costPrice, setCostPrice] = useState("")
  const [salePrice, setSalePrice] = useState("")
  const [productName, setProductName] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer">("cash")
  const [error, setError] = useState("")

  useEffect(() => {
    const data = getPosData()
    setProducts(data.products)
  }, [])

  const totalCost = parseFloat(quantity) * parseFloat(costPrice) || 0

  const handleAddSupply = () => {
    setError("")

    if (paymentMethod === "cash" && totalCost > cashBalance) {
      setError(
        `Insufficient cash in drawer. Available: ${formatCurrency(cashBalance, currencySymbol)}, Required: ${formatCurrency(totalCost, currencySymbol)}`,
      )
      return
    }

    const data = getPosData()

    if (newProductMode) {
      if (!productName || !quantity || !costPrice || !salePrice) {
        setError("All fields are required for new product")
        return
      }

      const newProduct = {
        id: Date.now().toString(),
        name: productName,
        barcode: "",
        quantity: parseFloat(quantity),
        unitType: "stock" as const,
        costPrice: parseFloat(costPrice),
        salePrice: parseFloat(salePrice),
        createdAt: new Date().toISOString(),
      }

      data.products.push(newProduct)
    } else {
      if (!selectedProduct || !quantity || !costPrice || !salePrice) {
        setError("Please fill all fields")
        return
      }

      const productIdx = data.products.findIndex((p) => p.id === selectedProduct)
      if (productIdx !== -1) {
        data.products[productIdx].quantity += parseFloat(quantity)
        data.products[productIdx].costPrice = parseFloat(costPrice)
        data.products[productIdx].salePrice = parseFloat(salePrice)
      }
    }

    // Handle cash payment deduction
    if (paymentMethod === "cash") {
      data.cashDrawerTransactions.push({
        id: Date.now().toString(),
        type: "expense",
        amount: -totalCost,
        description: `Supply from ${supplier.name}`,
        createdAt: new Date().toISOString(),
      })
    }

    // Record supply
    data.supplies.push({
      id: Date.now().toString(),
      supplierId: supplier.id,
      productId: newProductMode ? data.products[data.products.length - 1].id : selectedProduct,
      quantity: parseFloat(quantity),
      costPrice: parseFloat(costPrice),
      totalCost,
      paymentMethod,
      status: "completed",
      createdAt: new Date().toISOString(),
    })

    savePosData(data)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-96 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Package className="w-5 h-5" />
              Add Supply from {supplier.name}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Cash Balance Alert */}
          {paymentMethod === "cash" && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 text-blue-600 rounded-lg text-xs">
              <p className="font-semibold">Cash Available: {formatCurrency(cashBalance, currencySymbol)}</p>
              {totalCost > 0 && (
                <p className="text-xs mt-1">
                  Required: {formatCurrency(totalCost, currencySymbol)} |{" "}
                  {totalCost <= cashBalance ? (
                    <span className="text-green-600">✓ Sufficient</span>
                  ) : (
                    <span className="text-destructive">✗ Insufficient</span>
                  )}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs">
              {error}
            </div>
          )}

          {/* Product Selection */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setNewProductMode(false)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  !newProductMode ? "bg-primary text-white" : "bg-muted text-foreground"
                }`}
              >
                Existing Product
              </button>
              <button
                onClick={() => setNewProductMode(true)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  newProductMode ? "bg-primary text-white" : "bg-muted text-foreground"
                }`}
              >
                New Product
              </button>
            </div>

            {newProductMode ? (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Product Name</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Product name"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Select Product</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                >
                  <option value="">Choose a product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current: {p.quantity})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Qty</label>
                <input
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className="w-full px-2 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Cost</label>
                <input
                  type="number"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-2 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Sale</label>
                <input
                  type="number"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-2 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                />
              </div>
            </div>

            {/* Total Cost */}
            {quantity && costPrice && (
              <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">Total Cost</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(totalCost, currencySymbol)}</p>
              </div>
            )}

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
              >
                <option value="cash">Cash (Deduct from Drawer)</option>
                <option value="card">Credit Card</option>
                <option value="transfer">Bank Transfer</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleAddSupply} className="flex-1 bg-primary hover:bg-primary/90 text-sm">
                <CheckCircle className="w-4 h-4 mr-1" />
                Add Supply
              </Button>
              <Button onClick={onClose} variant="outline" className="flex-1 text-sm">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}