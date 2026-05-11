import { useState, useEffect } from "react";
import { Search, Loader2, Users, Filter } from "lucide-react";
import api from "../../services/api";

interface AlunoRow {
  id: number;
  nomeCompleto: string;
  dataNascimento: string;
  categoria: string | null;
  status: string;
  dataCadastro: string;
  informacoesMedicas: string | null;
  responsavel: { nomeCompleto: string; whatsapp: string; cpf: string };
}

const categorias = ["Sub-7", "Sub-9", "Sub-11", "Sub-13", "Sub-15", "Sub-17"];

export default function CRM() {
  const [alunos, setAlunos] = useState<AlunoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [busca, setBusca] = useState("");

  const fetchAlunos = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filtroCategoria) params.categoria = filtroCategoria;
      if (filtroStatus) params.status = filtroStatus;
      const res = await api.get("/admin/alunos", { params });
      setAlunos(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAlunos(); }, [filtroCategoria, filtroStatus]);

  const fmtDate = (s: string) => new Date(s).toLocaleDateString("pt-BR");

  const filtered = alunos.filter((a) =>
    a.nomeCompleto.toLowerCase().includes(busca.toLowerCase()) ||
    a.responsavel.nomeCompleto.toLowerCase().includes(busca.toLowerCase())
  );

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Ativo: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Lead: "bg-blue-50 text-accent border-blue-200",
      Inativo: "bg-gray-100 text-gray-500 border-gray-200",
    };
    return map[status] || "bg-gray-100 text-gray-500 border-gray-200";
  };

  const selectClass = "px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none bg-white";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">CRM de Alunos</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie todos os cadastros da escolinha.</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none"
          />
        </div>
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className={selectClass}>
          <option value="">Todas as categorias</option>
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className={selectClass}>
          <option value="">Todos os status</option>
          <option value="Ativo">Ativo</option>
          <option value="Lead">Lead</option>
          <option value="Inativo">Inativo</option>
        </select>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 text-accent animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-600 font-semibold">Nenhum aluno encontrado</p>
          <p className="text-gray-400 text-sm mt-1">Ajuste os filtros para ver resultados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">{filtered.length} alunos encontrados</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Aluno</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Categoria</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Nascimento</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Responsável</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">WhatsApp</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((a, i) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors" style={{ animationDelay: `${i * 30}ms` }}>
                    <td className="px-6 py-4"><p className="font-semibold text-navy text-sm">{a.nomeCompleto}</p></td>
                    <td className="px-6 py-4"><span className="text-sm text-gray-700">{a.categoria || "—"}</span></td>
                    <td className="px-6 py-4"><span className="text-sm text-gray-500">{fmtDate(a.dataNascimento)}</span></td>
                    <td className="px-6 py-4"><span className="text-sm text-gray-700">{a.responsavel.nomeCompleto}</span></td>
                    <td className="px-6 py-4"><span className="text-sm text-gray-500">{a.responsavel.whatsapp}</span></td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full border ${statusBadge(a.status)}`}>{a.status}</span>
                    </td>
                    <td className="px-6 py-4"><span className="text-sm text-gray-400">{fmtDate(a.dataCadastro)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
