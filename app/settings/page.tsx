"use client"

import { clearAuthUser } from "@/lib/auth"
import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Save,
  Download,
  Upload,
  Lock,
  AlertTriangle,
  CheckCircle,
  X,
  Building2,
  DollarSign,
  BarChart3,
  Settings,
  Shield,
  Database,
  Info,
  Key,
  Mail,
  Phone,
  MapPin,
  FileText,
  Trash2,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react"
import {
  getPosData,
  savePosData,
  getBackupData,
  restoreFromBackup,
  clearAllData,
  type BusinessSettings,
} from "@/lib/data-persistence"
import { useRouter } from "next/navigation"
import { getStoredPassword, setStoredPassword, validateNewPassword, getStoredUsername, setStoredUsername } from "@/lib/auth"

const APP_VERSION = "1.0.0"
const APP_NAME = "BILLGO POS"
const DEVELOPER = "BILLGO@solutions"

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<BusinessSettings>({
    businessName: "",
    currency: "PKR",
    currencySymbol: "₨",
    unitSystem: "stock",
  })

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [clearConfirmText, setClearConfirmText] = useState("")
  const [loading, setLoading] = useState(true)
  const [backupLoading, setBackupLoading] = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"business" | "settings" | "security" | "about" | "developer">("business")
  const [devKeyInput, setDevKeyInput] = useState("")
  const [devAccess, setDevAccess] = useState(false)
  const [devBackupText, setDevBackupText] = useState("")
  const [storedUsername, setStoredUsernameState] = useState("")

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    try {
      const data = getPosData()
      setSettings(data.settings)
      setStoredUsernameState(getStoredUsername())
      setLoading(false)
    } catch (err) {
      setError("Failed to load settings")
      console.error(err)
      setLoading(false)
    }
  }

      const handleToggleRequireLogin = () => {
        try {
          const data = getPosData()
          data.settings = data.settings || {}
          data.settings.requireLoginOnStart = !data.settings.requireLoginOnStart
          savePosData(data)
          setSettings(data.settings)
          setSuccess(
            `Require login on start ${data.settings.requireLoginOnStart ? "enabled" : "disabled"}`,
          )
          setTimeout(() => setSuccess(""), 1800)
        } catch (err) {
          setError("Failed to update login requirement")
        }
      }

  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }))
    setSaved(false)
  }

  const handleSaveSettings = () => {
    setError("")
    setSuccess("")

    if (!settings.businessName.trim()) {
      setError("Business name is required")
      return
    }

    try {
      const data = getPosData()
      data.settings = settings
      savePosData(data)
      setSaved(true)
      setSuccess("Settings saved successfully!")
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError("Failed to save settings")
      console.error(err)
    }
  }

  const handleBackupData = async () => {
    setBackupLoading(true)
    setError("")
    setSuccess("")

    try {
      const backupData = getBackupData()
      const element = document.createElement("a")
      const file = new Blob([backupData], { type: "application/json" })
      element.href = URL.createObjectURL(file)
      element.download = `pos-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
      URL.revokeObjectURL(element.href)
      setSuccess("Backup downloaded successfully!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Failed to create backup")
      console.error(err)
    } finally {
      setBackupLoading(false)
    }
  }

  const handleRestoreData = () => {
    const confirmed = confirm(
      "WARNING: This will overwrite ALL your existing data with the backup file. This action cannot be undone. Continue?",
    )
    if (!confirmed) return

    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"

    input.onchange = (e: any) => {
      const file = e.target.files?.[0]
      if (!file) return

      setRestoreLoading(true)
      setError("")
      setSuccess("")

      const reader = new FileReader()

      reader.onload = (event: any) => {
        try {
          restoreFromBackup(event.target.result)
          setSuccess("Data restored successfully! Reloading application...")
          setTimeout(() => window.location.reload(), 1500)
        } catch (error) {
          setError("Invalid backup file or restoration failed. Please check the file and try again.")
          console.error(error)
          setRestoreLoading(false)
        }
      }

      reader.onerror = () => {
        setError("Failed to read backup file")
        setRestoreLoading(false)
      }

      reader.readAsText(file)
    }

    input.click()
  }

  const handleChangePassword = () => {
    setError("")

    const validation = validateNewPassword(newPassword)
    if (!validation.valid) {
      setError(validation.error || "Invalid password")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    try {
      setStoredPassword(newPassword)
      setNewPassword("")
      setConfirmPassword("")
      setShowPasswordModal(false)
      setShowPasswords(false)
      setSuccess("Password changed successfully!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Failed to change password")
      console.error(err)
    }
  }

  const handleClearData = () => {
    setError("")

    if (clearConfirmText !== "DELETE") {
      setError("Please type 'DELETE' to confirm data deletion")
      return
    }

    try {
      clearAllData()
      setSuccess("All data cleared. Redirecting to login...")
      setShowClearConfirm(false)
      setClearConfirmText("")
      setTimeout(() => {
        router.push("/login")
      }, 1500)
    } catch (err) {
      setError("Failed to clear data")
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">Configure your POS system and business details</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive animate-in">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {(saved || success) && (
        <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 animate-in">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">Success</p>
            <p className="text-sm">{success || "Settings saved successfully!"}</p>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-border">
        <div className="flex gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("business")}
            className={`pb-3 px-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "business"
                ? "border-b-primary text-primary"
                : "border-b-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Business
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 px-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "settings"
                ? "border-b-primary text-primary"
                : "border-b-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            System
          </button>
          {/* Data tab removed — data management moved to Developer tab */}
          <button
            onClick={() => setActiveTab("security")}
            className={`pb-3 px-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "security"
                ? "border-b-primary text-primary"
                : "border-b-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Security
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`pb-3 px-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "about"
                ? "border-b-primary text-primary"
                : "border-b-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Info className="w-4 h-4 inline mr-2" />
            About
          </button>
          <button
            onClick={() => setActiveTab("developer")}
            className={`pb-3 px-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "developer"
                ? "border-b-primary text-primary"
                : "border-b-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Key className="w-4 h-4 inline mr-2" />
            Developer
          </button>
        </div>
      </div>

      {/* Business Settings Tab */}
      {activeTab === "business" && (
        <div className="space-y-6">
          {/* Business Information */}
          <Card className="p-6 border-l-4 border-l-blue-500">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              Business Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Business Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={settings.businessName}
                  onChange={handleSettingChange}
                  placeholder="Your store name"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">This will appear on receipts and reports</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Business License / ID
                  </label>
                  <input
                    type="text"
                    name="businessNumber"
                    value={settings.businessNumber || ""}
                    onChange={handleSettingChange}
                    placeholder="License or NTN"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={settings.phone || ""}
                    onChange={handleSettingChange}
                    placeholder="+92 300 1234567"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={settings.email || ""}
                  onChange={handleSettingChange}
                  placeholder="store@example.com"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Business Address
                </label>
                <textarea
                  name="address"
                  value={settings.address || ""}
                  onChange={handleSettingChange}
                  placeholder="Full business address"
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button onClick={handleSaveSettings} className="flex-1 bg-primary hover:bg-primary/90">
                  <Save className="w-4 h-4 mr-2" />
                  Save Business Details
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          {/* Currency Settings */}
          <Card className="p-6 border-l-4 border-l-green-500">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Currency Settings
            </h2>

            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground text-lg">Pakistan Rupee</p>
                  <p className="text-sm text-muted-foreground">Currency Code: PKR</p>
                </div>
                <p className="text-4xl font-bold text-primary">₨</p>
              </div>
              <p className="text-xs text-muted-foreground italic">
                This is the default and only supported currency for this system
              </p>
            </div>
          </Card>

          {/* Unit System */}
          <Card className="p-6 border-l-4 border-l-purple-500">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              Unit System
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-3">Default Unit System</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <input
                      type="radio"
                      name="unitSystem"
                      value="stock"
                      checked={settings.unitSystem === "stock"}
                      onChange={handleSettingChange}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-medium text-foreground">Stock Units</p>
                      <p className="text-xs text-muted-foreground">Track products by pieces</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <input
                      type="radio"
                      name="unitSystem"
                      value="weight"
                      checked={settings.unitSystem === "weight"}
                      onChange={handleSettingChange}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-medium text-foreground">Weight</p>
                      <p className="text-xs text-muted-foreground">Track products by kg/g</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-600">
                  <strong>Current Setting:</strong> {settings.unitSystem === "stock" ? "Stock Units" : "Weight"}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  All product quantities will be labeled accordingly throughout the system
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button onClick={handleSaveSettings} className="flex-1 bg-primary hover:bg-primary/90">
                  <Save className="w-4 h-4 mr-2" />
                  Save System Settings
                </Button>
              </div>
            </div>
          </Card>

          {/* Language removed — English only */}
        </div>
      )}

      {/* Data management has been moved into Developer tab (for dev-only access) */}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Password Security */}
          <Card className="p-6 border-l-4 border-l-red-500">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-500" />
              Password Security
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-600">
                <p className="font-medium mb-1">🔒 Password Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-xs mt-2">
                  <li>Minimum 6 characters long</li>
                  <li>Use a combination of numbers and letters</li>
                  <li>Change password regularly for security</li>
                  <li>Do not share your password with anyone</li>
                </ul>
              </div>

              <Button
                onClick={() => setShowPasswordModal(true)}
                variant="outline"
                className="w-full bg-transparent justify-start"
              >
                <Key className="w-4 h-4 mr-2" />
                Change Login Password
              </Button>
            </div>
          </Card>

          {/* Security Information */}
          <Card className="p-6 border-l-4 border-l-blue-500">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Security Information
            </h2>

            <div className="space-y-3">
              <div className="p-4 bg-muted/50 rounded-lg border border-muted">
                <p className="text-sm font-medium text-foreground mb-2">✓ Local Data Storage</p>
                <p className="text-xs text-muted-foreground">
                  All your business data is stored locally on your device. No data is sent to external servers.
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg border border-muted">
                <p className="text-sm font-medium text-foreground mb-2">✓ Data Encryption</p>
                <p className="text-xs text-muted-foreground">
                  Use browser's built-in security features to protect your data. Enable HTTPS when possible.
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg border border-muted">
                <p className="text-sm font-medium text-foreground mb-2">✓ Regular Backups</p>
                <p className="text-xs text-muted-foreground">
                  Create regular backups of your data to prevent loss. Store backups in a secure location.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* About Tab */}
      {activeTab === "about" && (
        <div className="space-y-6">
          {/* System Information */}
          <Card className="p-6 border-l-4 border-l-blue-500">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" />
              System Information
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-muted">
                <span className="text-sm text-muted-foreground">Application Name</span>
                <span className="font-semibold text-foreground">{APP_NAME}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-muted">
                <span className="text-sm text-muted-foreground">Version</span>
                <span className="font-semibold text-foreground">v{APP_VERSION}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-muted">
                <span className="text-sm text-muted-foreground">Developer</span>
                <span className="font-semibold text-blue-600">{DEVELOPER}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-muted">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="font-semibold text-foreground">{new Date().toLocaleDateString()}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-muted">
                <span className="text-sm text-muted-foreground">Platform</span>
                <span className="font-semibold text-foreground">Web-based POS System</span>
              </div>
            </div>
          </Card>

          {/* Features */}
          <Card className="p-6 border-l-4 border-l-green-500">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Features
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">Sales & POS</span>
              </div>
              <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">Inventory Management</span>
              </div>
              <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">Customer Database</span>
              </div>
              <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">Cash Drawer Management</span>
              </div>
              <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">Reports & Analytics</span>
              </div>
              <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">Supplier Management</span>
              </div>
              <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">Receipt Printing</span>
              </div>
              <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">Data Backup & Restore</span>
              </div>
            </div>
          </Card>

          {/* Support & Help */}
          <Card className="p-6 border-l-4 border-l-purple-500">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" />
              Support & Help
            </h2>

            <div className="space-y-3">
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <p className="text-sm font-medium text-purple-600 mb-2">📞 Technical Support</p>
                <p className="text-xs text-purple-600">
                  For technical issues or questions, please contact: <strong>{DEVELOPER}</strong>
                </p>
              </div>

              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <p className="text-sm font-medium text-purple-600 mb-2">💡 Tips for Best Results</p>
                <ul className="text-xs text-purple-600 list-disc list-inside space-y-1">
                  <li>Regularly backup your data</li>
                  <li>Keep your device secure</li>
                  <li>Use strong passwords</li>
                  <li>Clear browser cache periodically</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Footer Note */}
          <Card className="p-6 text-center bg-muted/30 border-muted">
            <p className="text-sm text-muted-foreground mb-2">Thank you for using BILLGO POS System</p>
            <p className="text-xs text-muted-foreground">© 2024 BILLGO@solutions. All rights reserved.</p>
          </Card>
        </div>
      )}

      {/* Password Change Modal */}
      {/* Developer Tab */}
      {activeTab === "developer" && (
        <div className="space-y-6">
          {!devAccess ? (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-foreground" />
                Developer Access
              </h2>

              <p className="text-sm text-muted-foreground mb-3">Enter developer key to access advanced tools.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="password"
                  value={devKeyInput}
                  onChange={(e) => setDevKeyInput(e.target.value)}
                  placeholder="Enter developer key"
                  className="col-span-2 px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                />
                <Button
                  onClick={() => {
                    setError("")
                    if (devKeyInput.trim() === "2525") {
                      setDevAccess(true)
                      setSuccess("Developer access granted")
                      setTimeout(() => setSuccess(""), 2500)
                      try {
                        setDevBackupText(getBackupData())
                        setStoredUsernameState(getStoredUsername())
                      } catch (err) {
                        console.error(err)
                      }
                    } else {
                      setError("Invalid developer key")
                    }
                    setDevKeyInput("")
                  }}
                  className="w-full col-span-1 bg-primary hover:bg-primary/90"
                >
                  Unlock
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-3">Backup / All Data</h3>
                <div className="space-y-2">
                  <textarea
                    value={devBackupText}
                    onChange={(e) => setDevBackupText(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground font-mono text-xs"
                  />

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        try {
                          const txt = getBackupData()
                          setDevBackupText(txt)
                          setSuccess("Backup loaded")
                          setTimeout(() => setSuccess(""), 2000)
                        } catch (err) {
                          setError("Failed to load backup data")
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Load Current
                    </Button>

                    <Button
                      onClick={() => {
                        const input = document.createElement("input")
                        input.type = "file"
                        input.accept = ".json"
                        input.onchange = (e: any) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setError("")
                          setSuccess("")
                          const reader = new FileReader()
                          reader.onload = (event: any) => {
                            try {
                              restoreFromBackup(event.target.result)
                              setDevBackupText(event.target.result)
                              setSuccess("Backup file loaded and data restored successfully!")
                              setTimeout(() => setSuccess(""), 3000)
                            } catch (error) {
                              setError("Invalid backup file or restoration failed")
                              console.error(error)
                            }
                          }
                          reader.onerror = () => {
                            setError("Failed to read backup file")
                          }
                          reader.readAsText(file)
                        }
                        input.click()
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Upload & Load
                    </Button>

                    <Button
                      onClick={() => {
                        try {
                          const blob = new Blob([devBackupText || getBackupData()], { type: "application/json" })
                          const el = document.createElement("a")
                          el.href = URL.createObjectURL(blob)
                          el.download = `pos-backup-${new Date().toISOString().split("T")[0]}.json`
                          document.body.appendChild(el)
                          el.click()
                          document.body.removeChild(el)
                          URL.revokeObjectURL(el.href)
                          setSuccess("Backup downloaded")
                          setTimeout(() => setSuccess(""), 2000)
                        } catch (err) {
                          setError("Failed to download backup")
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Download
                    </Button>

                    <Button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(devBackupText || getBackupData())
                          setSuccess("Backup copied to clipboard")
                          setTimeout(() => setSuccess(""), 2000)
                        } catch (err) {
                          setError("Failed to copy backup to clipboard")
                        }
                      }}
                      variant="outline"
                      className="bg-transparent"
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-3">Developer Tools</h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Login Username</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={storedUsername}
                        onChange={(e) => setStoredUsernameState(e.target.value)}
                        className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                      />
                      <Button
                        onClick={() => {
                          try {
                            setStoredUsername(storedUsername || "admin")
                            setSuccess("Login username updated")
                            setTimeout(() => setSuccess(""), 2000)
                          } catch (err) {
                            setError("Failed to update username")
                          }
                        }}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Save
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">This username will be used to validate login credentials.</p>
                  </div>

                  <div>
                    <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.requireLoginOnStart === true}
                        onChange={() => {
                          try {
                            const data = getPosData()
                            data.settings = data.settings || {}
                            data.settings.requireLoginOnStart = !data.settings.requireLoginOnStart
                            savePosData(data)
                            setSettings(data.settings)
                            setSuccess(`Require login on start ${data.settings.requireLoginOnStart ? "enabled" : "disabled"}`)
                            setTimeout(() => setSuccess(""), 1800)
                          } catch (err) {
                            setError("Failed to update login requirement")
                          }
                        }}
                      />
                      <div>
                        <div className="font-medium text-foreground">Require Login on App Start</div>
                        <div className="text-xs text-muted-foreground">Force users to login every time the app opens</div>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Feature Toggles</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        ["reports", "All Reports"],
                        ["reportsSales", "Sales Report"],
                        ["reportsCustomers", "Customer Report"],
                        ["reportsSuppliers", "Supplier Report"],
                        ["customers", "Customer Module"],
                        ["products", "Products Module"],
                        ["suppliers", "Suppliers Module"],
                        ["receipts", "Receipt Printing"],
                        ["cashDrawer", "Cash Drawer"],
                      ].map((f: any) => {
                        const key = f[0]
                        const label = f[1]
                        // @ts-ignore
                        const enabled = settings.featuresEnabled ? settings.featuresEnabled[key] !== false : true
                        return (
                          <label key={key} className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer">
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={() => {
                                try {
                                  const data = getPosData()
                                  data.settings = data.settings || {}
                                  data.settings.featuresEnabled = data.settings.featuresEnabled || {}
                                  // @ts-ignore
                                  data.settings.featuresEnabled[key] = !enabled
                                  savePosData(data)
                                  setSettings(data.settings)
                                  setSuccess(`${label} toggled`)
                                  setTimeout(() => setSuccess(""), 1500)
                                } catch (err) {
                                  setError("Failed to toggle feature")
                                }
                              }}
                            />
                            <div>
                              <div className="font-medium text-foreground">{label}</div>
                              <div className="text-xs text-muted-foreground">{enabled ? "Enabled" : "Disabled"}</div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowClearConfirm(true)}
                      variant="destructive"
                      className="bg-destructive text-white flex-1"
                    >
                      Clear All Data
                    </Button>
                    <Button
                      onClick={() => {
                        setDevAccess(false)
                        setSuccess("Developer access locked")
                        setTimeout(() => setSuccess(""), 1500)
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Lock
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Change Password
                </h2>
                <button
                  onClick={() => {
                    setShowPasswordModal(false)
                    setError("")
                    setNewPassword("")
                    setConfirmPassword("")
                    setShowPasswords(false)
                  }}
                  className="p-1 hover:bg-muted rounded-lg"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-600">
                  <p className="font-medium mb-1">🔐 Password Tips:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Use at least 6 characters</li>
                    <li>Mix letters and numbers</li>
                    <li>Avoid common words</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleChangePassword} className="flex-1 bg-primary hover:bg-primary/90">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Update Password
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPasswordModal(false)
                      setError("")
                      setNewPassword("")
                      setConfirmPassword("")
                      setShowPasswords(false)
                    }}
                    variant="outline"
                    className="flex-1 bg-transparent"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
      {/* Clear Confirmation Modal (used by Developer tools) */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Clear All Data
                </h2>
                <button
                  onClick={() => {
                    setShowClearConfirm(false)
                    setClearConfirmText("")
                  }}
                  className="p-1 hover:bg-muted rounded-lg"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive font-medium">⚠️ This action cannot be undone!</p>
                  <p className="text-xs text-destructive mt-2">
                    All your business data including customers, products, sales, and transactions will be permanently
                    deleted.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Type "DELETE" to confirm:</label>
                  <input
                    type="text"
                    value={clearConfirmText}
                    onChange={(e) => setClearConfirmText(e.target.value)}
                    placeholder="Type DELETE..."
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-destructive"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleClearData}
                    disabled={clearConfirmText !== "DELETE"}
                    className="flex-1 bg-destructive hover:bg-destructive/90 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Data
                  </Button>
                  <Button
                    onClick={() => {
                      setShowClearConfirm(false)
                      setClearConfirmText("")
                    }}
                    variant="outline"
                    className="flex-1 bg-transparent"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}