"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Eye, EyeOff } from "lucide-react"

export default function ResetPassword() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [ready, setReady] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(hash.replace("#", "?"))
    const accessToken = params.get("access_token")
    const refreshToken = params.get("refresh_token")

    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(() => setReady(true))
    } else {
      setError("Invalid or expired reset link.")
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (!ready && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-sm text-gray-400">Verifying...</p>
      </div>
    )
  }

  if (error && !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md px-8 py-10 rounded-2xl shadow-lg border border-gray-100">

        <div className="text-center mb-8">
          <img src="https://smart.sa/wp-content/themes/smart/images/logo.svg" alt="SMART" className="h-10 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Reset Password</h1>
          <p className="text-sm text-gray-400">Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-10 rounded-xl text-gray-900 outline-none text-sm border border-gray-200 focus:border-red-700 focus:ring-1 focus:ring-red-200"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-10 rounded-xl text-gray-900 outline-none text-sm border border-gray-200 focus:border-red-700 focus:ring-1 focus:ring-red-200"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-white font-bold text-sm transition bg-red-700 hover:bg-red-800">
            {loading ? "Updating..." : "Confirm"}
          </button>
        </form>
      </div>

      {/* Success Modal */}
      {success && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-xl text-center">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Password Changed!</h3>
            <p className="text-xs text-gray-500 mb-5">Your password has been updated successfully
              لا توجع راسي وكل شويا تنسى الباسورد.</p>
            <a href="/login"
              className="block w-full py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-sm font-medium transition text-center">
              Go to Login
            </a>
          </div>
        </div>
      )}
    </div>
  )
}