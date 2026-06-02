"use client"
import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import Sidebar from "./components/Sidebar"
import StatsCards from "./components/StatsCards"
import Filters from "./components/Filters"
import ClientTable from "./components/ClientTable"
import Notifications from "./components/Notifications"
import ViewModal from "./components/ViewModal"
import EditModal from "./components/EditModal"

export default function Dashboard() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [filter, setFilter] = useState("All")
  const [userFilter, setUserFilter] = useState("All")
  const [assignedFilter, setAssignedFilter] = useState("All")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [search, setSearch] = useState("")
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const notifRef = useRef(null)

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
      if (event === "SIGNED_OUT" || !session) router.push("/login")
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
    const { data } = await supabase.from("notifications").select("*").eq("user_email", user.email).eq("is_read", false).order("created_at", { ascending: false })
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

  const handleConfirm = async () => {
    const userName = user?.email?.split("@")[0]
    await supabase.from("clients").update({
      is_confirmed: true,
      confirmed_by: userName,
      confirmed_at: new Date().toISOString(),
    }).eq("id", editedClient.id)

    const { data: historyData } = await supabase.from("client_history").select("changed_by_email").eq("client_id", editedClient.id).ilike("action", "%assigned to%").order("created_at", { ascending: false }).limit(1)
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
    const searchMatch = search === "" ||
      c.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.client_phone?.includes(search)
    const dateMatch = (() => {
      if (!dateFrom && !dateTo) return true
      const updated = new Date(c.updated_at)
      if (dateFrom && dateTo) return updated >= new Date(dateFrom) && updated <= new Date(dateTo + "T23:59:59")
      if (dateFrom) return updated >= new Date(dateFrom)
      if (dateTo) return updated <= new Date(dateTo + "T23:59:59")
      return true
    })()
    return statusMatch && userMatch && assignedMatch && searchMatch && dateMatch
  })

  const stats = [
    { label: "Total Clients", value: filtered.length, color: "#111" },
    { label: "Meeting Arranged", value: filtered.filter(c => c.status === "Meeting Arranged").length, color: "#0C447C" },
    { label: "Opportunity", value: filtered.filter(c => c.status === "Opportunity").length, color: "#27ae60" },
    { label: "Existing Clients", value: filtered.filter(c => c.status === "Existing Client").length, color: "#7c3aed" },
  ]

  const filters = ["All", "New","Call Back", "Meeting Arranged", "Opportunity", "No Answer", "Not Interested", "Existing Client"]

 return (
  <div className="flex h-screen bg-gray-50">
    <Sidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={handleLogout} />

    <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? "ml-52" : "ml-0"}`}>
      
      {/* Header ثابت */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
        <div className="flex items-center gap-3">
         <button
  onClick={() => setSidebarOpen(!sidebarOpen)}
  className="flex flex-col justify-center gap-1.5 p-2">
  <span className="block h-0.5 w-6 bg-gray-500"></span>
  <span className="block h-0.5 w-4 bg-gray-500"></span>
  <span className="block h-0.5 w-5 bg-gray-500"></span>
</button>
<div className="flex flex-col items-center">
  <img src="https://smart.sa/wp-content/themes/smart/images/logo.svg" alt="SMART" className="h-7" />
  <p className="mt-1 text-xs text-gray-900 tracking-widest" style={{ fontSize: "11px" }}>Cold Call Track</p>
</div>
        </div>
        <div className="flex items-center gap-3">
          <Notifications
            notifications={notifications}
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
            onRead={markNotificationRead}
            onMarkAllRead={markAllRead}
            notifRef={notifRef}
          />
          <button onClick={() => router.push("/dashboard/add-client")}
            className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            <Plus size={16} /> Add Client
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto mt-16">
{/* StatsCards محذوفة */}
        <Filters
          filters={filters}
          filter={filter} setFilter={setFilter}
          userFilter={userFilter} setUserFilter={setUserFilter}
          assignedFilter={assignedFilter} setAssignedFilter={setAssignedFilter}
          dateFrom={dateFrom} setDateFrom={setDateFrom}
          dateTo={dateTo} setDateTo={setDateTo}
          allUsers={allUsers} allAssigned={allAssigned}
          filteredCount={filtered.length}
          search={search} setSearch={setSearch}
          onReset={() => { setFilter("All"); setUserFilter("All"); setAssignedFilter("All"); setDateFrom(""); setDateTo(""); setSearch("") }}
        />
        <ClientTable
          clients={filtered}
          loading={loading}
          onView={openView}
          onEdit={openEdit}
        />
      </div>
    </div>

    <ViewModal
      client={viewClient}
      files={files}
      history={history}
      onClose={() => setViewClient(null)}
    />

    <EditModal
      client={selectedClient}
      editedClient={editedClient}
      handleChange={handleChange}
      handleSave={confirmSave}
      handleClose={handleClose}
      handleConfirm={handleConfirm}
      saving={saving}
      uploading={uploading}
      isDirty={isDirty}
      openedFromNotif={openedFromNotif}
      user={user}
      users={users}
      tasks={tasks}
      newTask={newTask}
      setNewTask={setNewTask}
      addTask={addTask}
      files={files}
      handleFileUpload={handleFileUpload}
      history={history}
      setEditedClient={setEditedClient}
      setIsDirty={setIsDirty}
    />

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