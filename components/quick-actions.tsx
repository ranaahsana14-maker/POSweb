"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, BarChart3, DollarSign, Package } from "lucide-react"

export function QuickActions() {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-foreground mb-4">Quick Actions</h2>
      <div className="space-y-2">
        <Link href="/cash-drawer">
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <DollarSign className="w-4 h-4 mr-2" />
            Open Cash Drawer
          </Button>
        </Link>
        <Link href="/products">
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </Link>
        <Link href="/reports">
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <BarChart3 className="w-4 h-4 mr-2" />
            View Reports
          </Button>
        </Link>
        <Link href="/suppliers">
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <Package className="w-4 h-4 mr-2" />
            Manage Suppliers
          </Button>
        </Link>
      </div>
    </Card>
  )
}
