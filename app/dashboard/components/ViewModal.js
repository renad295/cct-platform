import { X, Clock } from "lucide-react"

export default function ViewModal({ client, files, history, onClose }) {
  if (!client) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{client.client_name}</h2>
            <p className="text-xs text-gray-400">{client.company_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex overflow-hidden flex-1">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Client Name", value: client.client_name },
                { label: "Job Title", value: client.job_title || "-" },
                { label: "Company", value: client.company_name },
                { label: "Phone", value: client.client_phone || "-" },
                { label: "Email", value: client.client_email || "-" },
                { label: "Status", value: client.status },
                { label: "Assigned To", value: client.assigned_to || "-" },
                { label: "Industry", value: client.industry || "-" },
              ].map((f, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">{f.label}</p>
                  <p className="text-sm font-medium text-gray-800">{f.value}</p>
                </div>
              ))}
            </div>

            {client.notes && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-800">{client.notes}</p>
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
                      <a href={file.file_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-red-700 hover:underline">View</a>
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