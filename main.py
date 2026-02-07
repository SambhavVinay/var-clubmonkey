from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, Integer, Text, ForeignKey, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.sql import func
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional
 
# --- DATABASE SETUP ---
DATABASE_URL = "postgresql+psycopg2://neondb_owner:npg_YrsM3yKIRxH0@ep-orange-cell-ah07255h-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
engine = create_engine(
    DATABASE_URL,
    # ADD THESE TWO LINES:
    pool_pre_ping=True,      # Tests the connection before every query
    pool_recycle=300         # Refreshes the connection every 5 minutes
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
 
# --- MODELS ---

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    password = Column(String) # <--- Add this
    image = Column(String)
    preferences = Column(JSON, server_default='[]')
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Club(Base):
    __tablename__ = "clubs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    logo_url = Column(String)
    primary_color = Column(String, server_default="#121212")
    accent_color = Column(String, server_default="#FF0000")
    tags = Column(JSON, server_default='[]')
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ClubMember(Base):
    __tablename__ = "club_members"
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), primary_key=True)
    role = Column(String, server_default="student")

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"))
    content = Column(Text, nullable=False)
    image_url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(String, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(JSON, server_default='[]')
    status = Column(String, server_default="open")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ProjectCollaborator(Base):
    __tablename__ = "project_collaborators"
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)

# --- APP SETUP ---

app = FastAPI(title="ClubMonkey API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# This is what you send to the frontend
class UserSchema(BaseModel):
    id: str
    name: str
    email: str
    image: Optional[str] = None
    preferences: List[str] = []
    # Change from datetime.datetime to just datetime
    created_at: datetime 
    class Config: from_attributes = True

# This is what you receive from the frontend during Sign Up
class UserCreate(BaseModel):
    id: str
    name: str
    email: str
    password: str # Required for sign up

class ClubSchema(BaseModel):
    id: int
    name: str
    description: Optional[str]
    logo_url: Optional[str]
    primary_color: str
    accent_color: str
    tags: List[str] = []
    class Config: from_attributes = True

class PostSchema(BaseModel):
    id: int
    club_id: int
    content: str
    image_url: Optional[str]
    created_at: datetime 
    class Config: from_attributes = True

class PreferencesUpdate(BaseModel):
    user_id: str
    interests: List[str]

@app.get("/")
async def health_check():
    return {"status": "online", "timestamp": datetime.datetime.now()}

@app.get("/users", response_model=List[UserSchema])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@app.get("/clubs", response_model=List[ClubSchema])
def get_clubs(db: Session = Depends(get_db)):
    return db.query(Club).all()

@app.post("/signup", response_model=UserSchema)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registered"
        )
    
    # SAVE AS PLAIN TEXT
    new_user = User(
        id=user_data.id,
        name=user_data.name,
        email=user_data.email,
        password=user_data.password, # Just the raw string
        image=None,
        preferences=[]
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# Schema for Login request
class UserLogin(BaseModel):
    email: str
    password: str

@app.post("/login", response_model=UserSchema)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    
    # DIRECT STRING COMPARISON
    if not user or user.password != login_data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    return user

@app.put("/users/preferences", response_model=UserSchema)
def update_preferences(data: PreferencesUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.preferences = data.interests
    db.commit()
    db.refresh(user)
    return user


@app.get("/clubs/recommended/{user_id}", response_model=List[ClubSchema])
def get_recommended_clubs(user_id: str, db: Session = Depends(get_db)):
    # Fetch the user's preferences
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.preferences:
        # If no preferences, return all clubs as fallback
        return db.query(Club).all()
    
    user_prefs = set(user.preferences)
    all_clubs = db.query(Club).all()
    
    recommended = []
    for club in all_clubs:
        # Check if there is any intersection between user preferences and club tags
        club_tags = set(club.tags) if club.tags else set()
        if user_prefs.intersection(club_tags):
            recommended.append(club)
            
    return recommended

@app.get("/clubs/{club_id}")
def get_club_details(club_id: int, db: Session = Depends(get_db)):
    # 1. Fetch Club Info
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    
    # 2. Fetch all posts for this club
    club_posts = db.query(Post).filter(Post.club_id == club_id).order_by(Post.created_at.desc()).all()
    
    return {
        "club": club,
        "posts": club_posts
    }