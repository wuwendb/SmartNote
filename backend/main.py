from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, status
from typing import Optional, List
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from zhipuai import ZhipuAI
from dotenv import load_dotenv
from passlib.context import CryptContext
import jwt
import os
import base64
import fitz # PyMuPDF
from pptx import Presentation
import io
import datetime
import uuid
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from fastapi.staticfiles import StaticFiles

load_dotenv()

app = FastAPI(title="NoteSnap AI API")

# ----------- Auth 设置 -----------
SECRET_KEY = "a_very_secret_key_for_demo_purposes"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

# ----------- 数据库设置 -----------
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# 更换新数据库以兼容新增的用户数据表
SQLALCHEMY_DATABASE_URL = "sqlite:///./notes_app_v2.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, default="")
    phone = Column(String, default="")
    avatar_url = Column(String, default="")
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    notes = relationship("NoteRecord", back_populates="owner")

class NoteRecord(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    title = Column(String, default="Untitled Note")
    category = Column(String, default="Default")
    file_url = Column(String)
    style = Column(String)
    content = Column(Text)
    is_public = Column(Boolean, default=False) # 预留功能：社区分享
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="notes")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(String)
    note_id = Column(Integer, ForeignKey("notes.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
# ----------------------------------

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_ai_client():
    load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
    api_key = os.getenv("ZHIPU_API_KEY", "")
    if not api_key or "." not in api_key:
        raise ValueError("请在 backend/.env 文件中配置正确的 ZHIPU_API_KEY (需要包含以 '.' 分隔的 id 和 secret)")
    return ZhipuAI(api_key=api_key)

# ---------- Auth 路由 ----------
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的认证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

from pydantic import BaseModel
class UserCreate(BaseModel):
    username: str
    password: str
    contact: str = "" # Email or Phone

@app.post("/api/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="用户名已被注册")
    hashed_pw = get_password_hash(user.password)
    
    is_email = "@" in user.contact
    new_user = User(
        username=user.username, 
        hashed_password=hashed_pw,
        email=user.contact if is_email else "",
        phone=user.contact if not is_email else ""
    )
    db.add(new_user)
    db.commit()
    return {"message": "注册成功"}

@app.post("/api/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="用户名或密码错误")
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "username": user.username}

@app.get("/api/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username, 
        "id": current_user.id,
        "email": current_user.email,
        "phone": current_user.phone,
        "avatar_url": getattr(current_user, 'avatar_url', '')
    }

class UserUpdateProfile(BaseModel):
    username: str = None
    email: str = None
    phone: str = None
    avatar_url: str = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

@app.post("/api/user/password")
def change_password(data: PasswordChange, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="原密码验证失败，请重试")
    
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"message": "密码修改成功，请重新登录"}

# ---------- 处理逻辑 ----------
def process_image(content: bytes, content_type: str, style: str):
    client = get_ai_client()
    base64_image = base64.b64encode(content).decode("utf-8")
    prompt = f'''你是一个智能笔记整理助手。请按照【{style}】风格，提取以下图片中的文字内容，并将其整理为结构化的Markdown笔记。
要求：
1. 必须在笔记开头单独给出【一句话总结】（加粗标出）；
2. 必须提取【核心关键词】（3-5个，用标签格式，如：#关键词）紧跟在总结下面；
3. 保持原有主体信息准确无误；
4. 为笔记添加合理的标题和章节层级；
5. 对重点内容进行加粗或列表高亮提示；
6. 如果笔记中包含数学公式，请务必使用 $ 包裹行内公式，使用 $$ 包裹块级公式（千万不要使用 \\( \\) 或 \\[ \\]）。'''
    
    response = client.chat.completions.create(
        model="glm-4v",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{content_type};base64,{base64_image}"
                        }
                    }
                ]
            }
        ]
    )
    return response.choices[0].message.content

def process_text(text: str, style: str):
    client = get_ai_client()
    max_chars = 100000
    if len(text) > max_chars:
        text = text[:max_chars] + "\n\n...（⚠️文档过长，超维保护触发，此处后续部分已截断）"

    prompt = f'''你是一个智能笔记整理助手。请按照【{style}】风格，将以下从文档(PPT/PDF)中提取的文本内容，整理为结构化的Markdown笔记。
要求：
1. 必须在笔记开头单独给出【一句话总结】（加粗标出）；
2. 必须提取【核心关键词】（3-5个，用标签格式，如：#关键词）紧跟在总结下面；
3. 保持原有主体信息准确无误；
4. 为笔记添加合理的标题和章节层级；
5. 对重点内容进行加粗或列表高亮提示；
6. 如果笔记中包含数学公式，请务必使用 $ 包裹行内公式，使用 $$ 包裹块级公式（千万不要使用 \\( \\) 或 \\[ \\]）。

原始内容：
{text}'''
    
    response = client.chat.completions.create(
        model="glm-4",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )
    return response.choices[0].message.content

def extract_text_from_pdf(content: bytes):
    text = ""
    with fitz.open(stream=content, filetype="pdf") as doc:
        for page in doc:
            text += page.get_text() + "\n"
    return text

def extract_text_from_pptx(content: bytes):
    prs = Presentation(io.BytesIO(content))
    text = ""
    for slide in prs.slides:
        for shape in slide.shapes:
            if hasattr(shape, "text"):
                text += shape.text + "\n"
    return text

@app.post("/api/process-note")
async def process_note(
    file: UploadFile = File(...), 
    style: str = Form("标准"), 
    category: str = Form("未分类"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    filename = file.filename.lower()
    
    try:
        content = await file.read()
        
        # 1. 保存原图
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join("uploads", unique_filename)
        with open(file_path, "wb") as f:
            f.write(content)
        file_url = f"http://localhost:8000/uploads/{unique_filename}"
        
        # 2. 调用大模型分析
        if file.content_type.startswith("image/"):
            result = process_image(content, file.content_type, style)
        elif filename.endswith(".pdf") or file.content_type == "application/pdf":
            text = extract_text_from_pdf(content)
            if not text.strip():
                raise ValueError("未能在PDF中提取到有效文本")
            result = process_text(text, style)
        elif filename.endswith(".pptx") or "presentation" in file.content_type:
            text = extract_text_from_pptx(content)
            if not text.strip():
                raise ValueError("未能在PPT中提取到有效文本")
            result = process_text(text, style)
        else:
            raise HTTPException(status_code=400, detail="不支持的文件格式。请上传图片、PDF或PPTX。")
            
        # 3. 存入当前用户数据库
        db_note = NoteRecord(filename=file.filename, file_url=file_url, style=style, category=category, content=result, user_id=current_user.id)
        db.add(db_note)
        db.commit()
        db.refresh(db_note)

        return {"note": result, "id": db_note.id, "title": db_note.title, "category": db_note.category, "file_url": file_url}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/notes")
def get_notes(
    skip: int = 0, limit: int = 100, 
    search: str = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = db.query(NoteRecord).filter(NoteRecord.user_id == current_user.id)
    if search:
        query = query.filter(
            (NoteRecord.title.ilike(f"%{search}%")) |
            (NoteRecord.content.ilike(f"%{search}%"))
        )
    notes = query.order_by(NoteRecord.created_at.desc()).offset(skip).limit(limit).all()
    result = []
    for n in notes:
        result.append({
            "id": n.id,
            "filename": n.filename,
            "title": n.title,
            "category": n.category,
            "created_at": n.created_at.isoformat(),
            "content": n.content,
            "file_url": n.file_url,
            "style": n.style,
            "is_public": n.is_public
        })
    return result

@app.get("/api/community/notes")
def get_community_notes(search: str = None, db: Session = Depends(get_db)):
    # 获取分享的笔记
    query = db.query(NoteRecord).filter(NoteRecord.is_public == True)
    if search:
        query = query.filter(
            (NoteRecord.title.ilike(f"%{search}%")) |
            (NoteRecord.content.ilike(f"%{search}%"))
        )
    notes = query.order_by(NoteRecord.created_at.desc()).limit(50).all()
    result = []
    for n in notes:
        result.append({
            "id": n.id,
            "filename": n.filename,
            "title": n.title,
            "category": n.category,
            "created_at": n.created_at.isoformat(),
            "content": n.content[:200] + "...", # 社区只返回摘要
            "style": n.style,
            "author": n.owner.username if n.owner else "匿名用户"
        })
    return result

@app.get("/api/community/notes/{note_id}")
def get_community_note_detail(note_id: int, db: Session = Depends(get_db)):
    # 允许社区内获取单篇公开笔记全文
    note = db.query(NoteRecord).filter(NoteRecord.id == note_id, NoteRecord.is_public == True).first()
    if not note:
        raise HTTPException(status_code=404, detail="未找到该分享笔记信息。")
    return {
        "id": note.id,
        "filename": note.filename,
        "title": note.title,
        "category": note.category,
        "created_at": note.created_at.isoformat(),
        "content": note.content,
        "style": note.style,
        "author": note.owner.username if note.owner else "匿名用户"
    }

@app.patch("/api/notes/{note_id}/public")
def toggle_public(note_id: int, is_public: bool, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    note = db.query(NoteRecord).filter(NoteRecord.id == note_id, NoteRecord.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="笔记找不到了或无操作权限")
    note.is_public = is_public
    db.commit()
    return {"message": "鐘舵€佹洿鏂版垚鍔?", "is_public": note.is_public}

class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None

@app.post("/api/notes/{note_id}/comments")
def add_comment(note_id: int, comment: CommentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_note = db.query(NoteRecord).filter(NoteRecord.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="绗旇涓嶅瓨鍦¨")
    
    new_comment = Comment(
        content=comment.content,
        note_id=note_id,
        user_id=current_user.id,
        parent_id=comment.parent_id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    return {
        "id": new_comment.id,
        "content": new_comment.content,
        "created_at": new_comment.created_at.isoformat(),
        "author": current_user.username,
        "author_avatar": getattr(current_user, 'avatar_url', ''),
        "parent_id": new_comment.parent_id
    }

@app.get("/api/notes/{note_id}/comments")
def get_comments(note_id: int, db: Session = Depends(get_db)):
    db_note = db.query(NoteRecord).filter(NoteRecord.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="绗旇涓嶅瓨鍦¨")
        
    comments = db.query(Comment).filter(Comment.note_id == note_id).order_by(Comment.created_at.asc()).all()
    result = []
    
    # Pre-fetch user dictionary for performance and easy reply_to mapping
    users_dict = {u.id: {"username": u.username, "avatar_url": getattr(u, 'avatar_url', '')} for u in db.query(User).all()}
    
    for c in comments:
        user_info = users_dict.get(c.user_id, {"username": "匿名", "avatar_url": ""})
        result.append({
            "id": c.id,
            "content": c.content,
            "created_at": c.created_at.isoformat(),
            "author": user_info["username"],
            "author_avatar": user_info["avatar_url"],
            "parent_id": c.parent_id
        })
    return result

class NoteUpdate(BaseModel):
    title: str = None
    content: str = None
    category: str = None

@app.put("/api/notes/{note_id}")
def update_note(note_id: int, note_update: NoteUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_note = db.query(NoteRecord).filter(NoteRecord.id == note_id, NoteRecord.user_id == current_user.id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="笔记找不到了或无操作权限")
    
    if note_update.title is not None:
        db_note.title = note_update.title
    if note_update.content is not None:
        db_note.content = note_update.content
    if note_update.category is not None:
        db_note.category = note_update.category
        
    db.commit()
    return {"message": "笔记已保存"}


@app.put("/api/me")
def update_user_profile(profile_data: UserUpdateProfile, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if profile_data.username and profile_data.username != current_user.username:
        existing = db.query(User).filter(User.username == profile_data.username).first()
        if existing:
            raise HTTPException(status_code=400, detail="鐢ㄦ埛鍚嶅凡瀛樺湪")
        current_user.username = profile_data.username
    if profile_data.email is not None:
        current_user.email = profile_data.email
    if profile_data.phone is not None:
        current_user.phone = profile_data.phone
    if profile_data.avatar_url is not None:
        current_user.avatar_url = profile_data.avatar_url
    
    db.commit()
    db.refresh(current_user)
    return {
        "username": current_user.username, 
        "id": current_user.id,
        "email": current_user.email,
        "phone": current_user.phone,
        "avatar_url": getattr(current_user, 'avatar_url', '')
    }

@app.post("/api/user/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        content = await file.read()
        import uuid
        import os
        unique_filename = f"avatar_{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join("uploads", unique_filename)
        with open(file_path, "wb") as f:
            f.write(content)
        file_url = f"http://localhost:8000/uploads/{unique_filename}"
        
        current_user.avatar_url = file_url
        db.commit()
        return {"avatar_url": file_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))







if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
