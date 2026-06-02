export default function Filters({
  filters, filter, setFilter,
  userFilter, setUserFilter,
  assignedFilter, setAssignedFilter,
  dateFrom, setDateFrom,
  dateTo, setDateTo,
  allUsers, allAssigned,
  filteredCount,
  onReset,
  search, setSearch
}) {
  return (
    <>
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
        <input
          type="text"
          placeholder="🔍 Search name, company, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 outline-none focus:border-red-700 w-56"
        />

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

        <button onClick={onReset}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition">
          Reset
        </button>

        <button onClick={() => window.print()}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition">
          🖨️ Print
        </button>

        <p className="text-xs text-gray-400 ml-auto">{filteredCount} clients found</p>
      </div>
    </>
  )
}