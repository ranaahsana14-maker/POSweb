"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2, Search, X, AlertCircle } from "lucide-react"
import { getPosData, savePosData, type Product } from "@/lib/data-persistence"
import { formatCurrency, truncateText, calculateProfitMargin } from "@/lib/utils"

interface FormData {
  name: string
  barcode: string
  quantity: number
  costPrice: number
  salePrice: number
  unitType: "stock" | "weight"
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "price" | "quantity">("name")
  const [currencySymbol, setCurrencySymbol] = useState("₨")
  const [unitLabel, setUnitLabel] = useState("Units")
  const [formData, setFormData] = useState<FormData>({
    name: "",
    barcode: "",
    quantity: 0,
    costPrice: 0,
    salePrice: 0,
    unitType: "stock",
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = () => {
    try {
      const data = getPosData()
      setProducts(data.products)
      setCurrencySymbol(data.settings.currencySymbol)
      setUnitLabel(data.settings.unitSystem === "weight" ? "Weight" : "Units")
    } catch (err) {
      setError("Failed to load products")
      console.error(err)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      barcode: "",
      quantity: 0,
      costPrice: 0,
      salePrice: 0,
      unitType: "stock",
    })
    setEditingId(null)
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("Product name is required")
      return false
    }
    if (formData.costPrice < 0) {
      setError("Cost price cannot be negative")
      return false
    }
    if (formData.salePrice < 0) {
      setError("Sale price cannot be negative")
      return false
    }
    if (formData.salePrice < formData.costPrice) {
      setError("Sale price should be greater than or equal to cost price")
      return false
    }
    if (formData.quantity < 0) {
      setError("Quantity cannot be negative")
      return false
    }
    return true
  }

  const handleAddProduct = () => {
    setError("")

    if (!validateForm()) return

    try {
      const data = getPosData()

      if (editingId) {
        const updatedProducts = data.products.map((p) =>
          p.id === editingId
            ? {
                ...p,
                name: formData.name,
                barcode: formData.barcode,
                quantity: formData.quantity,
                costPrice: formData.costPrice,
                salePrice: formData.salePrice,
                unitType: formData.unitType,
              }
            : p,
        )
        data.products = updatedProducts
        setSuccess("Product updated successfully")
      } else {
        const newProduct: Product = {
          id: Date.now().toString(),
          name: formData.name,
          barcode: formData.barcode,
          quantity: formData.quantity,
          unitType: formData.unitType,
          costPrice: formData.costPrice,
          salePrice: formData.salePrice,
          createdAt: new Date().toISOString(),
        }
        data.products.push(newProduct)
        setSuccess("Product added successfully")
      }

      savePosData(data)
      setProducts(data.products)
      setShowForm(false)
      resetForm()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Failed to save product")
      console.error(err)
    }
  }

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const data = getPosData()
      data.products = data.products.filter((p) => p.id !== id)
      savePosData(data)
      setProducts(data.products)
      setSuccess("Product deleted successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Failed to delete product")
      console.error(err)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingId(product.id)
    setFormData({
      name: product.name,
      barcode: product.barcode,
      quantity: product.quantity,
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      unitType: product.unitType,
    })
    setShowForm(true)
    setError("")
  }

  const handleCancel = () => {
    setShowForm(false)
    resetForm()
    setError("")
  }

  // Filter and sort products
  const filteredProducts = products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "price":
          return b.salePrice - a.salePrice
        case "quantity":
          return a.quantity - b.quantity
        case "name":
        default:
          return a.name.localeCompare(b.name)
      }
    })

  const stats = {
    totalProducts: products.length,
    lowStockCount: products.filter((p) => p.quantity < 10).length,
    totalValue: products.reduce((sum, p) => sum + p.quantity * p.salePrice, 0),
    totalCost: products.reduce((sum, p) => sum + p.quantity * p.costPrice, 0),
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your inventory</p>
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
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <p className="text-xs font-medium text-muted-foreground mb-1">Total Products</p>
          <p className="text-2xl font-bold text-foreground">{stats.totalProducts}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-red-500/10 to-red-500/5">
          <p className="text-xs font-medium text-muted-foreground mb-1">Low Stock</p>
          <p className="text-2xl font-bold text-red-600">{stats.lowStockCount}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5">
          <p className="text-xs font-medium text-muted-foreground mb-1">Inventory Value</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalValue, currencySymbol)}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <p className="text-xs font-medium text-muted-foreground mb-1">Total Cost</p>
          <p className="text-lg font-bold text-purple-600">{formatCurrency(stats.totalCost, currencySymbol)}</p>
        </Card>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600">
          <span>✓</span>
          {success}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <Card className="p-6 border-primary/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              {editingId ? "Edit Product" : "Add New Product"}
            </h2>
            <button onClick={handleCancel} className="p-1 hover:bg-muted rounded-lg">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Product Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Barcode</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Product barcode"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Quantity <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">{unitLabel}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cost Price <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Sale Price <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                />
              </div>
            </div>

            {/* Profit Margin Preview */}
            {formData.costPrice > 0 && formData.salePrice > 0 && (
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-sm text-muted-foreground">
                  Profit Margin: <span className="font-semibold text-green-600">
                    {calculateProfitMargin(formData.salePrice, formData.costPrice).toFixed(2)}%
                  </span>
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button onClick={handleAddProduct} className="flex-1 bg-primary hover:bg-primary/90">
                {editingId ? "Update Product" : "Add Product"}
              </Button>
              <Button onClick={handleCancel} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Search and Sort */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
          >
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
            <option value="quantity">Sort by Quantity</option>
          </select>
        </div>
      </Card>

      {/* Products Table/Grid */}
      {filteredProducts.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">
            {products.length === 0 ? "No products yet" : "No products match your search"}
          </p>
          {products.length === 0 && (
            <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add First Product
            </Button>
          )}
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Product Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Barcode</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Quantity</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Cost</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Price</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Margin</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors group"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div>
                        <p>{truncateText(product.name, 30)}</p>
                        {product.quantity < 10 && (
                          <span className="text-xs text-destructive font-medium">Low Stock</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {product.barcode || "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.quantity} {unitLabel === "Weight" ? "kg" : "pcs"}
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {formatCurrency(product.costPrice, currencySymbol)}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-primary">
                      {formatCurrency(product.salePrice, currencySymbol)}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          calculateProfitMargin(product.salePrice, product.costPrice) > 0
                            ? "bg-green-500/10 text-green-600"
                            : "bg-gray-500/10 text-gray-600"
                        }`}
                      >
                        {calculateProfitMargin(product.salePrice, product.costPrice).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                          title="Edit product"
                        >
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Footer */}
      <div className="text-xs text-muted-foreground text-center pt-4">
        Showing {filteredProducts.length} of {products.length} products
      </div>
    </div>
  )
}