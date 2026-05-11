import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  UserPlus,
  Train,
  LogOut,
} from "lucide-react";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/leads", icon: UserPlus, label: "Novas Inscrições", end: false },
  { to: "/admin/financeiro", icon: DollarSign, label: "Financeiro", end: false },
  { to: "/admin/alunos", icon: Users, label: "CRM de Alunos", end: false },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("trem_admin_token");
    navigate("/admin/login");
  };

  return (
    <aside className="w-64 fixed inset-y-0 left-0 bg-gradient-to-b from-navy to-navy-dark text-white flex flex-col z-20">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shadow-lg">
          <Train className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-sm tracking-tight">Trem das Onze</p>
          <p className="text-[10px] text-blue-300 font-light">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-accent text-white shadow-lg shadow-accent/25"
                  : "text-blue-200 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10 space-y-4">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors w-full"
        >
          <LogOut size={16} />
          Sair
        </button>
        <p className="text-[10px] text-blue-400">v1.0.0 — MVP</p>
      </div>
    </aside>
  );
}
