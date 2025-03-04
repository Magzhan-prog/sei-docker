from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from constants import USER, PASSWORD, HOST, PORT, DB

# Конфигурация подключения к PostgreSQL (замените данные подключения на свои)
DATABASE_URL = f"postgresql://{USER}:{PASSWORD}@{HOST}:{PORT}/{DB}"

# Создаем движок подключения к базе данных
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Определяем SQLAlchemy модель для хранения данных
class UserData(Base):
    __tablename__ = "user_folders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)  # Значение user_id будет извлечено из cookie
    name = Column(String, nullable=False)

# Создаем таблицы (если они ещё не существуют)
Base.metadata.create_all(bind=engine)

# Pydantic модель для валидации входящих данных (без user_id)
class UserDataCreate(BaseModel):
    name: str 

router = APIRouter()

@router.post("/save-folder")
def save_folder(data: UserDataCreate, request: Request):
    # Извлекаем user_id из cookie (ожидается, что cookie называется "user_id")
    cookie_user_id = request.cookies.get("user_id")
    if cookie_user_id is None:
        raise HTTPException(status_code=401, detail="Пользователь не аутентифицирован")
    try:
        user_id = int(cookie_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Некорректное значение user_id в cookie")

    db = SessionLocal()
    try:
        # Создаем объект модели для сохранения данных в БД, включая user_id из cookie
        db_data = UserData(
            user_id=user_id,
            name=data.name
        )
        db.add(db_data)
        db.commit()
        db.refresh(db_data)  # Обновляем объект для получения сгенерированного id
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка сохранения данных: {e}")
    finally:
        db.close()

    return {
        "id": db_data.id,
        "name": db_data.name,
        "user_id": db_data.user_id,
        "message": "Данные успешно сохранены"
    }
