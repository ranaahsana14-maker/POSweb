"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getAuthUser, clearAuthUser } from "@/lib/auth"
import { getPosData } from "@/lib/data-persistence"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const user = getAuthUser()
      const data = getPosData()
      const requireLogin = data?.settings?.requireLoginOnStart === true

      if (requireLogin) {
        // enforce login on every start — clear any existing auth
        try {
          clearAuthUser()
        } catch {}
      }
      const isLoginPage = pathname === "/login"
      const currentUser = getAuthUser()

      if (!currentUser && !isLoginPage) {
        router.push("/login")
        setIsAuthorized(false)
      } else if (user && isLoginPage) {
        router.push("/")
        setIsAuthorized(false)
      } else {
        setIsAuthorized(true)
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [pathname, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized && pathname !== "/login") {
    return null
  }

  return <>{children}</>
}