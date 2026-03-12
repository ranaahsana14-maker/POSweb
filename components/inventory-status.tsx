"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const items = [
  { name: "Coffee Beans", stock: 45, status: "Good" },
  { name: "Milk", stock: 8, status: "Low" },
  { name: "Sugar", stock: 2, status: "Critical" },
  { name: "Cups", stock: 150, status: "Good" },
]

export function InventoryStatus() {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-foreground mb-4">Inventory Status</h2>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div>
              <p className="text-sm font-medium text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.stock} units</p>
            </div>
            <Badge variant={item.status === "Good" ? "default" : item.status === "Low" ? "secondary" : "destructive"}>
              {item.status}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}
