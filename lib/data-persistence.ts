// Types
export interface Product {
  id: string
  name: string
  barcode: string
  quantity: number
  unitType: "stock" | "weight"
  costPrice: number
  salePrice: number
  createdAt: string
}

export interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  isWalkIn?: boolean
  createdAt: string
}

export interface Supplier {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  paymentTerms?: string
  createdAt: string
}

export interface SaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Sale {
  id: string
  customerId: string
  items: SaleItem[]
  subtotal: number
  total: number
  paymentMethod: "cash" | "card"
  amountReceived?: number
  change?: number
  status: "pending" | "completed" | "cancelled"
  createdAt: string
}

export interface CashDrawerTransaction {
  id: string
  type: "opening" | "closing" | "sale" | "expense" | "withdrawal"
  amount: number
  description: string
  createdAt: string
}

export interface BusinessSettings {
  businessName: string
  businessNumber?: string
  phone?: string
  email?: string
  address?: string
  currency: string
  currencySymbol: string
  unitSystem: "stock" | "weight"
  language?: "en" | "ur"
  requireLoginOnStart?: boolean
  featuresEnabled?: {
    reports?: boolean
    reportsSales?: boolean
    reportsCustomers?: boolean
    reportsSuppliers?: boolean
    customers?: boolean
    products?: boolean
    suppliers?: boolean
    receipts?: boolean
    cashDrawer?: boolean
  }
}

export interface PosData {
  version: string
  products: Product[]
  customers: Customer[]
  sales: Sale[]
  suppliers: Supplier[]
  supplies: any[]
  cashDrawerTransactions: CashDrawerTransaction[]
  settings: BusinessSettings
}

// Storage key
const STORAGE_KEY = "pos_data_v1"

// Default data
function getDefaultData(): PosData {
  return {
    version: "1.0.0",
    products: [],
    customers: [
      {
        id: "walk-in",
        name: "Walk-in Customer",
        isWalkIn: true,
        createdAt: new Date().toISOString(),
      },
    ],
    sales: [],
    suppliers: [],
    supplies: [],
    cashDrawerTransactions: [],
    settings: {
      businessName: "BILLGO POS",
      currency: "PKR",
      currencySymbol: "₨",
      unitSystem: "stock",
      language: "en",
      requireLoginOnStart: false,
      featuresEnabled: {
        reports: true,
        reportsSales: true,
        reportsCustomers: true,
        reportsSuppliers: true,
        customers: true,
        products: true,
        suppliers: true,
        receipts: true,
        cashDrawer: true,
      },
    },
  }
}

// Get POS Data
export function getPosData(): PosData {
  try {
    if (typeof window === "undefined") {
      return getDefaultData()
    }

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }

    return getDefaultData()
  } catch (error) {
    console.error("Error reading POS data:", error)
    return getDefaultData()
  }
}

// Save POS Data
export function savePosData(data: PosData): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  } catch (error) {
    console.error("Error saving POS data:", error)
    throw new Error("Failed to save data")
  }
}

// Get Backup Data
export function getBackupData(): string {
  try {
    const data = getPosData()
    return JSON.stringify(data, null, 2)
  } catch (error) {
    console.error("Error creating backup:", error)
    throw new Error("Failed to create backup")
  }
}

// Restore from Backup
export function restoreFromBackup(backupJson: string): void {
  try {
    const data = JSON.parse(backupJson) as PosData

    // Validate structure
    if (!data.version || !data.products || !data.customers || !data.sales) {
      throw new Error("Invalid backup file structure")
    }

    savePosData(data)
  } catch (error) {
    console.error("Error restoring backup:", error)
    throw new Error("Failed to restore backup")
  }
}

// Clear All Data
export function clearAllData(): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem("auth_user")
      localStorage.removeItem("adminPassword")
    }
  } catch (error) {
    console.error("Error clearing data:", error)
    throw new Error("Failed to clear data")
  }
}

// Get Currency Symbol
export function getCurrencySymbol(currency?: string): string {
  const currencyMap: Record<string, string> = {
    PKR: "₨",
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
  }

  if (currency) {
    return currencyMap[currency] || "₨"
  }

  try {
    const data = getPosData()
    return currencyMap[data.settings.currency] || "₨"
  } catch {
    return "₨"
  }
}

// Export types for backup (PosData is exported above via interface declaration)