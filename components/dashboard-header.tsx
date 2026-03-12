"use client"

import { Button } from "@/components/ui/button"
import { Search, Bell, User } from "lucide-react"

export function DashboardHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your business overview.</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center bg-muted rounded-lg pl-4">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search..." className="bg-transparent px-4 py-2 text-sm outline-none" />
        </div>
        <Button variant="ghost" size="icon">
          <Bell className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <User className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
