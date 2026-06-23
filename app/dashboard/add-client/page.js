"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function AddClient() {
  const [form, setForm] = useState({
    client_name: "",
    company_name: "",
    industry: "",
    client_phone: "",
    client_email: "",
    job_title: "",
    source: "Apollo",
    notes: "",
    status: "New",
  })
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push("/login")
      else setUser(user)
    }
    getUser()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const userName = user?.email?.split("@")[0]

    const { error } = await supabase.from("clients").insert([{
      ...form,
      created_by: userName,
      updated_by: userName,
    }])

    if (!error) {
      router.push("/dashboard")
    } else {
      alert("Error adding client")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-10 px-6">
        <div className="flex items-center justify-between mb-6">
  <button
    onClick={() => router.push("/dashboard")}
    className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition"
  >
    <ArrowLeft size={16} /> Back to Dashboard
  </button>
  <div className="flex flex-col items-center">
    <img src="https://smart.sa/wp-content/themes/smart/images/logo.svg" alt="SMART" className="h-7" />
    <p className="mt-1 text-gray-900 tracking-widest" style={{ fontSize: "11px" }}>Cold Call Track</p>
  </div>
</div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h1 className="text-lg font-semibold text-gray-900 mb-6">Add New Client</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Client Name *</label>
              <input
                name="client_name"
                value={form.client_name}
                onChange={handleChange}
                required
                placeholder="Ahmed Khalid"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-200"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Job Title</label>
              <input
                name="job_title"
                value={form.job_title}
                onChange={handleChange}
                placeholder="IT Manager"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-200"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Company Name *</label>
              <input
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
                required
                placeholder="SMART Technology Solutions"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-200"
              />
            </div>
<div>
  <label className="block text-xs text-gray-400 mb-1">Industry</label>
  <select
    name="industry"
    value={form.industry}
    onChange={handleChange}
    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-200">
    <option value="">— Select Industry —</option>
    <option>Technology</option>
    <option>Healthcare</option>
    <option>Finance</option>
    <option>Education</option>
    <option>Real Estate</option>
    <option>Retail</option>
    <option>Manufacturing</option>
    <option>Government</option>
    <option>Other</option>
  </select>
</div>

<div>
  <label className="block text-xs text-gray-400 mb-1">
    Lead Source
  </label>

  <select
    name="source"
    value={form.source}
    onChange={handleChange}
    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-200"
  >
    <option value="Apollo">Apollo</option>
    <option value="Event">Event</option>
    <option value="Other">Other</option>
  </select>
</div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Phone</label>
              <input
                name="client_phone"
                value={form.client_phone}
                onChange={handleChange}
                placeholder="0501234567"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-200"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Email</label>
              <input
                name="client_email"
                value={form.client_email}
                onChange={handleChange}
                placeholder="ahmed@smart.sa"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-200"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Add any notes about the client..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-200 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-700 hover:bg-red-800 text-white font-medium text-sm rounded-xl transition"
            >
              {loading ? "Saving..." : "Add Client"}
            </button>
            <button
  type="button"
  onClick={() => router.push("/dashboard/import")}
  className="w-full py-3 border border-gray-200 text-gray-500 hover:border-red-700 hover:text-red-700 font-medium text-sm rounded-xl transition"
>
  Import from CSV instead
</button>
          </form>
        </div>
      </div>
    </div>
  )
}