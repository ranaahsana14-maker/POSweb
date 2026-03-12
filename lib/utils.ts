import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Combine classNames - merges Tailwind classes intelligently
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// Format currency with symbol
export const formatCurrency = (amount: number, symbol: string = "₨"): string => {
  return `${symbol}${amount.toFixed(2)}`
}

// Format date
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString()
}

// Format date and time
export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString()
}

// Format time only
export const formatTime = (date: string | Date): string => {
  return new Date(date).toLocaleTimeString()
}

// Calculate profit
export const calculateProfit = (salePrice: number, costPrice: number): number => {
  return salePrice - costPrice
}

// Calculate profit margin percentage
export const calculateProfitMargin = (salePrice: number, costPrice: number): number => {
  if (costPrice === 0) return 0
  return ((salePrice - costPrice) / salePrice) * 100
}

// Truncate text with ellipsis
export const truncateText = (text: string, length: number): string => {
  return text.length > length ? text.substring(0, length) + "..." : text
}

// Validate email format
export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// Validate phone number (minimum 10 digits)
export const validatePhone = (phone: string): boolean => {
  const digitsOnly = phone.replace(/\D/g, "")
  return digitsOnly.length >= 10
}

// Debounce function for throttled execution
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Format large numbers with commas
export const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

// Get initials from name
export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// Check if value is empty
export const isEmpty = (value: any): boolean => {
  return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)
}

// Convert to title case
export const toTitleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}

// Calculate days between two dates
export const daysBetween = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay))
}

// Format percentage
export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${value.toFixed(decimals)}%`
}