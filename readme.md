# ⚽ Athletic Excellence System (SaaS MVP)

Este repositório contém o código-fonte do Minimum Viable Product (MVP) para o **Athletic Excellence System**, um sistema web (SaaS) projetado para a gestão de quadras e escolinhas de futebol.

O sistema foca em simplificar o fluxo de inscrições (onboarding de alunos) e o controle financeiro (mensalidades), utilizando uma abordagem de validação "concierge" (Notificação via WhatsApp + Aprovação em Dashboard) para agilizar o lançamento sem depender de integrações bancárias complexas no primeiro momento.

---

## 🚀 Tecnologias Utilizadas

* **Backend / API:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
* **Frontend Público:** HTML, JS Vanilla e [Tailwind CSS](https://tailwindcss.com/) (Renderizado via Jinja2)
* **Frontend Administrativo:** [Streamlit](https://streamlit.io/)
* **Banco de Dados:** SQL Server
* **ORM:** SQLAlchemy

---

## ⚙️ Funcionalidades Principais

### 📱 Para os Pais/Responsáveis (Mobile-First)
* **Formulário de Inscrição Público:** Cadastro rápido de novos alunos e responsáveis sem necessidade de login.
* **Portal do Responsável:** Visualização simplificada da mensalidade vigente.
* **Pagamento Ágil:** Exibição de QR Code estático e chave PIX "Copia e Cola".
* **Notificação 1-Click:** Botão que atualiza o status no sistema e redireciona automaticamente para o WhatsApp da secretaria com uma mensagem pré-formatada.

### 💻 Para a Gestão/Secretaria (Desktop)
* **Dashboard de KPIs:** Visão em tempo real de receita esperada, inadimplência e leads.
* **Gestão de Inscrições (Leads):** Aprovação com um clique de novos cadastros, transformando-os em alunos ativos e gerando a primeira cobrança automaticamente.
* **Validação Financeira:** Fila de pagamentos com status "Aguardando Conferência" para cruzamento ágil com extrato bancário/WhatsApp.
* **CRM de Alunos:** Listagem completa de cadastros, filtragem por categoria e status.

---

## 📂 Estrutura do Projeto

```text
/
├── main.py              # Aplicação FastAPI (Backend e Rotas Web)
├── app.py               # Aplicação Streamlit (Dashboard da Gestão)
├── models.py            # Modelos do banco de dados (SQLAlchemy)
├── database.py          # Configuração de conexão com o SQL Server
├── requirements.txt     # Dependências do projeto (Python)
└── templates/           # Templates HTML renderizados pelo FastAPI
    ├── base.html        
    ├── inscricao.html   
    └── portal.html