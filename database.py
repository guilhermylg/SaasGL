from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

CONNECTION_STRING = (
    "mssql+pyodbc://sa:SuaSenhaForte123@localhost/AthleticExcellence"
    "?driver=ODBC+Driver+17+for+SQL+Server"
    "&TrustServerCertificate=yes"
)

engine = create_engine(CONNECTION_STRING, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
