"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Minus,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Banknote,
  CreditCard,
  Download,
  Filter,
  X,
  Wallet,
  ArrowDown,
  ArrowUp,
  MoreVertical,
} from "lucide-react"
import {
  getPosData,
  savePosData,
  getCurrencySymbol,
  type CashDrawerTransaction,
} from "@/lib/data-persistence"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"

interface TransactionForm {
  amount: string
  purpose: string
  notes: string
}

export default function CashDrawerPage() {
  // States
  const [transactions, setTransactions] = useState<CashDrawerTransaction[]>([])
  const [showBalance, setShowBalance] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<"in" | "out">("in")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [currencySymbol, setCurrencySymbol] = useState("₨")
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState("today")
  const [showDetails, setShowDetails] = useState(false)

  const [formData, setFormData] = useState<TransactionForm>({
    amount: "",
    purpose: "",
    notes: "",
  })

  // Load data
  useEffect(() => {
    loadCashDrawer()
  }, [])

  const loadCashDrawer = () => {
    try {
      const data = getPosData()
      setTransactions(data.cashDrawerTransactions)
      setCurrencySymbol(data.settings.currencySymbol)
      setLoading(false)
    } catch (err) {
      setError("Failed to load cash drawer data")
      console.error(err)
      setLoading(false)
    }
  }

  // Get filtered transactions
  const getFilteredTransactions = () => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(now.getDate() - now.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    let startDate = startOfDay

    switch (filterDate) {
      case "week":
        startDate = startOfWeek
        break
      case "month":
        startDate = startOfMonth
        break
      case "today":
      default:
        startDate = startOfDay
    }

    return transactions.filter((tx) => new Date(tx.createdAt) >= startDate)
  }

  const filteredTransactions = getFilteredTransactions()

  // Calculate balances
  const currentBalance = transactions.reduce((sum, tx) => {
    if (tx.type === "sale") return sum + tx.amount
    return sum + tx.amount
  }, 0)

  const totalIn = filteredTransactions
    .filter((tx) => tx.type === "sale")
    .reduce((sum, tx) => sum + tx.amount, 0)

  const totalOut = filteredTransactions
    .filter((tx) => tx.type === "expense" || tx.type === "withdrawal")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

  const netFlow = totalIn - totalOut

  // Handle transaction
  const handleAddTransaction = () => {
    setError("")

    if (!formData.amount || !formData.purpose) {
      setError("Please fill all required fields")
      return
    }

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount")
      return
    }

    try {
      const data = getPosData()
      const txType = modalType === "in" ? "sale" : "expense"
      const description = `${formData.purpose}${formData.notes ? ": " + formData.notes : ""}`

      const newTx: CashDrawerTransaction = {
        id: Date.now().toString(),
        type: txType,
        amount: modalType === "in" ? amount : -amount,
        description,
        createdAt: new Date().toISOString(),
      }

      data.cashDrawerTransactions.push(newTx)
      savePosData(data)
      setTransactions([...data.cashDrawerTransactions])

      setFormData({ amount: "", purpose: "", notes: "" })
      setShowModal(false)
      setSuccess(
        `${modalType === "in" ? "Cash in" : "Cash out"} recorded successfully`,
      )
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Failed to record transaction")
      console.error(err)
    }
  }

  const openModal = (type: "in" | "out") => {
    setModalType(type)
    setFormData({ amount: "", purpose: "", notes: "" })
    setError("")
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({ amount: "", purpose: "", notes: "" })
    setError("")
  }



  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading cash drawer...</p>
        </div>
      </div>
    )
  }

  // Feature gate: cash drawer
  const posData = getPosData()
  if (posData.settings && posData.settings.featuresEnabled && posData.settings.featuresEnabled.cashDrawer === false) {
    return (
      <div className="p-6 md:p-8">
        <Card className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Cash Drawer feature is disabled by system administrator.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Wallet className="w-8 h-8" />
          Cash Drawer Management
        </h1>
        <p className="text-muted-foreground mt-1">Monitor and manage your cash drawer transactions</p>
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

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Balance */}
        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm text-muted-foreground font-medium">Current Balance</p>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-1 hover:bg-muted rounded-lg transition-colors"
            >
              {showBalance ? (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Eye className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {showBalance ? formatCurrency(currentBalance, currencySymbol) : "••••••"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Total cash in drawer</p>
        </Card>

        {/* Today's Summary */}
        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <p className="text-sm text-muted-foreground font-medium mb-2">Today's Summary</p>
          <div className="space-y-1">
            <p className="text-foreground text-xs">
              <span className="font-medium">In:</span> {formatCurrency(totalIn, currencySymbol)}
            </p>
            <p className="text-foreground text-xs">
              <span className="font-medium">Out:</span> {formatCurrency(totalOut, currencySymbol)}
            </p>
            <p
              className={`text-xs font-bold pt-1 border-t border-border/50 ${
                netFlow >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              Net Flow: {formatCurrency(netFlow, currencySymbol)}
            </p>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quick Actions */}
        <Card className="p-6 lg:col-span-1 h-fit sticky top-20">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            Quick Actions
          </h2>

          <div className="space-y-3">
            <Button
              onClick={() => openModal("in")}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <ArrowDown className="w-4 h-4 mr-2" />
              Cash In
            </Button>
            <Button
              onClick={() => openModal("out")}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <ArrowUp className="w-4 h-4 mr-2" />
              Cash Out
            </Button>
          </div>

          {/* Filter */}
          <div className="mt-6 pt-6 border-t border-border">
            <label className="block text-xs font-medium text-muted-foreground mb-2">Filter Transactions</label>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </Card>

        {/* Transaction History */}
        <Card className="p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Transaction History
            </h2>
            <Button size="sm" variant="outline" className="bg-transparent">
              <Download className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No transactions for this period</p>
            ) : (
              filteredTransactions.reverse().map((tx) => {
                const isIncoming = tx.type === "sale"
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-3 px-4 hover:bg-muted rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                          isIncoming
                            ? "bg-green-500/10 text-green-600"
                            : "bg-red-500/10 text-red-600"
                        }`}
                      >
                        {isIncoming ? (
                          <ArrowDown className="w-5 h-5" />
                        ) : (
                          <ArrowUp className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground capitalize truncate">
                          {tx.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(tx.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`font-bold text-right whitespace-nowrap ml-2 ${
                        isIncoming ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isIncoming ? "+" : "-"}
                      {formatCurrency(Math.abs(tx.amount), currencySymbol)}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </div>

      {/* Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  {modalType === "in" ? (
                    <>
                      <ArrowDown className="w-5 h-5 text-green-600" />
                      Cash In
                    </>
                  ) : (
                    <>
                      <ArrowUp className="w-5 h-5 text-red-600" />
                      Cash Out
                    </>
                  )}
                </h2>
                <button onClick={closeModal} className="p-1 hover:bg-muted rounded-lg">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    autoFocus
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Purpose</label>
                  <select
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                  >
                    <option value="">Select purpose...</option>
                    {modalType === "in" && (
                      <>
                        <option value="Cash Addition">Cash Addition</option>
                        <option value="Loan">Loan</option>
                        <option value="Refund">Refund</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                    {modalType === "out" && (
                      <>
                        <option value="Expense">Expense</option>
                        <option value="Supplier Payment">Supplier Payment</option>
                        <option value="Withdrawal">Withdrawal</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional details"
                    rows={2}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddTransaction} className="flex-1 bg-primary hover:bg-primary/90">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm
                  </Button>
                  <Button onClick={closeModal} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}