"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Trash2,
  Printer,
  Share2,
  CheckCircle,
  Plus,
  Minus,
  Search,
  AlertCircle,
  DollarSign,
  CreditCard,
  ShoppingCart,
  Copy,
} from "lucide-react"
import {
  getPosData,
  savePosData,
  getCurrencySymbol,
  type Product,
  type Customer,
  type Sale,
  type SaleItem,
} from "@/lib/data-persistence"
import { Receipt } from "@/components/receipt"
import { formatCurrency } from "@/lib/utils"

interface CartItem extends SaleItem {
  product: Product
}

export default function SalesPage() {
  // State
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>("walk-in")
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash")
  const [amountReceived, setAmountReceived] = useState("")
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [lastReceipt, setLastReceipt] = useState<Sale | null>(null)
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [currencySymbol, setCurrencySymbol] = useState("₨")
  const printWindowRef = useRef<Window | null>(null)

  // Load data on mount
  useEffect(() => {
    const loadData = () => {
      try {
        const data = getPosData()
        setProducts(data.products)
        setCustomers(data.customers)
        setCurrencySymbol(data.settings.currencySymbol)
      } catch (err) {
        setError("Failed to load data")
        console.error(err)
      }
    }
    loadData()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!focusedItemId) return

      const currentItem = cart.find((item) => item.productId === focusedItemId)
      if (!currentItem) return

      if (e.key === "p" || e.key === "P" || e.key === "+") {
        e.preventDefault()
        handleUpdateQuantity(focusedItemId, currentItem.quantity + 1)
      } else if (e.key === "ArrowDown" || e.key === "-") {
        e.preventDefault()
        if (currentItem.quantity > 1) {
          handleUpdateQuantity(focusedItemId, currentItem.quantity - 1)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [focusedItemId, cart])

  // Get settings
  const data = getPosData()
  const unitLabel = data.settings.unitSystem === "weight" ? "Weight" : "Stock"

  // Filter products
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const total = subtotal

  // Handlers
  const handleAddToCart = useCallback(
    (product: Product) => {
      if (product.quantity <= 0) {
        setError(`${product.name} is out of stock`)
        setTimeout(() => setError(""), 3000)
        return
      }

      setCart((prevCart) => {
        const existingItem = prevCart.find((item) => item.productId === product.id)
        if (existingItem) {
          if (existingItem.quantity >= product.quantity) {
            setError(`Cannot add more ${product.name}. Maximum available: ${product.quantity}`)
            setTimeout(() => setError(""), 3000)
            return prevCart
          }
          return prevCart.map((item) =>
            item.productId === product.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  total: (item.quantity + 1) * item.unitPrice,
                }
              : item,
          )
        }
        return [
          ...prevCart,
          {
            productId: product.id,
            productName: product.name,
            quantity: 1,
            unitPrice: product.salePrice,
            total: product.salePrice,
            product,
          },
        ]
      })
      setSearchQuery("")
    },
    [],
  )

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId)
      return
    }

    const product = products.find((p) => p.id === productId)
    if (product && quantity > product.quantity) {
      setError(`Cannot add more. Available: ${product.quantity}`)
      setTimeout(() => setError(""), 3000)
      return
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity,
              total: quantity * item.unitPrice,
            }
          : item,
      ),
    )
  }

  const handleRemoveFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId))
    setFocusedItemId(null)
  }

  const handleCheckout = () => {
    setError("")
    if (cart.length === 0) {
      setError("Cart is empty. Please add items to continue.")
      return
    }
    setShowCheckoutModal(true)
  }

  const handleCompleteSale = () => {
    setError("")

    if (paymentMethod === "cash" && !amountReceived) {
      setError("Please enter amount received")
      return
    }

    const received = paymentMethod === "cash" ? parseFloat(amountReceived) : 0

    if (paymentMethod === "cash" && received < total) {
      setError(`Amount received is less than total. Need: ${formatCurrency(total, currencySymbol)}`)
      return
    }

    try {
      const data = getPosData()
      const change = paymentMethod === "cash" ? received - total : 0

      // Create sale record
      const newSale: Sale = {
        id: Date.now().toString(),
        customerId: selectedCustomer,
        items: cart.map(({ product, ...item }) => item),
        subtotal,
        total,
        paymentMethod,
        amountReceived: paymentMethod === "cash" ? received : undefined,
        change: paymentMethod === "cash" ? change : undefined,
        status: "completed",
        createdAt: new Date().toISOString(),
      }

      data.sales.push(newSale)

      // Update cash drawer
      if (paymentMethod === "cash") {
        data.cashDrawerTransactions.push({
          id: Date.now().toString(),
          type: "sale",
          amount: total,
          description: `Sale #${newSale.id}`,
          createdAt: new Date().toISOString(),
        })

        if (change > 0) {
          data.cashDrawerTransactions.push({
            id: (Date.now() + 1).toString(),
            type: "withdrawal",
            amount: -change,
            description: `Change for Sale #${newSale.id}`,
            createdAt: new Date().toISOString(),
          })
        }
      }

      // Update product quantities
      cart.forEach((item) => {
        const productIndex = data.products.findIndex((p) => p.id === item.productId)
        if (productIndex !== -1) {
          data.products[productIndex].quantity -= item.quantity
        }
      })

      savePosData(data)
      setLastReceipt(newSale)
      setShowReceiptModal(true)
      setShowCheckoutModal(false)
      setCart([])
      setAmountReceived("")
      setSuccess("Sale completed successfully!")
      setTimeout(() => setSuccess(""), 2000)
    } catch (err) {
      setError("Failed to complete sale")
      console.error(err)
    }
  }

  const handlePrint = () => {
    if (!lastReceipt) return

    const receiptData = getPosData()
    const customer = receiptData.customers.find((c) => c.id === lastReceipt.customerId)

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Receipt #${lastReceipt.id}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Courier New', monospace;
              background: white;
              color: black;
              line-height: 1.4;
            }
            
            .receipt {
              max-width: 80mm;
              margin: 0 auto;
              padding: 20px;
            }
            
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
              margin-bottom: 15px;
            }
            
            .header h1 {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            
            .header p {
              font-size: 11px;
              margin-bottom: 3px;
            }
            
            .receipt-info {
              text-align: center;
              font-size: 11px;
              margin-bottom: 15px;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
            }
            
            .customer-info {
              font-size: 11px;
              margin-bottom: 10px;
              border-bottom: 1px solid #000;
              padding-bottom: 10px;
            }
            
            .items {
              font-size: 11px;
              margin-bottom: 10px;
              border-bottom: 1px solid #000;
              padding-bottom: 10px;
            }
            
            .item {
              margin-bottom: 8px;
            }
            
            .item-name {
              font-weight: bold;
              display: flex;
              justify-content: space-between;
            }
            
            .item-details {
              font-size: 10px;
              display: flex;
              justify-content: space-between;
              color: #333;
            }
            
            .totals {
              margin-bottom: 10px;
              border-bottom: 1px solid #000;
              padding-bottom: 10px;
              font-size: 11px;
            }
            
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            
            .total-amount {
              font-weight: bold;
              font-size: 14px;
            }
            
            .payment-info {
              font-size: 11px;
              margin-bottom: 10px;
              border-bottom: 1px solid #000;
              padding-bottom: 10px;
            }
            
            .footer {
              text-align: center;
              font-size: 11px;
              font-weight: bold;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              
              .receipt {
                max-width: 100%;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>${receiptData.settings.businessName}</h1>
              ${receiptData.settings.address ? `<p>${receiptData.settings.address}</p>` : ""}
              ${receiptData.settings.phone ? `<p>${receiptData.settings.phone}</p>` : ""}
              ${receiptData.settings.businessNumber ? `<p>License: ${receiptData.settings.businessNumber}</p>` : ""}
            </div>
            
            <div class="receipt-info">
              <div><strong>RECEIPT</strong></div>
              <div>Receipt #: ${lastReceipt.id}</div>
              <div>${new Date(lastReceipt.createdAt).toLocaleDateString()}</div>
              <div>${new Date(lastReceipt.createdAt).toLocaleTimeString()}</div>
            </div>
            
            ${
              customer && !customer.isWalkIn
                ? `
              <div class="customer-info">
                <div><strong>Customer:</strong> ${customer.name}</div>
                ${customer.phone ? `<div>${customer.phone}</div>` : ""}
              </div>
            `
                : ""
            }
            
            <div class="items">
              ${lastReceipt.items
                .map(
                  (item) => `
                <div class="item">
                  <div class="item-name">
                    <span>${item.productName}</span>
                    <span>${currencySymbol}${item.total.toFixed(2)}</span>
                  </div>
                  <div class="item-details">
                    <span>Qty: ${item.quantity}</span>
                    <span>@ ${currencySymbol}${item.unitPrice.toFixed(2)}</span>
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>
            
            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>${currencySymbol}${lastReceipt.subtotal.toFixed(2)}</span>
              </div>
              <div class="total-row total-amount">
                <span>TOTAL:</span>
                <span>${currencySymbol}${lastReceipt.total.toFixed(2)}</span>
              </div>
            </div>
            
            <div class="payment-info">
              <div><strong>Payment:</strong> ${lastReceipt.paymentMethod.toUpperCase()}</div>
              ${
                lastReceipt.amountReceived
                  ? `
                <div>Received: ${currencySymbol}${lastReceipt.amountReceived.toFixed(2)}</div>
                <div>Change: ${currencySymbol}${lastReceipt.change?.toFixed(2)}</div>
              `
                  : ""
              }
            </div>
            
            <div class="footer">
              <p>Thank you for your purchase!</p>
              <p style="font-size: 10px; margin-top: 5px;">Visit us again soon</p>
              <p style="font-size: 9px; margin-top: 5px; font-weight: normal;">Powered by BILLGO</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Close previous print window if exists
    if (printWindowRef.current && !printWindowRef.current.closed) {
      printWindowRef.current.close()
    }

    // Open new print window
    const printWindow = window.open("", "PRINT_RECEIPT", "width=400,height=600")
    if (printWindow) {
      printWindowRef.current = printWindow
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()

      // Do not trigger print programmatically to avoid opening system print dialog automatically.
      // User can print manually from the opened window if needed.
    }
  }

  const handleShare = async () => {
    if (!lastReceipt) return

    const receiptText = `Receipt #${lastReceipt.id}\n${new Date(lastReceipt.createdAt).toLocaleString()}\n\nItems:\n${lastReceipt.items.map((item) => `${item.productName}: ${currencySymbol}${item.total.toFixed(2)}`).join("\n")}\n\nTotal: ${currencySymbol}${lastReceipt.total.toFixed(2)}\n\nThank you for your purchase!`

    try {
      if (navigator.share) {
        await navigator.share({ title: "Receipt", text: receiptText })
      } else {
        await navigator.clipboard.writeText(receiptText)
        setSuccess("Receipt copied to clipboard!")
        setTimeout(() => setSuccess(""), 2000)
      }
    } catch (err) {
      console.error("Share failed:", err)
      try {
        await navigator.clipboard.writeText(receiptText)
        setSuccess("Receipt copied to clipboard!")
        setTimeout(() => setSuccess(""), 2000)
      } catch {
        setError("Failed to copy receipt")
      }
    }
  }

  const handleNewSale = () => {
    setCart([])
    setAmountReceived("")
    setPaymentMethod("cash")
    setShowReceiptModal(false)
    setSelectedCustomer("walk-in")
    setFocusedItemId(null)
    setLastReceipt(null)
    setError("")
    setSuccess("")
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <ShoppingCart className="w-8 h-8" />
          Point of Sale
        </h1>
        <p className="text-muted-foreground mt-1">Complete transactions and manage sales</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products by name or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
            </div>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="p-4 cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-primary transition-all group"
                onClick={() => handleAddToCart(product)}
              >
                <p className="font-semibold text-foreground text-sm truncate group-hover:text-primary">
                  {product.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {unitLabel}: {product.quantity.toFixed(2)}
                </p>
                {product.quantity < 10 && product.quantity > 0 && (
                  <p className="text-xs text-orange-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Low stock
                  </p>
                )}
                {product.quantity === 0 && (
                  <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Out of stock
                  </p>
                )}
                <p className="text-primary font-bold text-sm mt-2">
                  {formatCurrency(product.salePrice, currencySymbol)}
                </p>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <Card className="p-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No products found</p>
            </Card>
          )}
        </div>

        {/* Cart Section */}
        <div className="space-y-4">
          <Card className="p-4 sticky top-20">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Cart ({cart.length})
            </h2>

            {/* Customer Selection */}
            <div className="mb-4 pb-4 border-b border-border">
              <label className="block text-xs font-medium text-muted-foreground mb-2">Customer</label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Items */}
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Cart is empty</p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    className={`flex items-center justify-between text-xs bg-muted p-2 rounded cursor-pointer transition-all ${
                      focusedItemId === item.productId ? "ring-2 ring-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setFocusedItemId(item.productId)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{item.productName}</p>
                      <p className="text-muted-foreground">
                        {item.quantity}x {formatCurrency(item.unitPrice, currencySymbol)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUpdateQuantity(item.productId, item.quantity - 1)
                        }}
                        className="p-1 hover:bg-primary/20 rounded transition-colors"
                        title="Decrease quantity"
                      >
                        <Minus className="w-3 h-3 text-primary" />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(item.productId, parseInt(e.target.value) || 0)}
                        className="w-6 px-0.5 py-0.5 border border-border rounded text-xs bg-background text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUpdateQuantity(item.productId, item.quantity + 1)
                        }}
                        className="p-1 hover:bg-primary/20 rounded transition-colors"
                        title="Increase quantity"
                      >
                        <Plus className="w-3 h-3 text-primary" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveFromCart(item.productId)
                        }}
                        className="p-1 hover:bg-destructive/20 rounded transition-colors"
                        title="Remove from cart"
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-border pt-3 space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold text-foreground">{formatCurrency(subtotal, currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold bg-primary/10 p-3 rounded border border-primary/20">
                <span className="text-foreground">Total:</span>
                <span className="text-primary">{formatCurrency(total, currencySymbol)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <Button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 py-2"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Checkout ({cart.length} items)
            </Button>
          </Card>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5" />
                Payment Details
              </h2>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-3">Payment Method</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPaymentMethod("cash")
                      setAmountReceived("")
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                      paymentMethod === "cash"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Cash
                  </button>
                  <button
                    onClick={() => {
                      setPaymentMethod("card")
                      setAmountReceived("")
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                      paymentMethod === "card"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <CreditCard className="w-4 h-4 inline mr-2" />
                    Card
                  </button>
                </div>
              </div>

              {/* Amount Received */}
              {paymentMethod === "cash" && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">Amount Received</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-lg"
                  />
                  {amountReceived && (
                    <div className="mt-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">
                        Total: {formatCurrency(total, currencySymbol)}
                      </p>
                      <p className="text-sm font-bold text-primary">
                        Change: {formatCurrency(Math.max(0, parseFloat(amountReceived) - total), currencySymbol)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              <div className="bg-muted p-4 rounded-lg mb-6">
                <p className="text-xs text-muted-foreground mb-1">Order Total</p>
                <p className="text-3xl font-bold text-foreground">{formatCurrency(total, currencySymbol)}</p>
                <p className="text-xs text-muted-foreground mt-2">{cart.length} items in cart</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={handleCompleteSale} className="flex-1 bg-primary hover:bg-primary/90 py-2">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Sale
                </Button>
                <Button onClick={() => setShowCheckoutModal(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && lastReceipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-96 overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Sale Completed
              </h2>

              <Receipt sale={lastReceipt} />

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-border">
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className="flex flex-col items-center gap-1 bg-transparent py-3 hover:bg-blue-500/10"
                  title="Print receipt"
                >
                  <Printer className="w-4 h-4" />
                  <span className="text-xs">Print</span>
                </Button>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="flex flex-col items-center gap-1 bg-transparent py-3 hover:bg-green-500/10"
                  title="Share receipt"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-xs">Share</span>
                </Button>
                <Button
                  onClick={handleNewSale}
                  className="bg-primary hover:bg-primary/90 flex flex-col items-center gap-1 py-3"
                  title="Start new sale"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-xs">Next</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}