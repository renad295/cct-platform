"use client"
import { useState } from "react"
import { ArrowLeft } from "lucide-react"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()

    if (data.error) {
      setError(data.error)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md px-8 py-10 rounded-2xl shadow-lg border border-gray-100">
        
        <div className="text-center mb-8">
  <div className="flex flex-col items-center mb-6">
    <img src="https://smart.sa/wp-content/themes/smart/images/logo.svg" alt="SMART" className="h-10" />
    <p className="mt-1 text-gray-900 tracking-widest" style={{ fontSize: "11px" }}>Cold Call Track</p>
  </div>
  <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot Password</h1>
  <p className="text-sm text-gray-400">Enter your email to receive a reset link</p>
</div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="bg-green-50 text-green-700 text-sm px-4 py-4 rounded-xl text-left space-y-2">
              <p>✅ A reset link has been sent to:</p>
              <p className="font-semibold">{email}</p>
              <p className="text-xs text-green-600">If you don't find the email, please check your <span className="font-semibold">Junk / Spam</span> folder.</p>
            </div>
            <a href="/login" className="flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-700 transition">
              <ArrowLeft size={14} /> Back to Login
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Email</label>
              <input
                type="email"
                placeholder="ahmed@smart.sa"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-gray-900 outline-none text-sm border border-gray-200 focus:border-red-700 focus:ring-1 focus:ring-red-200"
              />
            </div>

            {error && <p className="text-red-500 text-xs text-center">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-sm transition bg-red-700 hover:bg-red-800">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <a href="/login" className="flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-700 transition">
              <ArrowLeft size={14} /> Back to Login
            </a>
          </form>
        )}
      </div>
    </div>
  )
}