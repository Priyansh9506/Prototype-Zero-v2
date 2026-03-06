from api.database import SessionLocal
from api.models_db import User
from api.auth import get_password_hash

db = SessionLocal()
user = db.query(User).filter_by(username='testadmin').first()
if not user:
    user = User(
        username='testadmin',
        email='admin@example.com',
        hashed_password=get_password_hash('password123'),
        role='admin',
        is_active=True
    )
    db.add(user)
    db.commit()
    print("User created and verified")
