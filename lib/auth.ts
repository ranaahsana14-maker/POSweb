const AUTH_USER_KEY = "auth_user"
const STORED_USERNAME_KEY = "adminUsername"
const DEFAULT_PASSWORD = "admin.123"
const DEFAULT_USERNAME = "admin"

export function getAuthUser(): string | null {
  try {
    return localStorage.getItem(AUTH_USER_KEY)
  } catch {
    return null
  }
}

export function setAuthUser(username: string): void {
  localStorage.setItem(AUTH_USER_KEY, username)
}

export function clearAuthUser(): void {
  localStorage.removeItem(AUTH_USER_KEY)
}

export function validateCredentials(username: string, password: string): boolean {
  // Compare against stored username and stored password
  try {
    const storedUsername = getStoredUsername()
    const storedPassword = getStoredPassword()
    return username === storedUsername && password === storedPassword
  } catch {
    return username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD
  }
}

export function getStoredUsername(): string {
  return localStorage.getItem(STORED_USERNAME_KEY) || DEFAULT_USERNAME
}

export function setStoredUsername(username: string): void {
  localStorage.setItem(STORED_USERNAME_KEY, username)
}

export function getStoredPassword(): string {
  return localStorage.getItem("adminPassword") || DEFAULT_PASSWORD
}

export function setStoredPassword(password: string): void {
  localStorage.setItem("adminPassword", password)
}

export function validateNewPassword(password: string): {
  valid: boolean
  error?: string
} {
  if (!password) {
    return { valid: false, error: "Password is required" }
  }
  if (password.length < 6) {
    return { valid: false, error: "Password must be at least 6 characters" }
  }
  return { valid: true }
}