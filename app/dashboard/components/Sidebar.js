"use client"
import { useRouter } from "next/navigation"
import { LogOut, Users, Mail, TrendingUp } from "lucide-react"

export default function Sidebar({ user, sidebarOpen, setSidebarOpen, onLogout }) {
  const router = useRouter()

  return (
    <>
      {/* Toggle Button */}
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
          <button onClick={onLogout} className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-700 transition">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>
    </>
  )
}