import { useState, useEffect } from "react";
import { GraduationCap, Loader2, UserPlus, Calendar, Stethoscope } from "lucide-react";
import api from "../../services/api";

interface Lead {
  id: number;
  nomeCompleto: string;
  dataNascimento: string;
  categoria: string | null;
  informacoesMedicas: string | null;
  dataCadastro: string;
  responsavel: {
    nomeCompleto: string;
    whatsapp: string;
    cpf: string;
  };
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    api.get("/admin/leads").then((r) => setLeads(r.data)).finally(() => setLoading(false));
  }, []);

  const efetivar = async (id: number) => {
    setActionLoading(id);
    try {
      await api.post(`/admin/leads/${id}/efetivar`);
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } finally {
      setActionLoading(null);
    }
  };

  const fmtDate = (s: string) => new Date(s).toLocaleDateString("pt-BR");
  const fmtDateTime = (s: string) =>
    new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (loading) return <div className="text-center py-16"><Loader2 className="w-8 h-8 text-accent animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Novas Inscrições</h1>
          <p className="text-gray-500 text-sm mt-1">Aprove leads para transformá-los em alunos ativos.</p>
        </div>
        <div className="bg-blue-50 text-accent px-4 py-2 rounded-xl text-sm font-semibold border border-blue-100">
          {leads.length} {leads.length === 1 ? "lead pendente" : "leads pendentes"}
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-7 h-7 text-accent" />
          </div>
          <p className="text-gray-600 font-semibold">Nenhum lead pendente</p>
          <p className="text-gray-400 text-sm mt-1">Todos os leads foram processados.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {leads.map((lead, i) => (
            <div key={lead.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm card-hover animate-slide-up" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-accent text-white flex items-center justify-center font-semibold text-sm shadow-md">
                      {lead.nomeCompleto[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-navy">{lead.nomeCompleto}</p>
                      <p className="text-xs text-gray-400">{lead.categoria || "Sem categoria"} · Nasc: {fmtDate(lead.dataNascimento)}</p>
                    </div>
                  </div>
                  <div className="pl-[52px] space-y-1">
                    <p className="text-sm text-gray-600"><span className="font-medium">Responsável:</span> {lead.responsavel.nomeCompleto}</p>
                    <p className="text-sm text-gray-500">WhatsApp: {lead.responsavel.whatsapp} · CPF: {lead.responsavel.cpf}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400"><Calendar className="w-3 h-3" />{fmtDateTime(lead.dataCadastro)}</span>
                      {lead.informacoesMedicas && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          <Stethoscope className="w-3 h-3" />{lead.informacoesMedicas.slice(0, 60)}{lead.informacoesMedicas.length > 60 ? "..." : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => efetivar(lead.id)} disabled={actionLoading === lead.id} className="btn-press inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-navy to-navy-light text-white text-sm font-semibold rounded-xl hover:from-navy-light hover:to-navy transition-all shadow-lg shadow-navy/20 disabled:opacity-50 whitespace-nowrap">
                  {actionLoading === lead.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                  Efetivar Matrícula
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
