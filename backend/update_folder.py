from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from constants import USER, PASSWORD, HOST, PORT, DB

# Конфигурация подключения к PostgreSQL
DATABASE_URL = f"postgresql://{USER}:{PASSWORD}@{HOST}:{PORT}/{DB}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# SQLAlchemy модель для хранения папок пользователя
class UserData(Base):
    __tablename__ = "user_folders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)  # Извлекается из cookie
    name = Column(String, nullable=False)

# Создаем таблицы, если их еще нет
Base.metadata.create_all(bind=engine)

# Pydantic модель для обновления данных папки
class UserDataUpdate(BaseModel):
    name: str

router = APIRouter()

@router.put("/update-folder/{folder_id}")
def update_folder(folder_id: int, data: UserDataUpdate, request: Request):
    # Извлекаем user_id из cookie
    cookie_user_id = request.cookies.get("user_id")
    if not cookie_user_id:
        raise HTTPException(status_code=401, detail="Пользователь не аутентифицирован")
    try:
        user_id = int(cookie_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Некорректное значение user_id в cookie")
    
    db = SessionLocal()
    try:
        # Находим папку по id и проверяем, что она принадлежит текущему пользователю
        folder = db.query(UserData).filter(
            UserData.id == folder_id,
            UserData.user_id == user_id
        ).first()
        
        if not folder:
            raise HTTPException(status_code=404, detail="Папка не найдена")
        
        # Обновляем имя папки
        folder.name = data.name
        db.commit()
        db.refresh(folder)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка обновления папки: {e}")
    finally:
        db.close()
    
    return {
        "id": folder.id,
        "name": folder.name,
        "user_id": folder.user_id,
        "message": "Папка успешно обновлена"
    }
