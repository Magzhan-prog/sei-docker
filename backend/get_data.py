from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import List, Optional
from constants import USER, PASSWORD, HOST, PORT, DB

# Параметры подключения к базе данных
DATABASE_URL = f"postgresql://{USER}:{PASSWORD}@{HOST}:{PORT}/{DB}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# SQLAlchemy-модель для хранения данных
class UserData(Base):
    __tablename__ = "user_data"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)  # Берется из cookie
    p_index_id = Column(Integer, nullable=False)
    p_period_id = Column(Integer, nullable=False)
    p_terms = Column(String, nullable=False)
    p_term_id = Column(Integer, nullable=False)
    p_dicIds = Column(String, nullable=False)   # Храним как строку
    idx = Column(Integer, nullable=False)
    chart_type = Column(String, nullable=False)
    selected_data = Column(String, nullable=False)
    primary_data = Column(String, nullable=False)
    folder_id = Column(Integer, nullable=True)   # folder_id может быть null

# Создаем таблицы, если они ещё не существуют
Base.metadata.create_all(bind=engine)

# Pydantic модель для вывода данных
class UserDataOut(BaseModel):
    id: int
    user_id: int
    p_index_id: int
    p_period_id: int
    p_terms: str
    p_term_id: int
    p_dicIds: str
    idx: int
    chart_type: str
    selected_data: str
    primary_data: str 
    folder_id: Optional[int] = None  # Значение по умолчанию None соответствует null

    class Config:
        orm_mode = True

router = APIRouter()

# Эндпоинт для получения данных текущего пользователя с возможностью фильтрации по folder_id
@router.get("/get-data", response_model=List[UserDataOut])
def get_data(request: Request, folder_id: Optional[int] = None):
    cookie_user_id = request.cookies.get("user_id")
    if cookie_user_id is None:
        raise HTTPException(status_code=401, detail="Пользователь не аутентифицирован")
    try:
        user_id = int(cookie_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Некорректное значение user_id в cookie")
    
    db = SessionLocal()
    try:
        query = db.query(UserData).filter(UserData.user_id == user_id)
        if folder_id is not None:
            query = query.filter(UserData.folder_id == folder_id)
        records = query.all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения данных: {e}")
    finally:
        db.close()
    
    return records
