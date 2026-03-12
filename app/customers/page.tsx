"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Trash2,
  Edit2,
  Phone,
  Mail,
  MapPin,
  X,
  AlertCircle,
  CheckCircle,
  Search,
  Users,
  TrendingUp,
  ShoppingCart,
  Calendar,
  DollarSign,
  Filter,
} from "lucide-react"
import { getPosData, savePosData, type Customer } from "@/lib/data-persistence"
import { validateEmail, validatePhone, formatCurrency, formatDate } from "@/lib/utils"

interface FormData {
  name: string
  phone: string
  email: string
  address: string
}

export default function CustomersPage() {
  // States
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "regular" | "walkin">("all")
  const [currencySymbol, setCurrencySymbol] = useState("₨")
  const [loading, setLoading] = useState(true)
  const [sales, setSales] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)

  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    address: "",
  })

  // Load customers
  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = () => {
    try {
      const data = getPosData()
      setCustomers(data.customers)
      setSales(data.sales)
      setCurrencySymbol(data.settings.currencySymbol)
      setLoading(false)
    } catch (err) {
      setError("Failed to load customers")
      console.error(err)
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: "", phone: "", email: "", address: "" })
    setEditingId(null)
    setError("")
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("Customer name is required")
      return false
    }

    if (formData.email && !validateEmail(formData.email)) {
      setError("Please enter a valid email address")
      return false
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      setError("Please enter a valid phone number (minimum 10 digits)")
      return false
    }

    return true
  }

  const handleAddCustomer = () => {
    setError("")

    if (!validateForm()) return

    try {
      const data = getPosData()

      if (editingId) {
        // Update existing customer
        const updatedCustomers = data.customers.map((c) =>
          c.id === editingId
            ? {
                ...c,
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                address: formData.address,
              }
            : c,
        )
        data.customers = updatedCustomers
        setCustomers(updatedCustomers)
        setSuccess("Customer updated successfully")
      } else {
        // Add new customer
        const newCustomer: Customer = {
          id: Date.now().toString(),
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          createdAt: new Date().toISOString(),
        }
        data.customers.push(newCustomer)
        setCustomers(data.customers)
        setSuccess("Customer added successfully")
      }

      savePosData(data)
      setShowForm(false)
      resetForm()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Failed to save customer")
      console.error(err)
    }
  }

  const handleDelete = (id: string) => {
    if (id === "walk-in") {
      setError("Cannot delete Walk-in Customer")
      return
    }

    const confirmed = confirm("Are you sure you want to delete this customer? This action cannot be undone.")
    if (!confirmed) return

    try {
      const data = getPosData()
      data.customers = data.customers.filter((c) => c.id !== id)
      savePosData(data)
      setCustomers(data.customers)
      setSelectedCustomer(null)
      setSuccess("Customer deleted successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Failed to delete customer")
      console.error(err)
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id)
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
    })
    setShowForm(true)
    setError("")
  }

  const handleCancel = () => {
    setShowForm(false)
    resetForm()
  }

  // Get customer statistics
  const getCustomerStats = (customerId: string) => {
    const customerSales = sales.filter((s) => s.customerId === customerId)
    const totalSpent = customerSales.reduce((sum, s) => sum + s.total, 0)
    const totalItems = customerSales.reduce((sum, s) => sum + s.items.length, 0)
    return {
      totalPurchases: customerSales.length,
      totalSpent,
      totalItems,
      lastPurchase: customerSales.length > 0 ? customerSales[0].createdAt : null,
      averageOrder: customerSales.length > 0 ? totalSpent / customerSales.length : 0,
    }
  }

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter =
      filterType === "all" ||
      (filterType === "regular" && !c.isWalkIn) ||
      (filterType === "walkin" && c.isWalkIn)

    return matchesSearch && matchesFilter
  })

  // Get dashboard stats
  const dashboardStats = {
    totalCustomers: customers.length - 1, // Exclude walk-in
    totalSpent: sales.reduce((sum, s) => sum + s.total, 0),
    totalTransactions: sales.length,
    averageCustomerValue:
      customers.length > 1 ? sales.reduce((sum, s) => sum + s.total, 0) / (customers.length - 1) : 0,
  }

  const currentCustomer = customers.find((c) => c.id === selectedCustomer)

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    )
  }

  const posData = getPosData()
  if (posData.settings && posData.settings.featuresEnabled && posData.settings.featuresEnabled.customers === false) {
    return (
      <div className="p-6 md:p-8">
        <Card className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Customer module is disabled by system administrator.</p>
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
            <Users className="w-8 h-8" />
            Customers
          </h1>
          <p className="text-muted-foreground mt-1">Manage your customer database and track purchases</p>
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
          Add Customer
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

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Total Customers</p>
              <p className="text-2xl font-bold text-foreground">{dashboardStats.totalCustomers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500/30" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(dashboardStats.totalSpent, currencySymbol)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500/30" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Total Transactions</p>
              <p className="text-2xl font-bold text-foreground">{dashboardStats.totalTransactions}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-green-500/30" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Avg Order Value</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(dashboardStats.averageCustomerValue, currencySymbol)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500/30" />
          </div>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6 border-primary/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5" />
              {editingId ? "Edit Customer" : "Add New Customer"}
            </h2>
            <button onClick={handleCancel} className="p-1 hover:bg-muted rounded-lg transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Customer Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter customer name"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
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
                  placeholder="customer@example.com"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
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
                placeholder="Enter customer address"
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleAddCustomer} className="flex-1 bg-primary hover:bg-primary/90">
                <CheckCircle className="w-4 h-4 mr-2" />
                {editingId ? "Update Customer" : "Add Customer"}
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
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
            >
              <option value="all">All Customers</option>
              <option value="regular">Regular Customers</option>
              <option value="walkin">Walk-in Only</option>
            </select>
          </div>
        </Card>
      </div>

      {customers.length === 0 ? (
        /* Empty State */
        <Card className="p-12 text-center">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="text-muted-foreground mb-4">No customers yet</p>
          <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add First Customer
          </Button>
        </Card>
      ) : (
        /* Main Content */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customers List */}
          <Card className="lg:col-span-2 p-0 overflow-hidden">
            <div className="bg-muted/50 px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground">Customer List ({filteredCustomers.length})</p>
            </div>

            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">No customers match your search</div>
              ) : (
                filteredCustomers.map((customer) => {
                  const stats = getCustomerStats(customer.id)
                  return (
                    <div
                      key={customer.id}
                      className={`p-4 cursor-pointer hover:bg-muted transition-colors border-l-4 ${
                        selectedCustomer === customer.id
                          ? "bg-muted border-l-primary"
                          : "border-l-transparent"
                      }`}
                      onClick={() => setSelectedCustomer(customer.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground text-sm">{customer.name}</h3>
                            {customer.isWalkIn && (
                              <span className="inline-block px-2 py-0.5 bg-gray-500/10 text-gray-600 rounded text-xs font-medium">
                                Default
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-muted-foreground mt-2 space-y-1">
                            {customer.phone && (
                              <p className="flex items-center gap-2">
                                <Phone className="w-3 h-3" /> {customer.phone}
                              </p>
                            )}
                            {customer.email && (
                              <p className="flex items-center gap-2">
                                <Mail className="w-3 h-3" /> {customer.email}
                              </p>
                            )}
                          </div>

                          {!customer.isWalkIn && stats.totalPurchases > 0 && (
                            <div className="flex gap-4 mt-3 pt-3 border-t border-border text-xs">
                              <div>
                                <p className="text-muted-foreground">Purchases</p>
                                <p className="font-semibold text-foreground">{stats.totalPurchases}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total Spent</p>
                                <p className="font-semibold text-primary">
                                  {formatCurrency(stats.totalSpent, currencySymbol)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Avg Order</p>
                                <p className="font-semibold text-foreground">
                                  {formatCurrency(stats.averageOrder, currencySymbol)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>

          {/* Details Panel */}
          {currentCustomer ? (
            <Card className="p-6 h-fit sticky top-20">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                {currentCustomer.name}
              </h3>

              {/* Contact Information */}
              <div className="space-y-3 mb-6 pb-6 border-b border-border">
                {currentCustomer.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm text-foreground">{currentCustomer.phone}</p>
                    </div>
                  </div>
                )}
                {currentCustomer.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm text-foreground break-all">{currentCustomer.email}</p>
                    </div>
                  </div>
                )}
                {currentCustomer.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="text-sm text-foreground">{currentCustomer.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Statistics */}
              {!currentCustomer.isWalkIn && (
                <div className="space-y-3 mb-6 pb-6 border-b border-border">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Purchase Statistics
                  </h4>
                  {(() => {
                    const stats = getCustomerStats(currentCustomer.id)
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Total Purchases</span>
                          <span className="font-semibold text-foreground">{stats.totalPurchases}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Total Spent</span>
                          <span className="font-semibold text-primary">
                            {formatCurrency(stats.totalSpent, currencySymbol)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Total Items</span>
                          <span className="font-semibold text-foreground">{stats.totalItems}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Average Order</span>
                          <span className="font-semibold text-foreground">
                            {formatCurrency(stats.averageOrder, currencySymbol)}
                          </span>
                        </div>
                        {stats.lastPurchase && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Last Purchase
                            </span>
                            <span className="font-semibold text-foreground">{formatDate(stats.lastPurchase)}</span>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Action Buttons */}
              {!currentCustomer.isWalkIn && (
                <div className="space-y-2">
                  <Button onClick={() => handleEdit(currentCustomer)} variant="outline" className="w-full">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Customer
                  </Button>
                  <Button
                    onClick={() => handleDelete(currentCustomer.id)}
                    variant="outline"
                    className="w-full text-destructive hover:bg-destructive/10 border-destructive/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Customer
                  </Button>
                </div>
              )}

              {/* Created Date */}
              <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground text-center">
                <p>Added: {formatDate(currentCustomer.createdAt)}</p>
              </div>
            </Card>
          ) : (
            <Card className="p-6 h-fit sticky top-20 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground">Select a customer to view details</p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}