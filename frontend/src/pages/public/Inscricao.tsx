import { useState } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import api from "../../services/api";

interface InscricaoForm {
  nomeResponsavel: string;
  cpf: string;
  whatsapp: string;
  nomeAluno: string;
  dataNascimento: string;
  categoria: string;
  informacoesMedicas: string;
}

// ── Máscaras ────────────────────────────────────────────────────────────────────

function maskCPF(value: string): string {
  const nums = value.replace(/\D/g, "").slice(0, 11);
  if (nums.length > 9) return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
  if (nums.length > 6) return nums.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
  if (nums.length > 3) return nums.replace(/(\d{3})(\d{1,3})/, "$1.$2");
  return nums;
}

function maskPhone(value: string): string {
  const nums = value.replace(/\D/g, "").slice(0, 11);
  if (nums.length > 6) return nums.replace(/(\d{2})(\d{5})(\d{1,4})/, "($1) $2-$3");
  if (nums.length > 2) return nums.replace(/(\d{2})(\d{1,5})/, "($1) $2");
  return nums;
}

const categorias = ["Sub-7", "Sub-9", "Sub-11", "Sub-13", "Sub-15", "Sub-17"];

export default function Inscricao() {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<InscricaoForm>();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (data: InscricaoForm) => {
    setStatus("loading");
    try {
      await api.post("/inscricao", data);
      setStatus("success");
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || "Erro ao enviar. Tente novamente.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="animate-fade-in text-center py-12">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-semibold text-navy mb-2">Inscrição enviada!</h2>
        <p className="text-gray-500">Entraremos em contato pelo WhatsApp informado.</p>
      </div>
    );
  }

  const inputClass =
    "w-full p-4 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all duration-200 bg-white hover:border-gray-300";

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-navy">Nova Inscrição</h2>
        <p className="text-gray-500 mt-1">Preencha os dados para inscrever seu atleta.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Dados do Responsável */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold text-navy uppercase tracking-wider mb-2 border-b border-gray-200 pb-2 w-full">
            Dados do Responsável
          </legend>

          <div>
            <label htmlFor="nomeResponsavel" className="block text-sm font-medium text-gray-600 mb-1">
              Nome Completo
            </label>
            <input
              id="nomeResponsavel"
              type="text"
              placeholder="Maria da Silva"
              className={inputClass}
              {...register("nomeResponsavel", { required: "Nome é obrigatório" })}
            />
            {errors.nomeResponsavel && (
              <p className="text-red-500 text-xs mt-1">{errors.nomeResponsavel.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="cpf" className="block text-sm font-medium text-gray-600 mb-1">
              CPF
            </label>
            <input
              id="cpf"
              type="text"
              placeholder="000.000.000-00"
              className={inputClass}
              {...register("cpf", { required: "CPF é obrigatório" })}
              onChange={(e) => setValue("cpf", maskCPF(e.target.value))}
            />
            {errors.cpf && (
              <p className="text-red-500 text-xs mt-1">{errors.cpf.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-600 mb-1">
              WhatsApp
            </label>
            <input
              id="whatsapp"
              type="tel"
              placeholder="(11) 99999-9999"
              className={inputClass}
              {...register("whatsapp", { required: "WhatsApp é obrigatório" })}
              onChange={(e) => setValue("whatsapp", maskPhone(e.target.value))}
            />
            {errors.whatsapp && (
              <p className="text-red-500 text-xs mt-1">{errors.whatsapp.message}</p>
            )}
          </div>
        </fieldset>

        {/* Dados do Atleta */}
        <fieldset className="space-y-4 pt-2">
          <legend className="text-xs font-semibold text-navy uppercase tracking-wider mb-2 border-b border-gray-200 pb-2 w-full">
            Dados do Atleta
          </legend>

          <div>
            <label htmlFor="nomeAluno" className="block text-sm font-medium text-gray-600 mb-1">
              Nome Completo do Atleta
            </label>
            <input
              id="nomeAluno"
              type="text"
              placeholder="João da Silva"
              className={inputClass}
              {...register("nomeAluno", { required: "Nome do atleta é obrigatório" })}
            />
            {errors.nomeAluno && (
              <p className="text-red-500 text-xs mt-1">{errors.nomeAluno.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="dataNascimento" className="block text-sm font-medium text-gray-600 mb-1">
              Data de Nascimento
            </label>
            <input
              id="dataNascimento"
              type="date"
              className={inputClass}
              {...register("dataNascimento", { required: "Data de nascimento é obrigatória" })}
            />
            {errors.dataNascimento && (
              <p className="text-red-500 text-xs mt-1">{errors.dataNascimento.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="categoria" className="block text-sm font-medium text-gray-600 mb-1">
              Categoria
            </label>
            <select
              id="categoria"
              className={`${inputClass} bg-white`}
              {...register("categoria", { required: "Selecione uma categoria" })}
            >
              <option value="">Selecione a categoria</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.categoria && (
              <p className="text-red-500 text-xs mt-1">{errors.categoria.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="informacoesMedicas" className="block text-sm font-medium text-gray-600 mb-1">
              Informações Médicas <span className="text-gray-400">(opcional)</span>
            </label>
            <textarea
              id="informacoesMedicas"
              rows={3}
              placeholder="Alergias, restrições, medicamentos..."
              className={`${inputClass} resize-none`}
              {...register("informacoesMedicas")}
            />
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-press w-full bg-gradient-to-r from-navy to-navy-light text-white p-4 text-base font-semibold rounded-xl hover:from-navy-light hover:to-navy transition-all shadow-lg shadow-navy/20 mt-4 flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar Inscrição"
          )}
        </button>
      </form>

      {status === "error" && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-800 rounded-xl p-5 text-center animate-fade-in">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
          <p className="font-semibold">Erro ao enviar</p>
          <p className="text-sm mt-1">{errorMessage}</p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-3 text-sm text-red-600 underline hover:text-red-800"
          >
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}
