import { useState, useEffect } from "react";
import { Users, Clock, DollarSign, TrendingUp, UserPlus, AlertTriangle } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../../services/api";

interface DashboardData {
  aguardando: number;
  novosLeads: number;
  receitaConfirmada: number;
  totalAtivos: number;
  inadimplentes: number;
  receitaMensal: { label: string; receita: number }[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/admin/dashboard");
        setData(res.data);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const kpis = [
    {
      label: "Receita Confirmada",
      value: `R$ ${data.receitaConfirmada.toFixed(2).replace(".", ",")}`,
      icon: DollarSign,
      color: "from-emerald-400 to-emerald-600",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-700",
    },
    {
      label: "Novos Leads",
      value: data.novosLeads,
      icon: UserPlus,
      color: "from-accent to-accent-dark",
      bgLight: "bg-blue-50",
      textColor: "text-accent",
    },
    {
      label: "Aguardando Conferência",
      value: data.aguardando,
      icon: Clock,
      color: "from-amber-400 to-amber-600",
      bgLight: "bg-amber-50",
      textColor: "text-amber-700",
    },
    {
      label: "Alunos Ativos",
      value: data.totalAtivos,
      icon: Users,
      color: "from-navy to-navy-light",
      bgLight: "bg-navy-50",
      textColor: "text-navy",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Visão geral do sistema</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <TrendingUp className="w-4 h-4" />
          Atualizado agora
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.label}
            className="bg-white rounded-2xl p-6 border border-gray-100 card-hover animate-slide-up"
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {kpi.label}
              </span>
              <div className={`w-9 h-9 rounded-xl ${kpi.bgLight} flex items-center justify-center`}>
                <kpi.icon className={`w-4 h-4 ${kpi.textColor}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${kpi.textColor}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Gráfico + Info Extra */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-navy mb-4">Receita Confirmada (6 meses)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.receitaMensal}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number) => [
                    `R$ ${value.toFixed(2).replace(".", ",")}`,
                    "Receita",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="receita"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fill="url(#colorReceita)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Stats */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-sm font-semibold text-navy">Resumo Rápido</h3>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-semibold text-red-700">{data.inadimplentes}</p>
                <p className="text-xs text-red-500">Inadimplentes este mês</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <Users className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-emerald-700">{data.totalAtivos}</p>
                <p className="text-xs text-emerald-500">Total de alunos ativos</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <UserPlus className="w-5 h-5 text-accent" />
              <div>
                <p className="text-sm font-semibold text-accent">{data.novosLeads}</p>
                <p className="text-xs text-blue-500">Leads aguardando aprovação</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
