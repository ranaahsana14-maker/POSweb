"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Plus, Edit2, Trash2, Copy } from "lucide-react"
import { getPosData, savePosData, getCurrencySymbol, type Product } from "@/lib/data-persistence"

export function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    costPrice: "",
    salePrice: "",
    quantity: "",
    unitType: "stock" as "stock" | "weight",
  })

  useEffect(() => {
    const data = getPosData()
    setProducts(data.products)
  }, [])

  const data = getPosData()
  const currencySymbol = getCurrencySymbol(data.settings.currency)
  const unitLabel = data.settings.unitSystem === "weight" ? "Weight" : "Stock"

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const generateBarcode = () => {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substr(2, 9).toUpperCase()
    return `${timestamp.slice(-6)}${random.slice(0, 4)}`
  }

  const handleAddProduct = () => {
    if (!formData.name || !formData.costPrice || !formData.salePrice || !formData.quantity) {
      alert("Please fill all required fields")
      return
    }

    const data = getPosData()
    const barcode = formData.barcode || generateBarcode()

    if (editingId) {
      const productIdx = data.products.findIndex((p) => p.id === editingId)
      if (productIdx !== -1) {
        data.products[productIdx] = {
          ...data.products[productIdx],
          name: formData.name,
          barcode,
          costPrice: Number.parseFloat(formData.costPrice),
          salePrice: Number.parseFloat(formData.salePrice),
          quantity: Number.parseFloat(formData.quantity),
          unitType: formData.unitType,
        }
      }
      setEditingId(null)
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: formData.name,
        barcode,
        quantity: Number.parseFloat(formData.quantity),
        unitType: formData.unitType,
        costPrice: Number.parseFloat(formData.costPrice),
        salePrice: Number.parseFloat(formData.salePrice),
        createdAt: new Date().toISOString(),
      }
      data.products.push(newProduct)
    }

    savePosData(data)
    setProducts(data.products)
    setFormData({ name: "", barcode: "", costPrice: "", salePrice: "", quantity: "", unitType: "stock" })
    setShowForm(false)
  }

  const handleEdit = (product: Product) => {
    setEditingId(product.id)
    setFormData({
      name: product.name,
      barcode: product.barcode || "",
      costPrice: product.costPrice.toString(),
      salePrice: product.salePrice.toString(),
      quantity: product.quantity.toString(),
      unitType: product.unitType,
    })
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Delete this product?")) {
      const data = getPosData()
      data.products = data.products.filter((p) => p.id !== id)
      setProducts(data.products)
      savePosData(data)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ name: "", barcode: "", costPrice: "", salePrice: "", quantity: "", unitType: "stock" })
  }

  const lowStockItems = products.filter((p) => p.quantity < 10).length
  const totalValue = products.reduce((sum, p) => sum + p.quantity * p.costPrice, 0)

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products & Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage your product catalog and stock levels</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(!showForm)
            if (showForm) handleCancel()
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground font-medium">Total Products</p>
          <p className="text-2xl font-bold text-foreground mt-2">{products.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground font-medium">Low Stock Items</p>
          <p className="text-2xl font-bold text-orange-600 mt-2">{lowStockItems}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground font-medium">Inventory Value</p>
          <p className="text-2xl font-bold text-foreground mt-2">
            {currencySymbol}
            {totalValue.toFixed(2)}
          </p>
        </Card>
      </div>

      {/* Product Form */}
      {showForm && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {editingId ? "Edit Product" : "Add New Product"}
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Product name"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Barcode (Auto-generated if empty)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Auto-generated"
                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  />
                  <Button
                    onClick={() => setFormData({ ...formData, barcode: generateBarcode() })}
                    variant="outline"
                    size="icon"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Cost Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Sale Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Quantity *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddProduct} className="bg-primary hover:bg-primary/90">
                {editingId ? "Update Product" : "Add Product"}
              </Button>
              <Button onClick={handleCancel} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center bg-muted rounded-lg pl-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products by name or barcode..."
              className="bg-transparent px-4 py-2 text-sm outline-none w-full text-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Barcode</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                  {unitLabel}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                  Sale Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{product.name}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{product.barcode || "-"}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        product.quantity < 10 ? "bg-orange-500/10 text-orange-600" : "bg-green-500/10 text-green-600"
                      }`}
                    >
                      {product.quantity} {data.settings.unitSystem === "weight" ? "g/kg" : "units"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    {currencySymbol}
                    {product.costPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    {currencySymbol}
                    {product.salePrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2 flex">
                    <Button variant="ghost" size="icon" className="hover:bg-muted" onClick={() => handleEdit(product)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredProducts.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No products found matching your criteria</p>
        </Card>
      )}
    </div>
  )
}
