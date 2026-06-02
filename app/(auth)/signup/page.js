"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

const ACCESS_CODE = "SMART@2007"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [accessCode, setAccessCode] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

  const domain = email.split("@")[1]
    if (domain !== "smart.sa") {
      setError("Domain must be @smart.sa")
      return
    }

    if (accessCode !== ACCESS_CODE) {
      setError("Invalid access code")
      return
    }

    

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)

const checkRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reset-password?email=${email}`)
const checkData = await checkRes.json()

    if (checkData.exists) {
      setError("This email is already registered")
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name }
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-full max-w-md px-8 py-10 rounded-2xl shadow-lg border border-gray-100 text-center">
<div className="flex flex-col items-center mb-6">
  <img src="https://smart.sa/wp-content/themes/smart/images/logo.svg" alt="SMART" className="h-10" />
  <p className="mt-1 text-gray-900 tracking-widest" style={{ fontSize: "11px" }}>Cold Call Track</p>
</div>          <div className="text-4xl mb-4">✉️</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h2>
          <p className="text-sm text-gray-500 mb-1">A confirmation link has been sent to:</p>
          <p className="text-sm font-semibold text-gray-800 mb-4">{email}</p>
          <p className="text-xs text-gray-400 mb-6">Please open the link in your email to verify your account, then login.</p>
          <p className="text-xs text-gray-400">Can't find it? Check your <span className="font-semibold">Junk / Spam</span> folder.</p>
          <a href="/login" className="mt-6 block w-full py-3 rounded-xl text-white font-bold text-sm transition bg-red-700 hover:bg-red-800 text-center">
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md px-8 py-10 rounded-2xl shadow-lg border border-gray-100">
        
        <div className="text-center mb-8">
<div className="flex flex-col items-center mb-6">
  <img src="https://smart.sa/wp-content/themes/smart/images/logo.svg" alt="SMART" className="h-10" />
  <p className="mt-1 text-gray-900 tracking-widest" style={{ fontSize: "11px" }}>Cold Call Track</p>
</div>          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Full Name</label>
            <input
              type="text"
              placeholder="Ahmed Khalid"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl text-gray-900 outline-none text-sm border border-gray-200 focus:border-red-700 focus:ring-1 focus:ring-red-200"
            />
          </div>

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

          <div>
            <label className="block text-xs text-gray-400 mb-1">Password</label>
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
            <label className="block text-xs text-gray-400 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat your password"
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

          <div>
            <label className="block text-xs text-gray-400 mb-1">Access Code</label>
            <input
              type="password"
              placeholder="Enter access code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl text-gray-900 outline-none text-sm border border-gray-200 focus:border-red-700 focus:ring-1 focus:ring-red-200"
            />
          </div>

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-white font-bold text-sm transition bg-red-700 hover:bg-red-800">
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-center text-xs text-gray-400">
            Already have an account?{" "}
            <a href="/login" className="text-red-700 hover:underline">Login</a>
          </p>
        </form>
      </div>
    </div>
  )
}