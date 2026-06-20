import { Eye, Edit } from "lucide-react"

export default function ClientTable({ clients, loading, onView, onEdit }) {

  const statusBadge = (status) => {
    const styles = {
      "New": "bg-gray-100 text-gray-600",
      "Call Back": "bg-cyan-50 text-cyan-700",
        "On Hold": "bg-orange-50 text-orange-700",
      "Meeting Arranged": "bg-blue-50 text-blue-800",
      "Qualified": "bg-green-50 text-green-700",
"Not Qualified": "bg-red-50 text-red-700",
      "Opportunity": "bg-green-50 text-green-800",
      "No Answer": "bg-amber-50 text-amber-800",
      "Existing Client": "bg-purple-50 text-purple-800",
    }
    return styles[status] || "bg-gray-100 text-gray-600"
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left px-4 py-3 text-xs text-gray-400 font-normal">Client</th>
            <th className="text-left px-4 py-3 text-xs text-gray-400 font-normal">Job Title</th>
            <th className="text-left px-4 py-3 text-xs text-gray-400 font-normal">Company</th>
            <th className="text-left px-4 py-3 text-xs text-gray-400 font-normal">Phone</th>
            <th className="text-left px-4 py-3 text-xs text-gray-400 font-normal">Status</th>
            <th className="text-left px-4 py-3 text-xs text-gray-400 font-normal">Assigned To</th>
            <th className="text-left px-4 py-3 text-xs text-gray-400 font-normal">Updated by</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">Loading...</td></tr>
          ) : clients.length === 0 ? (
            <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">No clients found</td></tr>
          ) : (
            clients.map(client => (
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
                    <button onClick={() => onView(client)} className="text-gray-400 hover:text-blue-600 transition">
                      <Eye size={17} />
                    </button>
                    <button onClick={() => onEdit(client)} className="text-gray-400 hover:text-red-700 transition">
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
  )
}