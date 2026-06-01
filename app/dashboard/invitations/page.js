"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { ArrowLeft, UserPlus, Trash2 } from "lucide-react"

export default function Invitations() {
  const [invitations, setInvitations] = useState([])
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState(null)
  const [successMsg, setSuccessMsg] = useState("")
  const [emailError, setEmailError] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(null)

  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push("/login")
      else setUser(user)
    }
    getUser()
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const res = await fetch("/api/invite")
    const data = await res.json()
    setInvitations(data.users || [])
    setLoading(false)
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    setEmailError("")
    setSending(true)

    const res = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()

    if (data.error) {
      if (data.error.includes("already")) {
        setEmailError("This user already exists")
      } else {
        setEmailError(data.error)
      }
    } else {
      setEmail("")
      fetchUsers()
      setSuccessMsg("Invitation sent successfully!")
      setTimeout(() => setSuccessMsg(""), 3000)
    }
    setSending(false)
  }

  const handleDelete = async () => {
    const res = await fetch("/api/invite", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: confirmDelete.id }),
    })
    const data = await res.json()
    if (!data.error) fetchUsers()
    setConfirmDelete(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-10 px-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h1 className="text-lg font-semibold text-gray-900 mb-6">Invite Team Member</h1>

          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Company Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError("") }}
                placeholder="ahmed@smart.sa"
                required
                className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-900 outline-none transition ${emailError ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:border-red-700 focus:ring-red-200"} focus:ring-1`}
              />
              {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
            </div>
            {successMsg && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 text-xs px-4 py-3 rounded-xl">
                ✅ {successMsg}
              </div>
            )}
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white text-sm font-medium px-6 py-3 rounded-xl transition"
            >
              <UserPlus size={16} /> {sending ? "Sending..." : "Send Invitation"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Team Members</h2>

          {loading ? (
            <p className="text-xs text-gray-400">Loading...</p>
          ) : invitations.length === 0 ? (
            <p className="text-xs text-gray-400">No team members yet</p>
          ) : (
            <div className="space-y-3">
              {invitations.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-50 text-red-700 text-xs font-bold flex items-center justify-center">
                      {u.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">{u.user_metadata?.full_name || u.email?.split("@")[0]}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${u.confirmed_at ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                      {u.confirmed_at ? "Active" : "Pending"}
                    </span>
                    {u.email !== user?.email && (
                      <button onClick={() => setConfirmDelete(u)} className="text-gray-300 hover:text-red-600 transition">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Remove Team Member</h3>
            <p className="text-xs text-gray-500 mb-1">Are you sure you want to remove:</p>
            <p className="text-xs font-semibold text-gray-800 mb-5">{confirmDelete.email}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-sm font-medium transition">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}