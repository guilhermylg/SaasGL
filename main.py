from datetime import datetime
from fastapi import FastAPI, Request, Depends, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from database import engine, get_db, Base
from models import Responsavel, Aluno, Mensalidade

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Athletic Excellence System")
templates = Jinja2Templates(directory="templates")


@app.get("/inscricao", response_class=HTMLResponse)
async def formulario_inscricao(request: Request):
    return templates.TemplateResponse("inscricao.html", {"request": request})


@app.post("/api/inscricao")
async def processar_inscricao(
    nome_responsavel: str = Form(...),
    cpf: str = Form(...),
    whatsapp: str = Form(...),
    nome_aluno: str = Form(...),
    data_nascimento: str = Form(...),
    categoria: str = Form(...),
    informacoes_medicas: str = Form(""),
    db: Session = Depends(get_db),
):
    responsavel = db.query(Responsavel).filter(Responsavel.cpf == cpf).first()

    if not responsavel:
        responsavel = Responsavel(
            nome_completo=nome_responsavel,
            cpf=cpf,
            whatsapp=whatsapp,
        )
        db.add(responsavel)
        db.flush()

    aluno = Aluno(
        responsavel_id=responsavel.id,
        nome_completo=nome_aluno,
        data_nascimento=datetime.strptime(data_nascimento, "%Y-%m-%d").date(),
        categoria=categoria,
        informacoes_medicas=informacoes_medicas or None,
        status="Lead",
    )
    db.add(aluno)
    db.commit()

    return JSONResponse(
        content={"message": "Inscrição realizada com sucesso!", "aluno_id": aluno.id},
        status_code=201,
    )


@app.get("/portal/{cpf}", response_class=HTMLResponse)
async def portal_responsavel(
    request: Request,
    cpf: str,
    db: Session = Depends(get_db),
):
    responsavel = db.query(Responsavel).filter(Responsavel.cpf == cpf).first()

    if not responsavel:
        return templates.TemplateResponse(
            "portal.html",
            {"request": request, "responsavel": None, "alunos_data": []},
        )

    alunos = (
        db.query(Aluno)
        .filter(Aluno.responsavel_id == responsavel.id, Aluno.status == "Ativo")
        .order_by(Aluno.data_cadastro.desc())
        .all()
    )

    alunos_data = []
    for aluno in alunos:
        mensalidades = (
            db.query(Mensalidade)
            .filter(Mensalidade.aluno_id == aluno.id)
            .order_by(Mensalidade.data_criacao.desc())
            .all()
        )
        alunos_data.append({"aluno": aluno, "mensalidades": mensalidades})

    return templates.TemplateResponse(
        "portal.html",
        {
            "request": request,
            "responsavel": responsavel,
            "alunos_data": alunos_data,
        },
    )


@app.patch("/api/mensalidade/{mensalidade_id}/notificar")
async def notificar_pagamento(
    mensalidade_id: int,
    db: Session = Depends(get_db),
):
    mensalidade = db.query(Mensalidade).filter(Mensalidade.id == mensalidade_id).first()

    if not mensalidade:
        return JSONResponse(content={"error": "Mensalidade não encontrada"}, status_code=404)

    mensalidade.status = "Aguardando Conferência"
    db.commit()

    aluno = db.query(Aluno).filter(Aluno.id == mensalidade.aluno_id).first()

    return JSONResponse(
        content={
            "message": "Status atualizado",
            "aluno_nome": aluno.nome_completo,
            "mes_referencia": mensalidade.mes_referencia,
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
