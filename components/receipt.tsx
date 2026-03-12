"use client"

import { type Sale } from "@/lib/data-persistence"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { getPosData } from "@/lib/data-persistence"

interface ReceiptProps {
  sale: Sale
}

export function Receipt({ sale }: ReceiptProps) {
  const data = getPosData()
  const customer = data.customers.find((c) => c.id === sale.customerId)
  const currencySymbol = data.settings.currencySymbol

  return (
    <div className="space-y-4 text-sm">
      {/* Receipt Header */}
      <div className="text-center border-b border-border pb-3">
        <p className="text-lg font-bold text-foreground">{data.settings.businessName}</p>
        {data.settings.address && <p className="text-xs text-muted-foreground mt-1">{data.settings.address}</p>}
        {data.settings.phone && <p className="text-xs text-muted-foreground">{data.settings.phone}</p>}
      </div>

      {/* Receipt Details */}
      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>
          <span className="font-semibold">Receipt #</span> {sale.id}
        </p>
        <p>{formatDateTime(sale.createdAt)}</p>
      </div>

      {/* Customer Info */}
      {customer && !customer.isWalkIn && (
        <div className="text-center text-xs border-b border-border pb-3">
          <p>
            <span className="font-semibold">Customer:</span> {customer.name}
          </p>
          {customer.phone && <p>{customer.phone}</p>}
        </div>
      )}

      {/* Items */}
      <div className="border-b border-border pb-3">
        <div className="space-y-2">
          {sale.items.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-start">
                <p className="font-medium text-foreground flex-1">{item.productName}</p>
                <p className="font-semibold text-primary text-right ml-2">
                  {formatCurrency(item.total, currencySymbol)}
                </p>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <p>
                  Qty: <span className="font-mono">{item.quantity}</span>
                </p>
                <p>
                  @ {formatCurrency(item.unitPrice, currencySymbol)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="space-y-2 border-b border-border pb-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal:</span>
          <span className="font-semibold text-foreground">{formatCurrency(sale.subtotal, currencySymbol)}</span>
        </div>
        <div className="flex justify-between text-base font-bold bg-primary/10 p-2 rounded">
          <span className="text-foreground">TOTAL:</span>
          <span className="text-primary">{formatCurrency(sale.total, currencySymbol)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Payment Method:</span>
          <span className="font-semibold text-foreground capitalize">{sale.paymentMethod}</span>
        </div>
        {sale.amountReceived !== undefined && (
          <>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Received:</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(sale.amountReceived, currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Change:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(sale.change || 0, currencySymbol)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pt-3 border-t border-border">
        <p className="font-semibold">Thank you for your purchase!</p>
        <p className="mt-1">Visit us again soon</p>
      </div>
    </div>
  )
}