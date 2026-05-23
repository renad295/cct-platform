"use client"
import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { LogOut, Plus, Edit, Users, X, Upload, Clock, Save, Eye, Mail, Bell, CalendarPlus, TrendingUp } from "lucide-react"

export default function Dashboard() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [filter, setFilter] = useState("All")
  const [userFilter, setUserFilter] = useState("All")
  const [searchUser, setSearchUser] = useState("")
  const [assignedFilter, setAssignedFilter] = useState("All")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedClient, setSelectedClient] = useState(null)
  const [editedClient, setEditedClient] = useState(null)
  const [viewClient, setViewClient] = useState(null)
  const [history, setHistory] = useState([])
  const [files, setFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [showConfirmClose, setShowConfirmClose] = useState(false)
  const [users, setUsers] = useState([])
  const [tasks, setTasks] = useState([])
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [newTask, setNewTask] = useState({ title: "", scheduled_at: "" })
  const [openedFromNotif, setOpenedFromNotif] = useState(false)
  const router = useRouter()
  const notifRef = useRef(null)
const [sidebarOpen, setSidebarOpen] = useState(false) // أضفه هنا

  useEffect(() => {
    checkUser()
    fetchClients()
    fetchUsersData()
  }, [])

  useEffect(() => {
    if (user) {
      fetchNotifications()
      const interval = setInterval(checkDueTasks, 60000)
      return () => clearInterval(interval)
    }
  }, [user])

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/login")
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push("/login")
    else setUser(user)
  }

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  const fetchUsersData = async () => {
    const res = await fetch("/api/invite")
    const data = await res.json()
    setUsers(data.users || [])
  }

  const fetchHistory = async (clientId) => {
    const { data } = await supabase.from("client_history").select("*").eq("client_id", clientId).order("created_at", { ascending: false })
    setHistory(data || [])
  }

  const fetchFiles = async (clientId) => {
    const { data } = await supabase.from("client_files").select("*").eq("client_id", clientId).order("uploaded_at", { ascending: false })
    setFiles(data || [])
  }

  const fetchTasks = async (clientId) => {
    const { data } = await supabase.from("tasks").select("*").eq("client_id", clientId).order("scheduled_at", { ascending: true })
    setTasks(data || [])
  }

  const fetchNotifications = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data } = await supabase.from("notifications")
    .select("*")
    .eq("user_email", user.email)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
  setNotifications(data || [])
}
const sendEmailNotification = async (to, subject, message) => {
  await fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, message }),
  })
}

  const checkDueTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const now = new Date().toISOString()
    const { data } = await supabase.from("tasks").select("*, clients(client_name)").eq("assigned_to_email", user.email).eq("is_done", false).lte("scheduled_at", now)
    if (data && data.length > 0) {
      for (const task of data) {
        await supabase.from("notifications").insert([{
          user_email: user.email,
          message: `Task due: "${task.title}" for ${task.clients?.client_name}`,
          client_id: task.client_id,
        }])
        await supabase.from("tasks").update({ is_done: true }).eq("id", task.id)
      }
      fetchNotifications()
    }
  }

const markNotificationRead = async (notif) => {
  await supabase.from("notifications").update({ is_opened: true }).eq("id", notif.id)
  fetchNotifications()
  setShowNotifications(false)
  const client = clients.find(c => c.id === notif.client_id)
  if (client) openEdit(client, true)
}

  const markAllRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("user_email", user.email).eq("is_read", false)
    fetchNotifications()
  }

  const openEdit = async (client, fromNotif = false) => {
    setSelectedClient(client)
    setEditedClient({ ...client })
    setIsDirty(false)
    setOpenedFromNotif(fromNotif)
    await fetchHistory(client.id)
    await fetchFiles(client.id)
    await fetchTasks(client.id)
  }

  const handleConfirm = async () => {
    const userName = user?.email?.split("@")[0]

    await supabase.from("clients").update({
      is_confirmed: true,
      confirmed_by: userName,
      confirmed_at: new Date().toISOString(),
    }).eq("id", editedClient.id)

    const { data: historyData } = await supabase
      .from("client_history")
      .select("changed_by_email")
      .eq("client_id", editedClient.id)
      .ilike("action", "%assigned to%")
      .order("created_at", { ascending: false })
      .limit(1)

    const adminEmail = historyData?.[0]?.changed_by_email || null

    if (adminEmail && adminEmail !== user?.email) {
      await supabase.from("notifications").insert([{
        user_email: adminEmail,
        message: `✅ ${userName} confirmed client: ${editedClient.client_name}`,
        client_id: editedClient.id,
        type: "confirmation",
      }])
    }

    await supabase.from("client_history").insert([{
      client_id: editedClient.id,
      action: `Client confirmed by ${userName}`,
      changed_by: userName,
      changed_by_email: user?.email,
    }])

    await fetchClients()
    setSelectedClient(null)
    setEditedClient(null)
    setOpenedFromNotif(false)
  }

  const openView = async (client) => {
    setViewClient(client)
    await fetchHistory(client.id)
    await fetchFiles(client.id)
  }

  const handleChange = (e) => {
    setEditedClient({ ...editedClient, [e.target.name]: e.target.value })
    setIsDirty(true)
  }

  const handleClose = () => {
    if (isDirty) setShowConfirmClose(true)
    else { setSelectedClient(null); setEditedClient(null); setOpenedFromNotif(false) }
  }

  const handleSave = () => confirmSave()

  const confirmSave = async () => {
    setSaving(true)
    const userName = user?.email?.split("@")[0]

    const changes = []
    if (editedClient.client_name !== selectedClient.client_name) changes.push("name")
    if ((editedClient.job_title || "") !== (selectedClient.job_title || "")) changes.push("job title")
    if (editedClient.company_name !== selectedClient.company_name) changes.push("company")
    if ((editedClient.client_phone || "") !== (selectedClient.client_phone || "")) changes.push("phone")
    if ((editedClient.client_email || "") !== (selectedClient.client_email || "")) changes.push("email")
    if (editedClient.status !== selectedClient.status) changes.push(`status → ${editedClient.status}`)
    if ((editedClient.assigned_to_email || "") !== (selectedClient.assigned_to_email || "")) changes.push("assigned to")

    const oldNotes = selectedClient.notes || ""
    const newNotes = editedClient.notes || ""
    if (oldNotes !== newNotes) changes.push("notes")

    const action = changes.length > 0 ? `Updated: ${changes.join(", ")}` : "Updated client info"

    await supabase.from("clients").update({
      ...editedClient,
      updated_by: userName,
      updated_at: new Date().toISOString(),
    }).eq("id", editedClient.id)
const historyEntries = [{ client_id: editedClient.id, action, changed_by: userName, changed_by_email: user?.email }]
    if (oldNotes !== newNotes) {
      historyEntries.push({
        client_id: editedClient.id,
        action: `Notes changed:\nBefore: "${oldNotes || "(empty)"}"\nAfter: "${newNotes || "(empty)"}"`,
        changed_by: userName,
        changed_by_email: user?.email,
      })
    }

    if (editedClient.assigned_to_email && editedClient.assigned_to_email !== selectedClient.assigned_to_email) {
      await supabase.from("notifications").insert([{
        user_email: editedClient.assigned_to_email,
        message: `${userName} assigned you client: ${editedClient.client_name}`,
        client_id: editedClient.id,
      }])
      await sendEmailNotification(
        editedClient.assigned_to_email,
        `New Client Assigned: ${editedClient.client_name}`,
        `Hi ${editedClient.assigned_to},<br/><br/>${userName} assigned you a new client: <strong>${editedClient.client_name}</strong> from ${editedClient.company_name}.<br/><br/>Please login to CCT to view the details.`
      )
    }

    await supabase.from("client_history").insert(historyEntries)
    await fetchClients()
    setIsDirty(false)
    setSaving(false)
    setSelectedClient(null)
    setEditedClient(null)
    setOpenedFromNotif(false)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fileName = `${editedClient.id}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from("files").upload(fileName, file)
    if (!error) {
      const { data: urlData } = supabase.storage.from("files").getPublicUrl(fileName)
      const userName = user?.email?.split("@")[0]
      await supabase.from("client_files").insert([{
        client_id: editedClient.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        uploaded_by: userName,
      }])
      await fetchFiles(editedClient.id)
    }
    setUploading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const addTask = async () => {
    if (!newTask.title || !newTask.scheduled_at) return
    const userName = user?.email?.split("@")[0]
    const assignedUser = users.find(u => u.email === editedClient.assigned_to_email)
    await supabase.from("tasks").insert([{
      client_id: editedClient.id,
      title: newTask.title,
      scheduled_at: newTask.scheduled_at,
      assigned_to: assignedUser?.user_metadata?.full_name || userName,
      assigned_to_email: editedClient.assigned_to_email || user?.email,
      created_by: userName,
    }])
    if (editedClient.assigned_to_email && editedClient.assigned_to_email !== user?.email) {
  await supabase.from("notifications").insert([{
    user_email: editedClient.assigned_to_email,
    message: `${userName} assigned you a task: "${newTask.title}" for ${editedClient.client_name}`,
    client_id: editedClient.id,
  }])
  // إيميل
  await sendEmailNotification(
    editedClient.assigned_to_email,
    `New Task: ${newTask.title}`,
    `Hi ${editedClient.assigned_to},<br/><br/>You have a new task: <strong>${newTask.title}</strong> for client ${editedClient.client_name}.<br/>Scheduled: ${new Date(newTask.scheduled_at).toLocaleString()}<br/><br/>Please login to CCT to view the details.`
  )
}

    setNewTask({ title: "", scheduled_at: "" })
    await fetchTasks(editedClient.id)
  }

  const allUsers = [...new Set(clients.map(c => c.updated_by).filter(Boolean))]
  const allAssigned = [...new Set(clients.map(c => c.assigned_to).filter(Boolean))]

  const filtered = clients.filter(c => {
    const statusMatch = filter === "All" || c.status === filter
    const userMatch = userFilter === "All" || c.updated_by === userFilter
    const assignedMatch = assignedFilter === "All" || c.assigned_to === assignedFilter
    const dateMatch = (() => {
      if (!dateFrom && !dateTo) return true
      const updated = new Date(c.updated_at)
      if (dateFrom && dateTo) return updated >= new Date(dateFrom) && updated <= new Date(dateTo + "T23:59:59")
      if (dateFrom) return updated >= new Date(dateFrom)
      if (dateTo) return updated <= new Date(dateTo + "T23:59:59")
      return true
    })()
    return statusMatch && userMatch && assignedMatch && dateMatch
  })

 const stats = [
  { label: "Total Clients", value: filtered.length, color: "#111" },
  { label: "Meeting Arranged", value: filtered.filter(c => c.status === "Meeting Arranged").length, color: "#0C447C" },
  { label: "Opportunity", value: filtered.filter(c => c.status === "Opportunity").length, color: "#27ae60" },
  { label: "Existing Clients", value: filtered.filter(c => c.status === "Existing Client").length, color: "#7c3aed" },
]

  const statusBadge = (status) => {
    const styles = {
      "New": "bg-gray-100 text-gray-600",
      "Meeting Arranged": "bg-blue-50 text-blue-800",
      "Opportunity": "bg-green-50 text-green-800",
      "No Answer": "bg-amber-50 text-amber-800",
      "Not Interested": "bg-red-50 text-red-700",
      "Existing Client": "bg-purple-50 text-purple-800",
    }
    return styles[status] || "bg-gray-100 text-gray-600"
  }

  const filters = ["All", "New", "Meeting Arranged", "Opportunity", "No Answer", "Not Interested", "Existing Client"]

  return (
    <div className="flex h-screen bg-gray-50">
     {/* Sidebar Toggle Button */}
<button
  onClick={() => setSidebarOpen(!sidebarOpen)}
  className="fixed top-4 left-4 z-50 flex flex-col justify-center gap-1.5 p-2">
  <span className="block h-0.5 w-6 bg-gray-500"></span>
  <span className="block h-0.5 w-4 bg-gray-500"></span>
  <span className="block h-0.5 w-5 bg-gray-500"></span>
</button>

{/* Overlay */}
{sidebarOpen && (
  <div className="fixed inset-0 bg-black/20 z-30" onClick={() => setSidebarOpen(false)} />
)}

{/* Sidebar */}
<div className={`fixed top-0 left-0 h-full w-52 bg-white border-r border-gray-100 flex flex-col z-40 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
  <div className="p-5 border-b border-gray-100 pt-14">
    <img src="https://smart.sa/wp-content/themes/smart/images/logo.svg" alt="SMART" className="h-7 mb-2" />
    <p className="text-xs text-gray-400">Cold Calls Track</p>
  </div>
  <nav className="flex-1 pt-2">
    <div onClick={() => { router.push("/dashboard"); setSidebarOpen(false) }}
      className="flex items-center gap-3 px-5 py-3 text-red-700 bg-red-50 border-r-2 border-red-700 font-medium text-sm cursor-pointer">
      <Users size={16} /> Dashboard
    </div>
    <div onClick={() => { router.push("/dashboard/reports"); setSidebarOpen(false) }}
      className="flex items-center gap-3 px-5 py-3 text-gray-500 hover:text-red-700 hover:bg-red-50 font-medium text-sm cursor-pointer transition">
      <TrendingUp size={16} /> Reports
    </div>
    <div onClick={() => { router.push("/dashboard/invitations"); setSidebarOpen(false) }}
      className="flex items-center gap-3 px-5 py-3 text-gray-500 hover:text-red-700 hover:bg-red-50 font-medium text-sm cursor-pointer transition">
      <Mail size={16} /> Invitations
    </div>
  </nav>
        <div className="p-4 border-t border-gray-100">
          {user && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-red-50 text-red-700 text-xs font-bold flex items-center justify-center">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-800">{user.email?.split("@")[0]}</p>
                <p className="text-xs text-gray-400">Admin</p>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-700 transition">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 flex-1 overflow-y-auto">

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-lg font-semibold text-gray-900"></h1>
            <div className="flex items-center gap-3">
              <div className="relative" ref={notifRef}>
                <button onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-400 hover:text-red-700 transition">
                  <Bell size={20} />
                  {notifications.filter(n => !n.is_opened).length > 0 && (
  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
    {notifications.filter(n => !n.is_opened).length}
  </span>
)}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                      {notifications.length > 0 && (
                        <button onClick={markAllRead} className="text-xs text-red-700 hover:underline">Mark all read</button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-gray-400 p-4 text-center">No new notifications</p>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.map(n => (
                          <div key={n.id} onClick={() => markNotificationRead(n)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50">
<p className={`text-xs ${!n.is_opened ? "font-bold text-gray-900" : "font-normal text-gray-600"}`}>
  {n.message}
</p>                            <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button onClick={() => router.push("/dashboard/add-client")}
                className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                <Plus size={16} /> Add Client
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {stats.map((s, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs border transition ${filter === f ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                {f}
              </button>
            ))}
          </div>

          {/* Advanced Filters */}
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 mb-4 flex items-center gap-3 flex-wrap">
            <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 outline-none focus:border-red-700">
              <option value="All">Updated By</option>
              {allUsers.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <select value={assignedFilter} onChange={(e) => setAssignedFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 outline-none focus:border-red-700">
              <option value="All">Assigned To</option>
              {allAssigned.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 outline-none focus:border-red-700" />
            <span className="text-xs text-gray-400">→</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 outline-none focus:border-red-700" />
            <button onClick={() => { setFilter("All"); setUserFilter("All"); setAssignedFilter("All"); setDateFrom(""); setDateTo("") }}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition">
              Reset
            </button>
            <button onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition">
              🖨️ Print
            </button>
            <p className="text-xs text-gray-400 ml-auto">{filtered.length} clients found</p>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Client</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Job Title</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Company</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Phone</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Assigned To</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Updated by</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">No clients found</td></tr>
                ) : (
                  filtered.map(client => (
                    <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-800">{client.client_name}</td>
                      <td className="px-4 py-3 text-gray-500">{client.job_title || "-"}</td>
                      <td className="px-4 py-3 text-gray-500">{client.company_name}</td>
                      <td className="px-4 py-3 text-gray-500">{client.client_phone}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge(client.status)}`}>
                          {client.status}
                        </span>
                      </td>
<td className="px-4 py-3 text-gray-500 text-xs">
  <div className="flex flex-col gap-0.5">
    <span>{client.assigned_to || "-"}</span>
    {client.assigned_to && (
      client.is_confirmed 
        ? <span className="text-green-600 font-medium">✅ Confirmed</span>
        : <span className="text-amber-500">⬜ Not Confirmed</span>
    )}
  </div>
</td> 
                     <td className="px-4 py-3 text-gray-400 text-xs">{client.updated_by || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button onClick={() => openView(client)} className="text-gray-400 hover:text-blue-600 transition">
                            <Eye size={17} />
                          </button>
                          <button onClick={() => openEdit(client)} className="text-gray-400 hover:text-red-700 transition">
                            <Edit size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {viewClient && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{viewClient.client_name}</h2>
                <p className="text-xs text-gray-400">{viewClient.company_name}</p>
              </div>
              <button onClick={() => setViewClient(null)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={20} />
              </button>
            </div>
            <div className="flex overflow-hidden flex-1">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Client Name", value: viewClient.client_name },
                    { label: "Job Title", value: viewClient.job_title || "-" },
                    { label: "Company", value: viewClient.company_name },
                    { label: "Phone", value: viewClient.client_phone || "-" },
                    { label: "Email", value: viewClient.client_email || "-" },
                    { label: "Status", value: viewClient.status },
                    { label: "Assigned To", value: viewClient.assigned_to || "-" },
                  ].map((f, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">{f.label}</p>
                      <p className="text-sm font-medium text-gray-800">{f.value}</p>
                    </div>
                  ))}
                </div>
                {viewClient.notes && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Notes</p>
                    <p className="text-sm text-gray-800">{viewClient.notes}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Files</h3>
                  {files.length === 0 ? (
                    <p className="text-xs text-gray-400">No files uploaded yet</p>
                  ) : (
                    <div className="space-y-2">
                      {files.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <p className="text-xs font-medium text-gray-800">{file.file_name}</p>
                            <p className="text-xs text-gray-400">by {file.uploaded_by}</p>
                          </div>
                          <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-red-700 hover:underline">View</a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="w-64 border-l border-gray-100 p-5 overflow-y-auto bg-gray-50">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={14} className="text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-900">History</h3>
                </div>
                {history.length === 0 ? (
                  <p className="text-xs text-gray-400">No changes yet</p>
                ) : (
                  <div className="space-y-3">
                    {history.map(h => (
                      <div key={h.id} className="border-l-2 border-red-100 pl-3">
                        <p className="text-xs font-medium text-gray-800 whitespace-pre-line">{h.action}</p>
                        <p className="text-xs text-gray-500">{h.changed_by}</p>
                        <p className="text-xs text-gray-300">{new Date(h.created_at).toLocaleDateString()} {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{editedClient?.client_name}</h2>
                <p className="text-xs text-gray-400">{editedClient?.company_name}</p>
              </div>
              <div className="flex items-center gap-3">
{!editedClient?.is_confirmed && editedClient?.assigned_to_email === user?.email && (                  <button onClick={handleConfirm}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition">
                    ✅ Confirm
                  </button>
                )}
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white text-xs font-medium px-4 py-2 rounded-lg transition">
                  <Save size={13} /> {saving ? "Saving..." : "Save Changes"}
                </button>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex overflow-hidden flex-1">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Client Name</label>
                      <input name="client_name" value={editedClient?.client_name || ""} onChange={handleChange}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-200" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Job Title</label>
                      <input name="job_title" value={editedClient?.job_title || ""} onChange={handleChange}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-200" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Company Name</label>
                      <input name="company_name" value={editedClient?.company_name || ""} onChange={handleChange}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-200" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Phone</label>
                      <input name="client_phone" value={editedClient?.client_phone || ""} onChange={handleChange}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-200" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Email</label>
                      <input name="client_email" value={editedClient?.client_email || ""} onChange={handleChange}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-200" />
                    </div>
<div>
                      <label className="block text-xs text-gray-400 mb-1">Status</label>
                      <select name="status" value={editedClient?.status || "New"} onChange={handleChange}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-200">
                        <option>New</option>
                        <option>Meeting Arranged</option>
                        <option>Opportunity</option>
                        <option>No Answer</option>
                        <option>Not Interested</option>
                        <option>Existing Client</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Industry</label>
                      <select name="industry" value={editedClient?.industry || ""} onChange={handleChange}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-200">
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
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Assign To</label>                    

<select
                      value={editedClient?.assigned_to_email || ""}
                      onChange={(e) => {
                        const selected = users.find(u => u.email === e.target.value)
                        setEditedClient({
                          ...editedClient,
                          assigned_to_email: e.target.value,
                          assigned_to: selected?.user_metadata?.full_name || e.target.value.split("@")[0]
                        })
                        setIsDirty(true)
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-200">
                      <option value="">— Unassigned —</option>
                      {users.map(u => (
                        <option key={u.id} value={u.email}>
                          {u.user_metadata?.full_name || u.email?.split("@")[0]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Notes</label>
                    <textarea name="notes" value={editedClient?.notes || ""} onChange={handleChange} rows={3}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-200 resize-none" />
                  </div>
                </div>

                {/* Tasks */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarPlus size={15} className="text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-900">Tasks</h3>
                  </div>
                  <div className="space-y-2 mb-3">
                    <input placeholder="Task title e.g. Call back" value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-200" />
                    <div className="flex gap-2">
                      <input type="datetime-local" value={newTask.scheduled_at}
                        onChange={(e) => setNewTask({ ...newTask, scheduled_at: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-200" />
                      <button onClick={addTask}
                        className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-medium rounded-xl transition">
                        Add
                      </button>
                    </div>
                  </div>
                  {tasks.length === 0 ? (
                    <p className="text-xs text-gray-400">No tasks yet</p>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <p className="text-xs font-medium text-gray-800">{t.title}</p>
                            <p className="text-xs text-gray-400">{new Date(t.scheduled_at).toLocaleDateString()} {new Date(t.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${t.is_done ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                            {t.is_done ? "Done" : "Pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Files */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Files</h3>
                    <label className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer transition">
                      <Upload size={12} /> {uploading ? "Uploading..." : "Upload PDF"}
                      <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                  {files.length === 0 ? (
                    <p className="text-xs text-gray-400">No files uploaded yet</p>
                  ) : (
                    <div className="space-y-2">
                      {files.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <p className="text-xs font-medium text-gray-800">{file.file_name}</p>
                            <p className="text-xs text-gray-400">by {file.uploaded_by}</p>
                          </div>
                          <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-red-700 hover:underline">View</a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* History */}
              <div className="w-64 border-l border-gray-100 p-5 overflow-y-auto bg-gray-50">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={14} className="text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-900">History</h3>
                </div>
                {history.length === 0 ? (
                  <p className="text-xs text-gray-400">No changes yet</p>
                ) : (
                  <div className="space-y-3">
                    {history.map(h => (
                      <div key={h.id} className="border-l-2 border-red-100 pl-3">
                        <p className="text-xs font-medium text-gray-800 whitespace-pre-line">{h.action}</p>
                        <p className="text-xs text-gray-500">{h.changed_by}</p>
                        <p className="text-xs text-gray-300">{new Date(h.created_at).toLocaleDateString()} {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Close */}
      {showConfirmClose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Unsaved Changes</h3>
            <p className="text-xs text-gray-500 mb-5">You have unsaved changes. What would you like to do?</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowConfirmClose(false); setSelectedClient(null); setEditedClient(null); setIsDirty(false); setOpenedFromNotif(false) }}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition">
                Discard
              </button>
              <button onClick={() => { setShowConfirmClose(false); confirmSave() }}
                className="flex-1 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-sm font-medium transition">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}