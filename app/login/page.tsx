"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { setAuthUser, validateCredentials, getStoredUsername, setStoredUsername } from "@/lib/auth"
import { ShoppingCart, AlertCircle, Loader } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  // Prefill username if remembered
  useEffect(() => {
    try {
      const stored = getStoredUsername()
      if (stored) setUsername(stored)
    } catch (err) {
      // ignore
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Add small delay for UX
      await new Promise((resolve) => setTimeout(resolve, 300))

      if (!username.trim() || !password.trim()) {
        setError("Please enter both username and password")
        setLoading(false)
        return
      }

      if (validateCredentials(username, password)) {
        setAuthUser(username)
        if (rememberMe) {
          try {
            setStoredUsername(username)
          } catch {}
        }
        router.push("/")
      } else {
        setError("Invalid username or password")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-background to-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <div className="p-8">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>

          {/* Branding */}
          <h1 className="text-2xl font-bold text-center text-foreground mb-2">BILLGO</h1>
          <p className="text-center text-sm text-muted-foreground mb-8">Point of Sale Management System</p>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg animate-in">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-foreground">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                disabled={loading}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground disabled:opacity-50"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={loading}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground disabled:opacity-50"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>

            <div className="flex items-center justify-between mt-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4"
                />
                Remember me
              </label>
            </div>
        </div>
      </Card>
    </div>
  )
}