"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const transactions = [
  { id: 1, amount: "$85.50", status: "Completed", time: "2 min ago" },
  { id: 2, amount: "$120.00", status: "Completed", time: "15 min ago" },
  { id: 3, amount: "$45.75", status: "Pending", time: "28 min ago" },
  { id: 4, amount: "$200.00", status: "Completed", time: "1 hour ago" },
  { id: 5, amount: "$62.30", status: "Refunded", time: "2 hours ago" },
]

export function RecentTransactions() {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-foreground mb-4">Recent Transactions</h2>
      <div className="space-y-3">
        {transactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {tx.id}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Transaction #{tx.id}</p>
                <p className="text-xs text-muted-foreground">{tx.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm font-bold text-foreground">{tx.amount}</p>
              <Badge
                variant={tx.status === "Completed" ? "default" : tx.status === "Pending" ? "secondary" : "destructive"}
              >
                {tx.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
