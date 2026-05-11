import { Outlet, Link, useLocation } from "react-router-dom";
import { Train } from "lucide-react";

export default function PublicLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-navy to-navy-light text-white py-4 px-5 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-md">
            <Train className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Trem das Onze</h1>
            <p className="text-xs text-blue-200 font-light">Gestão Esportiva</p>
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto flex gap-1 px-5 py-1">
          <Link
            to="/inscricao"
            className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              location.pathname === "/inscricao"
                ? "text-accent bg-accent-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            Inscrição
          </Link>
          <Link
            to="/portal"
            className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              location.pathname.startsWith("/portal")
                ? "text-accent bg-accent-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            Portal
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-8 animate-fade-in">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-6 border-t border-gray-100">
        &copy; {new Date().getFullYear()} Trem das Onze — Gestão Esportiva
      </footer>
    </div>
  );
}
