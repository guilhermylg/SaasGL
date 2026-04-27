from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Date, DateTime, Text, Numeric, ForeignKey
)
from sqlalchemy.orm import relationship
from database import Base


class Responsavel(Base):
    __tablename__ = "Responsaveis"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome_completo = Column(String(150), nullable=False)
    cpf = Column(String(14), unique=True, nullable=False)
    whatsapp = Column(String(20), nullable=False)
    data_cadastro = Column(DateTime, default=datetime.now)

    alunos = relationship("Aluno", back_populates="responsavel")


class Aluno(Base):
    __tablename__ = "Alunos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    responsavel_id = Column(Integer, ForeignKey("Responsaveis.id"), nullable=False)
    nome_completo = Column(String(150), nullable=False)
    data_nascimento = Column(Date, nullable=False)
    categoria = Column(String(50))
    informacoes_medicas = Column(Text, nullable=True)
    status = Column(String(20), default="Lead")
    data_cadastro = Column(DateTime, default=datetime.now)

    responsavel = relationship("Responsavel", back_populates="alunos")
    mensalidades = relationship("Mensalidade", back_populates="aluno")


class Mensalidade(Base):
    __tablename__ = "Mensalidades"

    id = Column(Integer, primary_key=True, autoincrement=True)
    aluno_id = Column(Integer, ForeignKey("Alunos.id"), nullable=False)
    mes_referencia = Column(String(7))
    valor = Column(Numeric(10, 2), nullable=False)
    data_vencimento = Column(Date, nullable=False)
    status = Column(String(30), default="Pendente")
    data_criacao = Column(DateTime, default=datetime.now)

    aluno = relationship("Aluno", back_populates="mensalidades")
