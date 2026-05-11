import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader2, DollarSign } from "lucide-react";
import api from "../../services/api";

interface PagamentoItem {
  id: number;
  mesReferencia: string;
  valor: number;
  dataVencimento: string;
  alunoNome: string;
  responsavelNome: string;
  responsavelWhatsapp: string;
}

export default function Financeiro() {
  const [pendentes, setPendentes] = useState<PagamentoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const res = await api.get("/admin/financeiro");
      setPendentes(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const confirmar = async (id: number) => {
    setActionLoading(id);
    try {
      await api.patch(`/admin/financeiro/${id}/confirmar`);
      setPendentes((prev) => prev.filter((p) => p.id !== id));
    } catch {
      /* ignore */
    } finally {
      setActionLoading(null);
    }
  };

  const rejeitar = async (id: number) => {
    setActionLoading(id);
    try {
      await api.patch(`/admin/financeiro/${id}/rejeitar`);
      setPendentes((prev) => prev.filter((p) => p.id !== id));
    } catch {
      /* ignore */
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Validação Financeira</h1>
        <p className="text-gray-500 text-sm mt-1">
          Confirme ou rejeite pagamentos após verificar os comprovantes via WhatsApp.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto" />
        </div>
      ) : pendentes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-7 h-7 text-emerald-500" />
          </div>
          <p className="text-gray-600 font-semibold">Nenhum pagamento aguardando conferência</p>
          <p className="text-gray-400 text-sm mt-1">Todos os pagamentos foram processados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">
                    Aluno
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">
                    Responsável
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">
                    Referência
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">
                    Valor
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">
                    Vencimento
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pendentes.map((p, i) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50 transition-colors animate-slide-up"
                    style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy text-sm">{p.alunoNome}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{p.responsavelNome}</p>
                      <p className="text-xs text-gray-400">{p.responsavelWhatsapp}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-700">{p.mesReferencia}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-navy">
                        R$ {p.valor.toFixed(2).replace(".", ",")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{formatDate(p.dataVencimento)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => confirmar(p.id)}
                          disabled={actionLoading === p.id}
                          className="btn-press inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50"
                        >
                          {actionLoading === p.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Confirmar
                        </button>
                        <button
                          onClick={() => rejeitar(p.id)}
                          disabled={actionLoading === p.id}
                          className="btn-press inline-flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Rejeitar
                        </button>
                      </div>
                    </td>
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
