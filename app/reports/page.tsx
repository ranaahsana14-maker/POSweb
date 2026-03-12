"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Download,
  FileText,
  BarChart3,
  TrendingUp,
  Calendar,
  Users,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Filter,
  Eye,
  PrinterIcon,
  Share2,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react"
import { getPosData, getCurrencySymbol, type Sale } from "@/lib/data-persistence"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"sales" | "customers" | "products" | "suppliers">("sales")
  const [filterPeriod, setFilterPeriod] = useState<"today" | "week" | "month" | "year">("today")
  const [data, setData] = useState<any>(null)
  const [currencySymbol, setCurrencySymbol] = useState("₨")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadData = () => {
      try {
        const posData = getPosData()
        setData(posData)
        setCurrencySymbol(posData.settings.currencySymbol)
        setLoading(false)
      } catch (err) {
        setError("Failed to load report data")
        console.error(err)
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Ensure reportType is valid after data loads — run unconditionally to keep hook order stable
  useEffect(() => {
    if (!data) return
    const flags = (data.settings && data.settings.featuresEnabled) || {}
    const options: string[] = []
    if (flags.reportsSales !== false) options.push("sales")
    if (flags.reportsCustomers !== false) options.push("customers")
    if (flags.products !== false) options.push("products")
    if (flags.reportsSuppliers !== false) options.push("suppliers")

    if (options.length > 0 && !options.includes(reportType)) {
      setReportType(options[0] as any)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    )
  }

  if (data.settings && data.settings.featuresEnabled && data.settings.featuresEnabled.reports === false) {
    return (
      <div className="p-6 md:p-8">
        <Card className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Reports feature is disabled by system administrator.</p>
        </Card>
      </div>
    )
  }

  const flags = (data.settings && data.settings.featuresEnabled) || {}
  const availableReportOptions: { value: string; label: string }[] = []
  if (flags.reportsSales !== false) availableReportOptions.push({ value: "sales", label: "Sales Report" })
  if (flags.reportsCustomers !== false) availableReportOptions.push({ value: "customers", label: "Customers Report" })
  if (flags.products !== false) availableReportOptions.push({ value: "products", label: "Products Report" })
  if (flags.reportsSuppliers !== false) availableReportOptions.push({ value: "suppliers", label: "Suppliers Report" })

  if (!data) {
    return (
      <div className="p-6 md:p-8">
        <Card className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive">{error || "Failed to load report data"}</p>
        </Card>
      </div>
    )
  }

  // Get filtered data based on period
  const getFilteredData = (period: string) => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(now.getDate() - now.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    let startDate = startOfDay

    switch (period) {
      case "week":
        startDate = startOfWeek
        break
      case "month":
        startDate = startOfMonth
        break
      case "year":
        startDate = startOfYear
        break
      default:
        startDate = startOfDay
    }

    return {
      sales: data.sales.filter((s: any) => new Date(s.createdAt) >= startDate),
      expenses: data.cashDrawerTransactions.filter(
        (t: any) => t.type === "expense" && new Date(t.createdAt) >= startDate,
      ),
      supplies: data.supplies.filter((s: any) => new Date(s.createdAt) >= startDate),
    }
  }

  const filtered = getFilteredData(filterPeriod)

  // Calculate sales statistics
  const salesStats = {
    totalSales: filtered.sales.reduce((sum: number, s: any) => sum + s.total, 0),
    totalTransactions: filtered.sales.length,
    avgOrderValue:
      filtered.sales.length > 0
        ? filtered.sales.reduce((sum: number, s: any) => sum + s.total, 0) / filtered.sales.length
        : 0,
    totalProfit: filtered.sales.reduce((sum: number, s: any) => {
      const profit = s.items.reduce((itemSum: number, item: any) => {
        const product = data.products.find((p: any) => p.id === item.productId)
        if (product) {
          return itemSum + (item.unitPrice - product.costPrice) * item.quantity
        }
        return itemSum
      }, 0)
      return sum + profit
    }, 0),
    cashSales: filtered.sales.filter((s: any) => s.paymentMethod === "cash").length,
    cardSales: filtered.sales.filter((s: any) => s.paymentMethod === "card").length,
    totalItems: filtered.sales.reduce((sum: number, s: any) => sum + s.items.length, 0),
    totalExpenses: filtered.expenses.reduce((sum: number, e: any) => sum + Math.abs(e.amount), 0),
  }

  // Calculate customer statistics
  const customerStats = {
    totalCustomers: data.customers.filter((c: any) => !c.isWalkIn).length,
    topCustomers: data.customers
      .filter((c: any) => !c.isWalkIn)
      .map((c: any) => {
        const customerSales = data.sales.filter((s: any) => s.customerId === c.id)
        return {
          name: c.name,
          purchases: customerSales.length,
          spent: customerSales.reduce((sum: number, s: any) => sum + s.total, 0),
        }
      })
      .sort((a: any, b: any) => b.spent - a.spent)
      .slice(0, 5),
  }

  // Calculate product statistics
  const productStats = {
    totalProducts: data.products.length,
    lowStockProducts: data.products.filter((p: any) => p.quantity < 10).length,
    topSellingProducts: data.sales
      .reduce((acc: any[], sale: any) => {
        sale.items.forEach((item: any) => {
          const existing = acc.find((p) => p.productId === item.productId)
          if (existing) {
            existing.quantity += item.quantity
            existing.revenue += item.total
          } else {
            acc.push({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              revenue: item.total,
            })
          }
        })
        return acc
      }, [])
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5),
  }

  // Calculate supplier statistics
  const supplierStats = {
    totalSuppliers: data.suppliers.length,
    totalSupplies: data.supplies.length,
    totalCost: data.supplies.reduce((sum: number, s: any) => sum + (s.totalCost || 0), 0),
    topSuppliers: data.suppliers
      .map((sp: any) => {
        const supplies = data.supplies.filter((s: any) => s.supplierId === sp.id)
        const total = supplies.reduce((sum: number, s: any) => sum + (s.totalCost || 0), 0)
        return { name: sp.name, supplies: supplies.length, totalCost: total }
      })
      .sort((a: any, b: any) => b.totalCost - a.totalCost)
      .slice(0, 5),
  }

  // PDF Export Functions
  const downloadPDF = (htmlContent: string, filename: string) => {
    try {
      // Download the HTML content as a file instead of auto-printing to avoid system print dialog
      const blob = new Blob([htmlContent], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const el = document.createElement("a")
      el.href = url
      el.download = `${filename}.html`
      document.body.appendChild(el)
      el.click()
      document.body.removeChild(el)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export error:", error)
      alert("Failed to export report")
    }
  }

  const generateSalesReportHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sales Report</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background: white;
            }
            .container {
              max-width: 1000px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px solid #0066cc;
              padding-bottom: 20px;
            }
            .header h1 {
              font-size: 28px;
              margin-bottom: 5px;
              color: #000;
            }
            .header p {
              color: #666;
              font-size: 14px;
              margin: 3px 0;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin-bottom: 40px;
            }
            .stat-card {
              background: #f5f5f5;
              padding: 20px;
              border-left: 4px solid #0066cc;
              border-radius: 4px;
            }
            .stat-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 8px;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #000;
            }
            .table-section {
              margin-bottom: 40px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #0066cc;
              color: #000;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th {
              background-color: #0066cc;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: 600;
              font-size: 13px;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #ddd;
              font-size: 13px;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .summary {
              background: #f0f7ff;
              padding: 20px;
              border-left: 4px solid #0066cc;
              margin-top: 20px;
              border-radius: 4px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 14px;
            }
            .summary-row:last-child {
              margin-bottom: 0;
              font-weight: bold;
              font-size: 16px;
              padding-top: 10px;
              border-top: 2px solid #0066cc;
              margin-top: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .container {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${data.settings.businessName}</h1>
              <p><strong>Sales Report</strong></p>
              <p>Period: ${filterPeriod.charAt(0).toUpperCase() + filterPeriod.slice(1)}</p>
              <p>Generated: ${formatDateTime(new Date())}</p>
              ${data.settings.address ? `<p>Address: ${data.settings.address}</p>` : ""}
              ${data.settings.phone ? `<p>Phone: ${data.settings.phone}</p>` : ""}
            </div>

            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Total Sales</div>
                <div class="stat-value">${currencySymbol}${salesStats.totalSales.toFixed(2)}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Transactions</div>
                <div class="stat-value">${salesStats.totalTransactions}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Average Order</div>
                <div class="stat-value">${currencySymbol}${salesStats.avgOrderValue.toFixed(2)}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Total Profit</div>
                <div class="stat-value">${currencySymbol}${salesStats.totalProfit.toFixed(2)}</div>
              </div>
            </div>

            <div class="table-section">
              <div class="section-title">Sales Transactions</div>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Method</th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered.sales
                    .map((sale: any) => {
                      const customer = data.customers.find((c: any) => c.id === sale.customerId)
                      return `
                        <tr>
                          <td>${formatDate(sale.createdAt)}</td>
                          <td>${customer?.name || "Walk-in"}</td>
                          <td>${sale.items.length}</td>
                          <td>${currencySymbol}${sale.total.toFixed(2)}</td>
                          <td>${sale.paymentMethod.toUpperCase()}</td>
                        </tr>
                      `
                    })
                    .join("")}
                </tbody>
              </table>
            </div>

            <div class="summary">
              <div class="summary-row">
                <span>Cash Sales:</span>
                <span>${salesStats.cashSales}</span>
              </div>
              <div class="summary-row">
                <span>Card Sales:</span>
                <span>${salesStats.cardSales}</span>
              </div>
              <div class="summary-row">
                <span>Total Items Sold:</span>
                <span>${salesStats.totalItems}</span>
              </div>
              <div class="summary-row">
                <span>Total Expenses:</span>
                <span>${currencySymbol}${salesStats.totalExpenses.toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Net Income:</span>
                <span>${currencySymbol}${(salesStats.totalProfit - salesStats.totalExpenses).toFixed(2)}</span>
              </div>
            </div>

            <div class="footer">
              <p>This report was generated by BILLGO POS System</p>
              <p>For official use only</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  const generateCustomerReportHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Customer Report</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background: white;
            }
            .container {
              max-width: 1000px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px solid #0066cc;
              padding-bottom: 20px;
            }
            .header h1 {
              font-size: 28px;
              margin-bottom: 5px;
              color: #000;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #0066cc;
              color: #000;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th {
              background-color: #0066cc;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: 600;
              font-size: 13px;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #ddd;
              font-size: 13px;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .stat-card {
              background: #f5f5f5;
              padding: 20px;
              border-left: 4px solid #0066cc;
              margin-bottom: 20px;
              border-radius: 4px;
            }
            .stat-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 8px;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #000;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${data.settings.businessName}</h1>
              <p><strong>Customer Report</strong></p>
              <p>Generated: ${formatDateTime(new Date())}</p>
            </div>

            <div class="stat-card">
              <div class="stat-label">Total Customers</div>
              <div class="stat-value">${customerStats.totalCustomers}</div>
            </div>

            <div>
              <div class="section-title">All Customers</div>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Purchases</th>
                    <th>Total Spent</th>
                    <th>Phone</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.customers
                    .filter((c: any) => !c.isWalkIn)
                    .map((customer: any) => {
                      const customerSales = data.sales.filter((s: any) => s.customerId === customer.id)
                      const totalSpent = customerSales.reduce((sum: number, s: any) => sum + s.total, 0)
                      return `
                        <tr>
                          <td>${customer.name}</td>
                          <td>${customerSales.length}</td>
                          <td>${currencySymbol}${totalSpent.toFixed(2)}</td>
                          <td>${customer.phone || "-"}</td>
                          <td>${customer.email || "-"}</td>
                        </tr>
                      `
                    })
                    .join("")}
                </tbody>
              </table>
            </div>

            <div style="margin-top: 40px;">
              <div class="section-title">Top 5 Customers</div>
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Purchases</th>
                    <th>Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  ${customerStats.topCustomers
                    .map(
                      (customer: any, index: number) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${customer.name}</td>
                      <td>${customer.purchases}</td>
                      <td>${currencySymbol}${customer.spent.toFixed(2)}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        </body>
      </html>
    `
  }

  const generateProductReportHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Product Report</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background: white;
            }
            .container {
              max-width: 1000px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px solid #0066cc;
              padding-bottom: 20px;
            }
            .header h1 {
              font-size: 28px;
              margin-bottom: 5px;
              color: #000;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin-bottom: 40px;
            }
            .stat-card {
              background: #f5f5f5;
              padding: 20px;
              border-left: 4px solid #0066cc;
              border-radius: 4px;
            }
            .stat-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 8px;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #000;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #0066cc;
              color: #000;
              margin-top: 40px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th {
              background-color: #0066cc;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: 600;
              font-size: 13px;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #ddd;
              font-size: 13px;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${data.settings.businessName}</h1>
              <p><strong>Product Inventory Report</strong></p>
              <p>Generated: ${formatDateTime(new Date())}</p>
            </div>

            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Total Products</div>
                <div class="stat-value">${productStats.totalProducts}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Low Stock Items</div>
                <div class="stat-value">${productStats.lowStockProducts}</div>
              </div>
            </div>

            <div class="section-title">Top 5 Selling Products</div>
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Product Name</th>
                  <th>Quantity Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${productStats.topSellingProducts
                  .map(
                    (product: any, index: number) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${product.productName}</td>
                    <td>${product.quantity.toFixed(2)}</td>
                    <td>${currencySymbol}${product.revenue.toFixed(2)}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>

            <div class="section-title">All Products Inventory</div>
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>Cost Price</th>
                  <th>Sale Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${data.products
                  .map(
                    (product: any) => `
                  <tr>
                    <td>${product.name}</td>
                    <td>${product.quantity.toFixed(2)}</td>
                    <td>${currencySymbol}${product.costPrice.toFixed(2)}</td>
                    <td>${currencySymbol}${product.salePrice.toFixed(2)}</td>
                    <td>${product.quantity < 10 ? "LOW STOCK" : "OK"}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `
  }

  const exportSalesReport = () => downloadPDF(generateSalesReportHTML(), `sales-report-${filterPeriod}`)
  const exportCustomerReport = () => downloadPDF(generateCustomerReportHTML(), `customer-report-${filterPeriod}`)
  const exportProductReport = () => downloadPDF(generateProductReportHTML(), `product-report-${filterPeriod}`)

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">View and export comprehensive business reports</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {availableReportOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Period
            </label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as any)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => {
                if (reportType === "sales") exportSalesReport()
                else if (reportType === "customers") exportCustomerReport()
                else if (reportType === "products") exportProductReport()
              }}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </Card>

      {/* Sales Report */}
      {reportType === "sales" && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <p className="text-xs font-medium text-muted-foreground mb-2">Total Sales</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(salesStats.totalSales, currencySymbol)}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
              <p className="text-xs font-medium text-muted-foreground mb-2">Transactions</p>
              <p className="text-2xl font-bold text-foreground">{salesStats.totalTransactions}</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <p className="text-xs font-medium text-muted-foreground mb-2">Avg Order Value</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(salesStats.avgOrderValue, currencySymbol)}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
              <p className="text-xs font-medium text-muted-foreground mb-2">Total Profit</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(salesStats.totalProfit, currencySymbol)}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
              <p className="text-xs font-medium text-muted-foreground mb-2">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(salesStats.totalExpenses, currencySymbol)}
              </p>
            </Card>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Payment Methods
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cash Sales:</span>
                  <span className="font-semibold text-foreground">{salesStats.cashSales}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Card Sales:</span>
                  <span className="font-semibold text-foreground">{salesStats.cardSales}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Items Statistics
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Items:</span>
                  <span className="font-semibold text-foreground">{salesStats.totalItems}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg per Order:</span>
                  <span className="font-semibold text-foreground">
                    {salesStats.totalTransactions > 0 ? (salesStats.totalItems / salesStats.totalTransactions).toFixed(2) : "0"}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Profit Margin
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Margin %:</span>
                  <span className="font-semibold text-foreground">
                    {salesStats.totalSales > 0 ? ((salesStats.totalProfit / salesStats.totalSales) * 100).toFixed(2) : "0"}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Net Income:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(salesStats.totalProfit - salesStats.totalExpenses, currencySymbol)}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Sales Table */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Sales Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Items</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.sales.map((sale: any) => {
                    const customer = data.customers.find((c: any) => c.id === sale.customerId)
                    return (
                      <tr key={sale.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 text-foreground">{formatDate(sale.createdAt)}</td>
                        <td className="py-3 px-4 text-foreground">{customer?.name || "Walk-in"}</td>
                        <td className="py-3 px-4 text-muted-foreground">{sale.items.length}</td>
                        <td className="py-3 px-4 font-medium text-primary">
                          {formatCurrency(sale.total, currencySymbol)}
                        </td>
                        <td className="py-3 px-4 capitalize text-muted-foreground">
                          <span className="inline-block px-2 py-1 bg-muted rounded text-xs font-medium">
                            {sale.paymentMethod}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Customers Report */}
      {reportType === "customers" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <p className="text-xs font-medium text-muted-foreground mb-2">Total Customers</p>
              <p className="text-2xl font-bold text-foreground">{customerStats.totalCustomers}</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <p className="text-xs font-medium text-muted-foreground mb-2">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(
                  data.sales.reduce((sum: number, s: any) => sum + s.total, 0),
                  currencySymbol,
                )}
              </p>
            </Card>
          </div>

          {/* Top Customers */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top 5 Customers
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Purchases</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {customerStats.topCustomers.map((customer: any, index: number) => (
                    <tr key={index} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">{customer.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{customer.purchases}</td>
                      <td className="py-3 px-4 font-semibold text-primary">
                        {formatCurrency(customer.spent, currencySymbol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* All Customers */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">All Customers</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Purchases</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Total Spent</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {data.customers
                    .filter((c: any) => !c.isWalkIn)
                    .map((customer: any) => {
                      const customerSales = data.sales.filter((s: any) => s.customerId === customer.id)
                      const totalSpent = customerSales.reduce((sum: number, s: any) => sum + s.total, 0)
                      return (
                        <tr key={customer.id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium text-foreground">{customer.name}</td>
                          <td className="py-3 px-4 text-muted-foreground">{customerSales.length}</td>
                          <td className="py-3 px-4 font-semibold text-primary">
                            {formatCurrency(totalSpent, currencySymbol)}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-xs">
                            {customer.phone || customer.email || "-"}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Products Report */}
      {reportType === "products" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <p className="text-xs font-medium text-muted-foreground mb-2">Total Products</p>
              <p className="text-2xl font-bold text-foreground">{productStats.totalProducts}</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
              <p className="text-xs font-medium text-muted-foreground mb-2">Low Stock Products</p>
              <p className="text-2xl font-bold text-orange-600">{productStats.lowStockProducts}</p>
            </Card>
          </div>

          {/* Top Products */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top 5 Selling Products
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Product</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Qty Sold</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {productStats.topSellingProducts.map((product: any, index: number) => (
                    <tr key={index} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">{product.productName}</td>
                      <td className="py-3 px-4 text-muted-foreground">{product.quantity.toFixed(2)}</td>
                      <td className="py-3 px-4 font-semibold text-primary">
                        {formatCurrency(product.revenue, currencySymbol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* All Products */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Product Inventory</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Product</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Quantity</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Cost</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Sale Price</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((product: any) => (
                    <tr key={product.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">{product.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{product.quantity.toFixed(2)}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatCurrency(product.costPrice, currencySymbol)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-primary">
                        {formatCurrency(product.salePrice, currencySymbol)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            product.quantity < 10
                              ? "bg-orange-500/10 text-orange-600"
                              : "bg-green-500/10 text-green-600"
                          }`}
                        >
                          {product.quantity < 10 ? "LOW STOCK" : "OK"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Suppliers Report */}
      {reportType === "suppliers" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <p className="text-xs font-medium text-muted-foreground mb-2">Total Suppliers</p>
              <p className="text-2xl font-bold text-foreground">{supplierStats.totalSuppliers}</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
              <p className="text-xs font-medium text-muted-foreground mb-2">Total Supplies</p>
              <p className="text-2xl font-bold text-foreground">{supplierStats.totalSupplies}</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <p className="text-xs font-medium text-muted-foreground mb-2">Total Cost</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(supplierStats.totalCost, currencySymbol)}</p>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Top Suppliers</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Supplier</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Supplies</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierStats.topSuppliers.map((s: any, idx: number) => (
                    <tr key={idx} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">{s.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{s.supplies}</td>
                      <td className="py-3 px-4 font-semibold text-primary">{formatCurrency(s.totalCost, currencySymbol)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">All Supplies</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Supplier</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Product</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Qty</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {data.supplies.map((sp: any) => {
                    const supplier = data.suppliers.find((s: any) => s.id === sp.supplierId)
                    return (
                      <tr key={sp.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 text-foreground">{formatDate(sp.createdAt)}</td>
                        <td className="py-3 px-4 text-foreground">{supplier?.name || "-"}</td>
                        <td className="py-3 px-4 text-muted-foreground">{sp.productName || "-"}</td>
                        <td className="py-3 px-4 text-muted-foreground">{sp.quantity}</td>
                        <td className="py-3 px-4 font-semibold text-primary">{formatCurrency(sp.totalCost, currencySymbol)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}