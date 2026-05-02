from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, Integer, Text, ForeignKey, JSON, DateTime, Boolean
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.sql import func
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional
import os
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, File, Form
from dotenv import load_dotenv

load_dotenv()

# 1. Cloudinary Configuration
cloudinary.config( 
  cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"), 
  api_key = os.getenv("CLOUDINARY_API_KEY"), 
  api_secret = os.getenv("CLOUDINARY_API_SECRET"),
  secure = True
)
 
 
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(
    DATABASE_URL,
    
    pool_pre_ping=True,       
    pool_recycle=300          
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
 
 

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True) # This will store the Google 'sub' (unique ID)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    image = Column(String)
    preferences = Column(JSON, server_default='[]')
    admin_of_club_id = Column(Integer, ForeignKey("clubs.id"), nullable=True)
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

class ClubFollower(Base):
    __tablename__ = "club_followers"
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), primary_key=True)

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

 

app = FastAPI(title="ClubMonkey API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001", 
        "http://localhost:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3000"
    ],
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

 
class GoogleAuthRequest(BaseModel):
    token: str

class PostResponse(BaseModel):
    id: int
    club_id: int
    content: str
    image_url: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

class UserSchema(BaseModel):
    id: str
    name: str
    email: str
    image: Optional[str] = None
    preferences: List[str] = []
    admin_of_club_id: Optional[int] = None 
    created_at: datetime 
    class Config:
        from_attributes = True

 
class UserCreate(BaseModel):
    id: str
    name: str
    email: str
    password: str  

class ClubSchema(BaseModel):
    id: int
    name: str
    description: Optional[str]
    logo_url: Optional[str]
    primary_color: str
    accent_color: str
    tags: List[str] = []
    class Config:
        from_attributes = True

class PostSchema(BaseModel):
    id: int
    club_id: int
    content: str
    image_url: Optional[str]
    created_at: datetime 
    class Config:
        from_attributes = True

class FeedPostResponse(BaseModel):
    id: int
    club_id: int
    content: str
    image_url: Optional[str]
    created_at: datetime
    club_name: str
    club_logo_url: Optional[str]
    club_accent_color: str
    class Config:
        from_attributes = True

class PreferencesUpdate(BaseModel):
    user_id: str
    interests: List[str]

@app.get("/")
async def health_check():
    return {"status": "online", "timestamp": datetime.now()}

# Initialize Firebase Admin (Only once)
if not firebase_admin._apps:
    # Use default credentials or download service-account.json from Firebase Console
    cred = credentials.Certificate("service-account.json") 
    firebase_admin.initialize_app(cred)

# 1. Update the mapping (Email -> Club ID)
ADMIN_MAPPING = {
    "teamdopameme@gmail.com": 1,        # Manages Club with ID 1
    "sambhavvinay20054@gmail.com": 2    # Manages Club with ID 2
}


# 3. The Upload Endpoint
@app.post("/clubs/{club_id}/posts", response_model=PostResponse)
async def create_post(
    club_id: int,
    content: str = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    url = None
    if image:
        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(image.file)
        url = upload_result.get("secure_url")

    new_post = Post(
        club_id=club_id,
        content=content,
        image_url=url
    )
    
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

@app.get("/posts", response_model=List[FeedPostResponse])
def get_all_posts(db: Session = Depends(get_db)):
    """Fetch all posts from all clubs with club metadata."""
    results = db.query(
        Post.id,
        Post.club_id,
        Post.content,
        Post.image_url,
        Post.created_at,
        Club.name.label("club_name"),
        Club.logo_url.label("club_logo_url"),
        Club.accent_color.label("club_accent_color")
    ).join(Club, Post.club_id == Club.id).order_by(Post.created_at.desc()).all()
    
    return results

@app.delete("/posts/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Optional: Delete image from Cloudinary if it exists
    if post.image_url:
        try:
            # Extract public_id from URL: http://.../v12345/public_id.jpg
            public_id = post.image_url.split('/')[-1].split('.')[0]
            cloudinary.uploader.destroy(public_id)
        except Exception as e:
            print(f"Failed to delete image from Cloudinary: {e}")

    db.delete(post)
    db.commit()
    return {"message": "Post deleted successfully"}

@app.post("/auth/google", response_model=UserSchema)
def google_auth(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        # Verify using Firebase Admin
        decoded_token = firebase_auth.verify_id_token(data.token, clock_skew_seconds=10)
    except Exception as e:
        print(f"Firebase token verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Firebase Token: {str(e)}"
        )

    try:
        
        google_id = decoded_token['uid']
        email = decoded_token['email'].lower() # Consistency is key
        name = decoded_token.get('name', 'User')
        picture = decoded_token.get('picture')

        # Check whitelist
        assigned_club_id = ADMIN_MAPPING.get(email)

        # Query existing user
        user = db.query(User).filter(User.email == email).first()

        if not user:
            # Create new user
            user = User(
                id=google_id,
                name=name,
                email=email,
                image=picture,
                preferences=[],
                admin_of_club_id=assigned_club_id 
            )
            db.add(user)
        else:
            # IMPORTANT: Update admin status for existing users 
            # in case they were added to the whitelist later
            user.admin_of_club_id = assigned_club_id
        
        db.commit()
        db.refresh(user)
        
        return user

    except OperationalError as e:
        db.rollback()
        print(f"Database operational error during auth: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed while signing in. Please try again."
        )
    except SQLAlchemyError as e:
        db.rollback()
        print(f"Database error during auth: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while signing in."
        )
    except Exception as e:
        db.rollback()
        print(f"Unexpected auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error while signing in."
        )


@app.get("/users", response_model=List[UserSchema])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@app.get("/clubs", response_model=List[ClubSchema])
def get_clubs(db: Session = Depends(get_db)):
    return db.query(Club).all()



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
     
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.preferences:
         
        return db.query(Club).all()
    
    user_prefs = set(user.preferences)
    all_clubs = db.query(Club).all()
    
    recommended = []
    for club in all_clubs:
         
        club_tags = set(club.tags) if club.tags else set()
        if user_prefs.intersection(club_tags):
            recommended.append(club)
            
    return recommended

@app.get("/clubs/{club_id}")
def get_club_details(club_id: int, db: Session = Depends(get_db)):
     
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    
     
    # Count followers
    follower_count = db.query(ClubFollower).filter(ClubFollower.club_id == club_id).count()
    club_posts = db.query(Post).filter(Post.club_id == club_id).order_by(Post.created_at.desc()).all()
    
    # Find the admin user
    admin_user = db.query(User).filter(User.admin_of_club_id == club_id).first()
    admin_info = None
    if admin_user:
        admin_info = {
            "name": admin_user.name,
            "email": admin_user.email,
            "image": admin_user.image
        }

    return {
        "club": club,
        "posts": club_posts,
        "follower_count": follower_count,
        "admin": admin_info
    }
class FollowRequest(BaseModel):
    user_id: str
    club_id: int

@app.post("/clubs/follow")
def follow_club(data: FollowRequest, db: Session = Depends(get_db)):
    existing = db.query(ClubFollower).filter(
        ClubFollower.user_id == data.user_id, 
        ClubFollower.club_id == data.club_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "Unfollowed", "following": False}
    
    new_follow = ClubFollower(user_id=data.user_id, club_id=data.club_id)
    db.add(new_follow)
    db.commit()
    return {"message": "Followed", "following": True}

class ProjectCreate(BaseModel):
    author_id: str
    title: str
    description: str
    requirements: List[str]

class ProjectSchema(BaseModel):
    id: int
    author_id: str
    title: str
    description: str
    requirements: List[str]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


@app.get("/allprojects", response_model=List[ProjectSchema]) 
def get_all_projects(db: Session = Depends(get_db)):
     
    all_projects = db.query(Project).all()
    return all_projects

@app.get("/projects/{project_id}")
def get_project_details(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    author = db.query(User).filter(User.id == project.author_id).first()
    
     
    return {
        "project": {
            "id": project.id,
            "author_id": project.author_id,
            "title": project.title,
            "description": project.description,
            "requirements": project.requirements,
            "status": project.status,
            "created_at": project.created_at
        },
        "author_name": author.name if author else "Unknown"
    }

@app.post("/projects", response_model=None)  
def upload_project(project_data: ProjectCreate, db: Session = Depends(get_db)):
     
    new_project = Project(
        author_id=project_data.author_id,
        title=project_data.title,
        description=project_data.description,
        requirements=project_data.requirements,
        status="open"  
    )
    
    try:
        db.add(new_project)
        db.commit()
        db.refresh(new_project)
        return new_project
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
 

@app.post("/projects/join")
def join_project(user_id: str, project_id: int, db: Session = Depends(get_db)):
     
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    
    existing_collab = db.query(ProjectCollaborator).filter(
        ProjectCollaborator.user_id == user_id,
        ProjectCollaborator.project_id == project_id
    ).first()
    
    if existing_collab:
        raise HTTPException(status_code=400, detail="You are already collaborating on this project")

     
    new_collaboration = ProjectCollaborator(
        user_id=user_id,
        project_id=project_id
    )

    try:
        db.add(new_collaboration)
        db.commit()
        return {"message": "Successfully joined the project team", "project_id": project_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


class ProfileResponse(BaseModel):
    user: UserSchema
    clubs: List[ClubSchema]
    recommended_clubs: List[ClubSchema]
    posted_projects: List[ProjectSchema]
    collaborating_projects: List[ProjectSchema]
    following_count: int
    following_clubs: List[ClubSchema]

    class Config:
        from_attributes = True

@app.get("/profile/{user_id}", response_model=ProfileResponse)
def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

     
    joined_club_ids = db.query(ClubMember.club_id).filter(ClubMember.user_id == user_id).all()
    
    joined_club_ids = [r[0] for r in joined_club_ids]
    my_clubs = db.query(Club).filter(Club.id.in_(joined_club_ids)).all() if joined_club_ids else []

    
    my_projects = db.query(Project).filter(Project.author_id == user_id).all()

     
    collab_project_ids = db.query(ProjectCollaborator.project_id).filter(ProjectCollaborator.user_id == user_id).all()
    collab_project_ids = [r[0] for r in collab_project_ids]
    collab_projects = db.query(Project).filter(Project.id.in_(collab_project_ids)).all() if collab_project_ids else []

    
    user_prefs = set(user.preferences) if user.preferences else set()
    all_clubs = db.query(Club).all()
    recommended = []
    
    for club in all_clubs:
        if club.id in joined_club_ids:
            continue
        club_tags = set(club.tags) if club.tags else set()
        if user_prefs.intersection(club_tags):
            recommended.append(club)

    followed_clubs = db.query(Club).join(ClubFollower).filter(ClubFollower.user_id == user_id).all()

    return {
        "user": user,
        "clubs": my_clubs,
        "recommended_clubs": recommended,
        "posted_projects": my_projects,
        "collaborating_projects": collab_projects,
        "following_count": len(followed_clubs),
        "following_clubs": followed_clubs
    }
    