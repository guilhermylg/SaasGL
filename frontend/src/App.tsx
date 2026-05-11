import { Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";
import AdminLayout from "./components/AdminLayout";
import Inscricao from "./pages/public/Inscricao";
import Portal from "./pages/public/Portal";
import Dashboard from "./pages/admin/Dashboard";
import Financeiro from "./pages/admin/Financeiro";
import Leads from "./pages/admin/Leads";
import CRM from "./pages/admin/CRM";
import Login from "./pages/admin/Login";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("trem_admin_token");
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route element={<PublicLayout />}>
        <Route path="/inscricao" element={<Inscricao />} />
        <Route path="/portal" element={<Portal />} />
        <Route path="/portal/:cpf" element={<Portal />} />
      </Route>

      {/* Rotas Admin */}
      <Route path="/admin/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="financeiro" element={<Financeiro />} />
        <Route path="alunos" element={<CRM />} />
      </Route>

      {/* Redirect */}
      <Route path="/" element={<Navigate to="/inscricao" replace />} />
      <Route path="*" element={<Navigate to="/inscricao" replace />} />
    </Routes>
  );
}
