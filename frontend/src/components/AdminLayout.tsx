import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-8 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-gray-500">Painel Administrativo</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
