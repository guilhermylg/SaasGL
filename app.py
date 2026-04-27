from datetime import datetime, date
from decimal import Decimal
import streamlit as st
import pandas as pd
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Responsavel, Aluno, Mensalidade

st.set_page_config(
    page_title="Athletic Excellence — Admin",
    page_icon="⚽",
    layout="wide",
)

st.markdown(
    """
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;600&display=swap');
        html, body, [class*="css"] { font-family: 'Lexend', sans-serif; }
        .block-container { padding-top: 2rem; }
        h1, h2, h3 { color: #0D2240; }
    </style>
    """,
    unsafe_allow_html=True,
)

st.title("⚽ Athletic Excellence — Painel Administrativo")


def get_session() -> Session:
    return SessionLocal()


tab_dashboard, tab_financeiro, tab_leads, tab_crm = st.tabs([
    "📊 Dashboard",
    "💰 Validação Financeira",
    "🆕 Novas Inscrições",
    "👥 CRM de Alunos",
])


with tab_dashboard:
    db = get_session()

    aguardando = (
        db.query(Mensalidade)
        .filter(Mensalidade.status == "Aguardando Conferência")
        .count()
    )

    novos_leads = (
        db.query(Aluno)
        .filter(Aluno.status == "Lead")
        .count()
    )

    mes_atual = datetime.now().strftime("%m/%Y")
    receita_rows = (
        db.query(Mensalidade.valor)
        .filter(
            Mensalidade.status == "Pago",
            Mensalidade.mes_referencia == mes_atual,
        )
        .all()
    )
    receita_confirmada = sum(row.valor for row in receita_rows) if receita_rows else Decimal("0.00")

    db.close()

    col1, col2, col3 = st.columns(3)
    col1.metric("⏳ Pagamentos Aguardando", aguardando)
    col2.metric("🆕 Novos Leads", novos_leads)
    col3.metric("💵 Receita Confirmada (Mês)", f"R$ {receita_confirmada:,.2f}")


with tab_financeiro:
    db = get_session()

    pendentes = (
        db.query(Mensalidade)
        .filter(Mensalidade.status == "Aguardando Conferência")
        .order_by(Mensalidade.data_criacao.desc())
        .all()
    )

    if not pendentes:
        st.info("Nenhum pagamento aguardando conferência.")
    else:
        for m in pendentes:
            aluno = db.query(Aluno).filter(Aluno.id == m.aluno_id).first()
            responsavel = (
                db.query(Responsavel)
                .filter(Responsavel.id == aluno.responsavel_id)
                .first()
            )

            with st.container():
                st.markdown("---")
                c1, c2, c3, c4 = st.columns([3, 2, 1, 1])

                c1.markdown(f"**{aluno.nome_completo}**")
                c1.caption(f"Responsável: {responsavel.nome_completo} · {responsavel.whatsapp}")

                c2.markdown(f"Ref: **{m.mes_referencia}**")
                c2.caption(f"R$ {m.valor:,.2f}")

                if c3.button("✅ Confirmar", key=f"confirm_{m.id}"):
                    m.status = "Pago"
                    db.commit()
                    st.rerun()

                if c4.button("❌ Rejeitar", key=f"reject_{m.id}"):
                    m.status = "Pendente"
                    db.commit()
                    st.rerun()

    db.close()


with tab_leads:
    db = get_session()

    leads = (
        db.query(Aluno)
        .filter(Aluno.status == "Lead")
        .order_by(Aluno.data_cadastro.desc())
        .all()
    )

    if not leads:
        st.info("Nenhum lead pendente.")
    else:
        for aluno in leads:
            responsavel = (
                db.query(Responsavel)
                .filter(Responsavel.id == aluno.responsavel_id)
                .first()
            )

            with st.container():
                st.markdown("---")
                c1, c2, c3 = st.columns([4, 2, 2])

                c1.markdown(f"**{aluno.nome_completo}** — {aluno.categoria or 'Sem categoria'}")
                c1.caption(
                    f"Responsável: {responsavel.nome_completo} · "
                    f"WhatsApp: {responsavel.whatsapp} · "
                    f"Cadastro: {aluno.data_cadastro.strftime('%d/%m/%Y %H:%M')}"
                )

                if aluno.informacoes_medicas:
                    c2.caption(f"Médico: {aluno.informacoes_medicas[:80]}")

                if c3.button("🎓 Efetivar Matrícula", key=f"lead_{aluno.id}"):
                    aluno.status = "Ativo"

                    hoje = date.today()
                    mensalidade = Mensalidade(
                        aluno_id=aluno.id,
                        mes_referencia=hoje.strftime("%m/%Y"),
                        valor=Decimal("150.00"),
                        data_vencimento=date(hoje.year, hoje.month, 10),
                        status="Pendente",
                    )
                    db.add(mensalidade)
                    db.commit()
                    st.rerun()

    db.close()


with tab_crm:
    db = get_session()

    categorias = [r[0] for r in db.query(Aluno.categoria).distinct().all() if r[0]]
    filtro = st.multiselect("Filtrar por Categoria", options=categorias, default=categorias)

    query = db.query(Aluno).filter(Aluno.status == "Ativo")

    if filtro:
        query = query.filter(Aluno.categoria.in_(filtro))

    alunos_ativos = query.order_by(Aluno.data_cadastro.desc()).all()

    if not alunos_ativos:
        st.info("Nenhum aluno ativo encontrado.")
    else:
        rows = []
        for a in alunos_ativos:
            resp = db.query(Responsavel).filter(Responsavel.id == a.responsavel_id).first()
            rows.append({
                "Aluno": a.nome_completo,
                "Categoria": a.categoria,
                "Nascimento": a.data_nascimento.strftime("%d/%m/%Y") if a.data_nascimento else "",
                "Responsável": resp.nome_completo if resp else "",
                "WhatsApp": resp.whatsapp if resp else "",
                "Desde": a.data_cadastro.strftime("%d/%m/%Y") if a.data_cadastro else "",
            })

        df = pd.DataFrame(rows)
        st.dataframe(df, use_container_width=True, hide_index=True)

    db.close()
