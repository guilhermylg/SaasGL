import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";

export default function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar with mobile toggle */}
      <div className={`fixed inset-y-0 left-0 z-20 transform transition-transform duration-300 lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col lg:ml-64 w-full">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between lg:justify-start px-4 lg:px-8 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden text-navy hover:text-navy-light"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse hidden sm:block" />
            <span className="text-sm text-gray-500 hidden sm:block">Painel Administrativo</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 animate-fade-in w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
