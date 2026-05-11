# 🚂 Gerenciamento Trem das Onze (SaaS MVP)

Sistema web (SaaS) para gestão de escolinhas de futebol e quadras esportivas.

O sistema foca em simplificar o fluxo de inscrições (onboarding de alunos) e o controle financeiro (mensalidades), utilizando uma abordagem de validação "concierge" (Notificação via WhatsApp + Aprovação em Dashboard).

---

## 🚀 Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Linguagem** | TypeScript (Full-Stack) |
| **Backend / API** | Node.js + Express.js |
| **ORM / Banco** | Prisma ORM (SQL Server) |
| **Frontend** | React + Vite |
| **Estilização** | Tailwind CSS |
| **Ícones** | Lucide React |
| **Gráficos** | Recharts |

---

## ⚙️ Funcionalidades

### 📱 Área Pública (Mobile-First)
- **Formulário de Inscrição** — Cadastro de alunos e responsáveis sem login
- **Portal do Responsável** — Acesso via CPF para ver mensalidades
- **Notificação de Pagamento** — Botão que atualiza status + abre WhatsApp

### 💻 Área Administrativa (Desktop)
- **Dashboard de KPIs** — Receita, leads, pagamentos pendentes + gráficos
- **Gestão de Leads** — Aprovação com um clique (gera primeira mensalidade)
- **Validação Financeira** — Confirmar/rejeitar pagamentos
- **CRM de Alunos** — Tabela com filtros por categoria e status

---

## 📂 Estrutura do Projeto

```text
/
├── backend/
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── adminController.ts
│   │   │   ├── inscricaoController.ts
│   │   │   └── portalController.ts
│   │   ├── routes/
│   │   │   ├── adminRoutes.ts
│   │   │   ├── inscricaoRoutes.ts
│   │   │   └── portalRoutes.ts
│   │   ├── prisma.ts
│   │   └── server.ts
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── AdminLayout.tsx
    │   │   ├── PublicLayout.tsx
    │   │   └── Sidebar.tsx
    │   ├── pages/
    │   │   ├── admin/
    │   │   │   ├── CRM.tsx
    │   │   │   ├── Dashboard.tsx
    │   │   │   ├── Financeiro.tsx
    │   │   │   └── Leads.tsx
    │   │   └── public/
    │   │       ├── Inscricao.tsx
    │   │       └── Portal.tsx
    │   ├── services/api.ts
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── vite.config.ts
    └── tsconfig.json
```

---

## 🏃 Como Rodar

### Pré-requisitos
- Node.js 18+
- SQL Server (com database criada)

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

O frontend roda em `http://localhost:5173` e faz proxy das chamadas `/api` para o backend na porta `3001`.