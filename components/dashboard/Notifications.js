import { Bell } from "lucide-react"

export default function Notifications({ notifications, showNotifications, setShowNotifications, onRead, onMarkAllRead, notifRef }) {
  return (
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
              <button onClick={onMarkAllRead} className="text-xs text-red-700 hover:underline">Mark all read</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-xs text-gray-400 p-4 text-center">No new notifications</p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {notifications.map(n => (
                <div key={n.id} onClick={() => onRead(n)}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50">
                  <p className={`text-xs ${!n.is_opened ? "font-bold text-gray-900" : "font-normal text-gray-600"}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}