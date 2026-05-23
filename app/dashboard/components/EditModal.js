import { X, Save, Upload, Clock, CalendarPlus } from "lucide-react"

export default function EditModal({
  client, editedClient, handleChange, handleSave, handleClose, handleConfirm,
  saving, uploading, isDirty, openedFromNotif, user, users,
  tasks, newTask, setNewTask, addTask,
  files, handleFileUpload, history, setEditedClient, setIsDirty
}) {
  if (!client) return null

  const industries = [
    "Technology", "Healthcare", "Finance", "Education",
    "Real Estate", "Retail", "Manufacturing", "Government", "Other"
  ]

  // normalize industry value للمقارنة
  const normalizeIndustry = (val) => {
    if (!val) return ""
    return industries.find(i => i.toLowerCase() === val.toLowerCase()) || val
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{editedClient?.client_name}</h2>
            <p className="text-xs text-gray-400">{editedClient?.company_name}</p>
          </div>
          <div className="flex items-center gap-3">
            {!editedClient?.is_confirmed && editedClient?.assigned_to_email === user?.email && (
              <button onClick={handleConfirm}
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
                {[
                  { label: "Client Name", name: "client_name" },
                  { label: "Job Title", name: "job_title" },
                  { label: "Company Name", name: "company_name" },
                  { label: "Phone", name: "client_phone" },
                  { label: "Email", name: "client_email" },
                ].map((f, i) => (
                  <div key={i}>
                    <label className="block text-xs text-gray-400 mb-1">{f.label}</label>
                    <input name={f.name} value={editedClient?.[f.name] || ""} onChange={handleChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-200" />
                  </div>
                ))}

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Status</label>
                  <select name="status" value={editedClient?.status || "New"} onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-200">
                    <option>New</option>
                    <option>Call Back</option>
                    <option>Meeting Arranged</option>
                    <option>Opportunity</option>
                    <option>No Answer</option>
                    <option>Not Interested</option>
                    <option>Existing Client</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Industry</label>
                  <select
                    name="industry"
                    value={normalizeIndustry(editedClient?.industry)}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-200">
                    <option value="">— Select Industry —</option>
                    {industries.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
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
                        <p className="text-xs text-gray-400">
                          {new Date(t.scheduled_at).toLocaleDateString()} {new Date(t.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
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
                      <a href={file.file_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-red-700 hover:underline">View</a>
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
                    <p className="text-xs text-gray-300">
                      {new Date(h.created_at).toLocaleDateString()} {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}