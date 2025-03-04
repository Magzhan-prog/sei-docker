from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import List
from constants import USER, PASSWORD, HOST, PORT, DB

# Замените параметры подключения на свои
DATABASE_URL = f"postgresql://{USER}:{PASSWORD}@{HOST}:{PORT}/{DB}"

# Создаем движок подключения к базе данных
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# SQLAlchemy-модель для хранения данных
class UserData(Base):
    __tablename__ = "user_folders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)  # Берется из cookie
    name = Column(String, nullable=False)

# Создаем таблицы, если они ещё не существуют
Base.metadata.create_all(bind=engine)

# Pydantic модель для вывода данных
class UserDataOut(BaseModel):
    id: int
    user_id: int
    name: str 

    class Config:
        orm_mode = True

router = APIRouter()

# Эндпоинт для получения данных для текущего пользователя (user_id из cookie)
@router.get("/get-user-folders", 
    tags=["Battle"],
    response_model=List[UserDataOut])
def get_user_folders(request: Request):
    cookie_user_id = request.cookies.get("user_id")
    if cookie_user_id is None:
        raise HTTPException(status_code=401, detail="Пользователь не аутентифицирован")
    try:
        user_id = int(cookie_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Некорректное значение user_id в cookie")
    
    db = SessionLocal()
    try:
        records = db.query(UserData).filter(UserData.user_id == user_id).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения данных: {e}")
    finally:
        db.close()
    
    return records