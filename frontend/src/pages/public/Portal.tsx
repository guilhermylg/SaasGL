import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, Clock, CheckCircle2, AlertTriangle, MessageCircle, Loader2 } from "lucide-react";
import api from "../../services/api";

const NUMERO_ESCOLA = "5511912309170";

interface Mensalidade {
  id: number;
  mesReferencia: string;
  valor: number;
  dataVencimento: string;
  status: string;
}

interface AlunoPortal {
  id: number;
  nomeCompleto: string;
  categoria: string;
  mensalidades: Mensalidade[];
}

interface PortalData {
  responsavel: { id: number; nomeCompleto: string; cpf: string; whatsapp: string };
  alunos: AlunoPortal[];
}

export default function Portal() {
  const { cpf: paramCpf } = useParams();
  const navigate = useNavigate();
  const [cpfInput, setCpfInput] = useState("");
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const maskCPF = (value: string): string => {
    const nums = value.replace(/\D/g, "").slice(0, 11);
    if (nums.length > 9) return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
    if (nums.length > 6) return nums.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    if (nums.length > 3) return nums.replace(/(\d{3})(\d{1,3})/, "$1.$2");
    return nums;
  };

  const buscar = async (cpf: string) => {
    setLoading(true);
    setNotFound(false);
    setData(null);
    try {
      const res = await api.get(`/portal/${cpf}`);
      setData(res.data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramCpf) {
      setCpfInput(paramCpf);
      buscar(paramCpf);
    }
  }, [paramCpf]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (cpfInput.length >= 11) {
      navigate(`/portal/${cpfInput}`);
    }
  };

  const notificarPagamento = async (
    mensalidadeId: number,
    alunoNome: string,
    mesRef: string
  ) => {
    try {
      const res = await api.patch(`/portal/mensalidade/${mensalidadeId}/notificar`);
      if (res.status === 200 && data) {
        // Atualiza estado local
        setData({
          ...data,
          alunos: data.alunos.map((a) => ({
            ...a,
            mensalidades: a.mensalidades.map((m) =>
              m.id === mensalidadeId ? { ...m, status: "Aguardando Conferência" } : m
            ),
          })),
        });

        // Abre WhatsApp
        const texto = encodeURIComponent(
          `Olá! Sou responsável pelo(a) ${alunoNome} e estou enviando o comprovante da mensalidade de ${mesRef}.`
        );
        window.open(`https://wa.me/${NUMERO_ESCOLA}?text=${texto}`, "_blank");
      }
    } catch {
      /* silently fail */
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const getStatusBadge = (m: Mensalidade, alunoNome: string) => {
    switch (m.status) {
      case "Pendente":
        return (
          <button
            onClick={() => notificarPagamento(m.id, alunoNome, m.mesReferencia)}
            className="btn-press w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-3 text-sm font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Enviar Comprovante via WhatsApp
          </button>
        );
      case "Aguardando Conferência":
        return (
          <div className="w-full bg-amber-50 text-amber-700 p-3 text-sm font-semibold rounded-xl text-center flex items-center justify-center gap-2 border border-amber-200">
            <Clock className="w-4 h-4" />
            Aguardando Conferência
          </div>
        );
      case "Pago":
        return (
          <div className="w-full bg-emerald-50 text-emerald-700 p-3 text-sm font-semibold rounded-xl text-center flex items-center justify-center gap-2 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
            Pago
          </div>
        );
      case "Atrasado":
        return (
          <button
            onClick={() => notificarPagamento(m.id, alunoNome, m.mesReferencia)}
            className="btn-press w-full bg-gradient-to-r from-red-500 to-red-600 text-white p-3 text-sm font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Atrasado — Enviar Comprovante
          </button>
        );
      default:
        return null;
    }
  };

  // Tela de busca por CPF
  if (!paramCpf && !data) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-navy-50 flex items-center justify-center mx-auto mb-6">
          <Search className="w-8 h-8 text-navy" />
        </div>
        <h2 className="text-2xl font-semibold text-navy mb-2">Portal do Responsável</h2>
        <p className="text-gray-500 mb-8">Digite seu CPF para acessar as mensalidades.</p>
        <form onSubmit={handleSearch} className="max-w-sm mx-auto flex gap-2">
          <input
            type="text"
            value={cpfInput}
            onChange={(e) => setCpfInput(maskCPF(e.target.value))}
            placeholder="000.000.000-00"
            className="flex-1 p-4 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all"
          />
          <button
            type="submit"
            className="btn-press px-6 bg-navy text-white rounded-xl font-semibold hover:bg-navy-light transition-colors shadow-md"
          >
            <Search className="w-5 h-5" />
          </button>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto" />
        <p className="text-gray-500 mt-4">Buscando dados...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-600">CPF não encontrado</h2>
        <p className="text-gray-400 mt-2">Verifique o CPF informado ou realize uma inscrição primeiro.</p>
        <button
          onClick={() => navigate("/inscricao")}
          className="mt-6 bg-navy text-white px-6 py-3 rounded-xl font-semibold hover:bg-navy-light transition-colors inline-block"
        >
          Fazer Inscrição
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-navy">
          Olá, {data.responsavel.nomeCompleto.split(" ")[0]} 👋
        </h2>
        <p className="text-gray-500 mt-1">Gerencie as mensalidades dos seus atletas.</p>
      </div>

      {data.alunos.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-5 text-center">
          <p className="font-semibold">Nenhum atleta ativo</p>
          <p className="text-sm mt-1">Sua inscrição está sendo analisada. Aguarde a confirmação.</p>
        </div>
      )}

      {data.alunos.map((aluno) => (
        <div key={aluno.id} className="mb-8 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm card-hover">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-navy to-accent text-white flex items-center justify-center font-semibold text-sm shadow-md">
              {aluno.nomeCompleto[0]}
            </div>
            <div>
              <p className="font-semibold text-navy">{aluno.nomeCompleto}</p>
              <p className="text-xs text-gray-400">{aluno.categoria}</p>
            </div>
          </div>

          {aluno.mensalidades.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Nenhuma mensalidade gerada ainda.</p>
          )}

          {aluno.mensalidades.map((m) => (
            <div key={m.id} className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-navy">{m.mesReferencia}</p>
                  <p className="text-sm text-gray-500">Vencimento: {formatDate(m.dataVencimento)}</p>
                </div>
                <p className="text-lg font-semibold text-navy">
                  R$ {m.valor.toFixed(2).replace(".", ",")}
                </p>
              </div>
              {getStatusBadge(m, aluno.nomeCompleto)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
