from sqlalchemy import Column, Integer, String, Boolean, Enum
import enum
from .database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    OFFICER = "officer"
    PENDING = "pending"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default=UserRole.PENDING.value)
    is_active = Column(Boolean, default=True)
