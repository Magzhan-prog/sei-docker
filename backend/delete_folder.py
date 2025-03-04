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

# Модель для таблицы папок пользователя (user_folders)
class UserFolder(Base):
    __tablename__ = "user_folders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)  # Извлекается из cookie
    name = Column(String, nullable=False)

# Модель для таблицы с данными пользователя (user_data)
class UserDataRecord(Base):
    __tablename__ = "user_data"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    folder_id = Column(Integer, nullable=True)
    # Другие поля можно добавить по необходимости

# Создаем таблицы, если их еще нет
Base.metadata.create_all(bind=engine)

router = APIRouter()

@router.delete("/delete-folder/{folder_id}")
def delete_folder(folder_id: int, request: Request):
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
        # Проверяем, существуют ли записи в таблице user_data с данным folder_id и user_id
        record = db.query(UserDataRecord).filter(
            UserDataRecord.folder_id == folder_id,
            UserDataRecord.user_id == user_id
        ).first()
        if record:
            raise HTTPException(
                status_code=400,
                detail="Папка не может быть удалена, так как она связана с данными пользователя"
            )
        
        # Находим папку в таблице user_folders
        folder = db.query(UserFolder).filter(
            UserFolder.id == folder_id,
            UserFolder.user_id == user_id
        ).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Папка не найдена")
        
        db.delete(folder)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка удаления папки: {e}")
    finally:
        db.close()
    
    return {"message": "Папка успешно удалена"}
