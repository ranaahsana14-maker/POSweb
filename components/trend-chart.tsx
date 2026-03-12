"use client"

import { Card } from "@/components/ui/card"

export function TrendChart() {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-foreground mb-4">Sales Trend</h2>
      <div className="h-64 bg-gradient-to-b from-primary/5 to-secondary/5 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Sales trend chart will display here</p>
          <p className="text-xs text-muted-foreground mt-2">Week view • Daily breakdown</p>
        </div>
      </div>
    </Card>
  )
}
