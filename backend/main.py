#!/usr/bin/env python3
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import uuid
import random
import string
import os
import shutil
import sqlite3
from datetime import datetime
from contextlib import contextmanager

DB_PATH = '/tmp/piggy_home.db'
UPLOAD_DIR = '/tmp/uploads'
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title='小猪管家API', version='2.0.0')
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        conn.execute('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, nickname TEXT NOT NULL, role TEXT DEFAULT "member", family_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)')
        conn.execute('CREATE TABLE IF NOT EXISTS families (id TEXT PRIMARY KEY, name TEXT NOT NULL, invite_code TEXT UNIQUE NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)')
        conn.execute('CREATE TABLE IF NOT EXISTS dishes (id TEXT PRIMARY KEY, family_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT, category TEXT NOT NULL, image TEXT, is_available INTEGER DEFAULT 1, created_by TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)')
        conn.execute('CREATE TABLE IF NOT EXISTS selected_dishes (id TEXT PRIMARY KEY, dish_id TEXT NOT NULL, dish_name TEXT NOT NULL, family_id TEXT NOT NULL, selected_by TEXT NOT NULL, selected_by_name TEXT NOT NULL, quantity INTEGER DEFAULT 1, note TEXT, selected_at TEXT NOT NULL)')
        conn.commit()
    print('数据库初始化完成')

init_db()

class CreateFamilyRequest(BaseModel):
    family_name: str
    admin_nickname: str

class JoinFamilyRequest(BaseModel):
    invite_code: str
    nickname: str

class CreateDishRequest(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    image: Optional[str] = None

def generate_id():
    return str(uuid.uuid4())

def generate_invite_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def get_timestamp():
    return datetime.now().isoformat()

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail='未提供认证信息')
    token = authorization[7:] if authorization.startswith('Bearer ') else authorization
    user_id = token[6:] if token.startswith('token_') else token
    with get_db() as conn:
        row = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=401, detail='用户不存在')
        return dict(row)

@app.post('/api/families/create')
async def create_family(data: CreateFamilyRequest):
    family_id = generate_id()
    user_id = generate_id()
    invite_code = generate_invite_code()
    timestamp = get_timestamp()
    with get_db() as conn:
        conn.execute('INSERT INTO families (id, name, invite_code, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', 
                    (family_id, data.family_name, invite_code, user_id, timestamp, timestamp))
        conn.execute('INSERT INTO users (id, nickname, role, family_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', 
                    (user_id, data.admin_nickname, 'admin', family_id, timestamp, timestamp))
        conn.commit()
        family = conn.execute('SELECT * FROM families WHERE id = ?', (family_id,)).fetchone()
        user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    return {'user': dict(user), 'family': dict(family), 'accessToken': f'token_{user_id}'}

@app.post('/api/families/join')
async def join_family(data: JoinFamilyRequest):
    with get_db() as conn:
        family = conn.execute('SELECT * FROM families WHERE invite_code = ?', (data.invite_code.upper(),)).fetchone()
        if not family:
            raise HTTPException(status_code=404, detail='邀请码无效')
        family_id = family['id']
        user_id = generate_id()
        timestamp = get_timestamp()
        conn.execute('INSERT INTO users (id, nickname, role, family_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', 
                    (user_id, data.nickname, 'member', family_id, timestamp, timestamp))
        conn.commit()
        user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    return {'user': dict(user), 'family': dict(family), 'accessToken': f'token_{user_id}'}

@app.get('/api/families/members')
async def get_members(user: dict = Depends(get_current_user)):
    family_id = user.get('family_id')
    if not family_id:
        raise HTTPException(status_code=400, detail='用户未加入家庭')
    with get_db() as conn:
        rows = conn.execute('SELECT * FROM users WHERE family_id = ?', (family_id,)).fetchall()
    return {'members': [{'user': dict(row), 'joined_at': row['created_at']} for row in rows]}

@app.get('/api/dishes')
async def get_dishes(user: dict = Depends(get_current_user), category: Optional[str] = None):
    family_id = user.get('family_id')
    if not family_id:
        raise HTTPException(status_code=400, detail='用户未加入家庭')
    with get_db() as conn:
        if category and category != 'all':
            rows = conn.execute('SELECT * FROM dishes WHERE family_id = ? AND category = ? AND is_available = 1', (family_id, category)).fetchall()
        else:
            rows = conn.execute('SELECT * FROM dishes WHERE family_id = ? AND is_available = 1', (family_id,)).fetchall()
    return {'dishes': [dict(row) for row in rows]}

@app.post('/api/dishes')
async def create_dish(data: CreateDishRequest, user: dict = Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='只有管理员可以创建菜谱')
    family_id = user.get('family_id')
    if not family_id:
        raise HTTPException(status_code=400, detail='用户未加入家庭')
    dish_id = generate_id()
    timestamp = get_timestamp()
    with get_db() as conn:
        conn.execute('INSERT INTO dishes (id, family_id, name, description, category, image, is_available, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)', 
                    (dish_id, family_id, data.name, data.description, data.category, data.image, user['id'], timestamp, timestamp))
        conn.commit()
        dish = conn.execute('SELECT * FROM dishes WHERE id = ?', (dish_id,)).fetchone()
    return {'dish': dict(dish)}

@app.delete('/api/dishes/{dish_id}')
async def delete_dish(dish_id: str, user: dict = Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='只有管理员可以删除菜谱')
    with get_db() as conn:
        conn.execute('DELETE FROM dishes WHERE id = ?', (dish_id,))
        conn.commit()
    return {'success': True}

@app.post('/api/upload/image')
async def upload_image(file: UploadFile = File(...)):
    file_ext = os.path.splitext(file.filename)[1] if file.filename else '.jpg'
    file_name = f'{uuid.uuid4().hex}{file_ext}'
    file_path = os.path.join(UPLOAD_DIR, file_name)
    with open(file_path, 'wb') as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {'success': True, 'url': f'/api/images/{file_name}'}

@app.get('/api/images/{file_name}')
async def get_image(file_name: str):
    file_path = os.path.join(UPLOAD_DIR, file_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail='图片不存在')
    return FileResponse(file_path)


# ==================== 用户注册/登录API ====================

class RegisterRequest(BaseModel):
    username: str
    password: str
    nickname: str

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post('/api/auth/register')
async def register(data: RegisterRequest):
    '''用户注册'''
    with get_db() as conn:
        # 检查用户名是否已存在
        existing = conn.execute('SELECT * FROM users WHERE nickname = ?', (data.username,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail='用户名已存在')
        
        user_id = generate_id()
        timestamp = get_timestamp()
        
        # 创建用户（未加入家庭）
        conn.execute('INSERT INTO users (id, nickname, role, family_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', 
                    (user_id, data.nickname, 'member', None, timestamp, timestamp))
        conn.commit()
        
        user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    
    return {'user': dict(user), 'accessToken': f'token_{user_id}'}

@app.post('/api/auth/login')
async def login(data: LoginRequest):
    '''用户登录'''
    with get_db() as conn:
        # 这里简化处理，实际应该验证密码
        user = conn.execute('SELECT * FROM users WHERE nickname = ?', (data.username,)).fetchone()
        if not user:
            raise HTTPException(status_code=401, detail='用户名或密码错误')
    
    return {'user': dict(user), 'accessToken': f'token_{user["id"]}'}



if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=18002)