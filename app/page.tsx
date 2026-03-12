"use client"

import { Card } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { getPosData } from "@/lib/data-persistence"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import {
  TrendingUp,
  Users,
  Package,
  DollarSign,
  ShoppingCart,
  Warehouse,
  BarChart3,
  Settings,
  AlertTriangle,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardStats {
  todaySales: number
  todayTransactions: number
  totalProfit: number
  lowStockItems: number
  cashBalance: number
  totalCustomers: number
  totalProducts: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayTransactions: 0,
    totalProfit: 0,
    lowStockItems: 0,
    cashBalance: 0,
    totalCustomers: 0,
    totalProducts: 0,
  })
  const [currencySymbol, setCurrencySymbol] = useState("₨")
  const [loading, setLoading] = useState(true)
  const [showCashBalance, setShowCashBalance] = useState(true)
  const [recentSales, setRecentSales] = useState<any[]>([])

  useEffect(() => {
    const calculateStats = () => {
      try {
        const data = getPosData()
        setCurrencySymbol(data.settings.currencySymbol || "₨")

        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        // Today's sales
        const todaysSales = data.sales.filter((s) => new Date(s.createdAt) >= startOfDay)
        const todaySalesTotal = todaysSales.reduce((sum, s) => sum + s.total, 0)

        // Profit calculation
        let totalProfit = 0
        todaysSales.forEach((sale) => {
          sale.items.forEach((item) => {
            const product = data.products.find((p) => p.id === item.productId)
            if (product) {
              const profitPerItem = item.unitPrice - product.costPrice
              totalProfit += profitPerItem * item.quantity
            }
          })
        })

        // Low stock items
        const lowStock = data.products.filter((p) => p.quantity < 10).length

        // Cash balance
        const cashBalance = data.cashDrawerTransactions.reduce((sum, tx) => {
          if (tx.type === "opening" || tx.type === "sale") return sum + tx.amount
          return sum + tx.amount
        }, 0)

        // Get recent sales
        const recent = todaysSales
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)

        setStats({
          todaySales: todaySalesTotal,
          todayTransactions: todaysSales.length,
          totalProfit,
          lowStockItems: lowStock,
          cashBalance,
          totalCustomers: data.customers.length - 1, // Exclude walk-in
          totalProducts: data.products.length,
        })

        setRecentSales(recent)
      } catch (error) {
        console.error("Error calculating stats:", error)
      } finally {
        setLoading(false)
      }
    }

    calculateStats()
  }, [])

  const quickLinks = [
    {
      href: "/sales",
      title: "New Sale",
      description: "Start a new transaction",
      icon: ShoppingCart,
      color: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
    },
    {
      href: "/products",
      title: "Manage Products",
      description: "Add and edit inventory",
      icon: Package,
      color: "from-purple-500/10 to-purple-500/5 border-purple-500/20",
    },
    {
      href: "/customers",
      title: "Customers",
      description: "Manage customer database",
      icon: Users,
      color: "from-green-500/10 to-green-500/5 border-green-500/20",
    },
    {
      href: "/cash-drawer",
      title: "Cash Drawer",
      description: "Track cash movements",
      icon: DollarSign,
      color: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
    },
    {
      href: "/suppliers",
      title: "Suppliers",
      description: "Manage suppliers",
      icon: Warehouse,
      color: "from-orange-500/10 to-orange-500/5 border-orange-500/20",
    },
    {
      href: "/reports",
      title: "Reports",
      description: "View analytics",
      icon: BarChart3,
      color: "from-red-500/10 to-red-500/5 border-red-500/20",
    },
  ]

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header with Welcome Message */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Today's Summary - {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Link href="/settings">
          <Button variant="outline" size="icon" className="bg-transparent">
            <Settings className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Alert for Low Stock */}
      {stats.lowStockItems > 0 && (
        <Card className="p-4 bg-orange-500/10 border-orange-500/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-orange-700">Low Stock Alert</p>
            <p className="text-sm text-orange-600">{stats.lowStockItems} products below 10 units</p>
          </div>
          <Link href="/products">
            <Button size="sm" variant="outline" className="bg-transparent border-orange-500/20">
              View Products
            </Button>
          </Link>
        </Card>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Sales */}
        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Sales</p>
          <p className="text-2xl font-bold text-foreground mt-2">
            {formatCurrency(stats.todaySales, currencySymbol)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Today's revenue</p>
        </Card>

        {/* Transactions */}
        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-xs font-semibold text-green-600">+0%</p>
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Transactions</p>
          <p className="text-2xl font-bold text-foreground mt-2">{stats.todayTransactions}</p>
          <p className="text-xs text-muted-foreground mt-2">Sales today</p>
        </Card>

        {/* Profit */}
        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xs font-semibold text-green-600">
              {stats.todaySales > 0 ? ((stats.totalProfit / stats.todaySales) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Profit</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(stats.totalProfit, currencySymbol)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Profit margin</p>
        </Card>

        {/* Low Stock */}
        <Card
          className={`p-6 bg-gradient-to-br border hover:shadow-lg transition-all ${
            stats.lowStockItems > 0
              ? "from-orange-500/10 to-orange-500/5 border-orange-500/20"
              : "from-gray-500/10 to-gray-500/5 border-gray-500/20"
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                stats.lowStockItems > 0 ? "bg-orange-500/20" : "bg-gray-500/20"
              }`}
            >
              <AlertTriangle className={`w-5 h-5 ${stats.lowStockItems > 0 ? "text-orange-600" : "text-gray-600"}`} />
            </div>
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Low Stock Items</p>
          <p className={`text-2xl font-bold mt-2 ${stats.lowStockItems > 0 ? "text-orange-600" : "text-gray-600"}`}>
            {stats.lowStockItems}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Below 10 units</p>
        </Card>

        {/* Cash Balance */}
        <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <button
              onClick={() => setShowCashBalance(!showCashBalance)}
              className="p-1 hover:bg-muted rounded-lg transition-colors"
            >
              {showCashBalance ? (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Eye className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cash Balance</p>
          <p className="text-2xl font-bold text-foreground mt-2">
            {showCashBalance ? formatCurrency(stats.cashBalance, currencySymbol) : "••••••"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">In drawer</p>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-muted/30 border-muted">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Products</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalProducts}</p>
            </div>
            <Package className="w-8 h-8 text-muted-foreground opacity-20" />
          </div>
        </Card>

        <Card className="p-4 bg-muted/30 border-muted">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Customers</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalCustomers}</p>
            </div>
            <Users className="w-8 h-8 text-muted-foreground opacity-20" />
          </div>
        </Card>

        <Card className="p-4 bg-muted/30 border-muted">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg Order Value</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(stats.todayTransactions > 0 ? stats.todaySales / stats.todayTransactions : 0, currencySymbol)}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-muted-foreground opacity-20" />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
          <p className="text-xs text-muted-foreground">Access main features</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => {
            const IconComponent = link.icon
            return (
              <Link key={link.href} href={link.href}>
                <Card
                  className={`p-6 cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200 group bg-gradient-to-br ${link.color}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {link.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      {recentSales.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Sales</h2>
            <Link href="/reports">
              <Button size="sm" variant="outline" className="bg-transparent">
                View All
              </Button>
            </Link>
          </div>
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Time</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Items</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(sale.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 text-foreground">{sale.items.length} items</td>
                      <td className="px-4 py-3 font-semibold text-primary">{formatCurrency(sale.total, currencySymbol)}</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">
                        <span className="inline-block px-2 py-1 bg-muted rounded text-xs font-medium">
                          {sale.paymentMethod}
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

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pt-6 border-t border-border">
        <p>
          Last updated: {new Date().toLocaleTimeString()} • BILLGO v1.0.0 •{" "}
          <a href="#" className="text-primary hover:underline">
            Powered by BILLGO@solutions
          </a>
        </p>
      </div>
    </div>
  )
}