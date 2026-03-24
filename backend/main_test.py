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

DB_PATH = '/tmp/piggy_home_test.db'
UPLOAD_DIR = '/tmp/uploads_test'
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
        conn.commit()
    print('数据库初始化完成')

init_db()

class RegisterRequest(BaseModel):
    username: str
    password: str
    nickname: str

class LoginRequest(BaseModel):
    username: str
    password: str

def generate_id():
    return str(uuid.uuid4())

def get_timestamp():
    return datetime.now().isoformat()

@app.post('/api/auth/register')
async def register(data: RegisterRequest):
    with get_db() as conn:
        existing = conn.execute('SELECT * FROM users WHERE nickname = ?', (data.username,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail='用户名已存在')
        user_id = generate_id()
        timestamp = get_timestamp()
        conn.execute('INSERT INTO users (id, nickname, role, family_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', 
                    (user_id, data.nickname, 'member', None, timestamp, timestamp))
        conn.commit()
        user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    return {'user': dict(user), 'accessToken': f'token_{user_id}'}

@app.post('/api/auth/login')
async def login(data: LoginRequest):
    with get_db() as conn:
        user = conn.execute('SELECT * FROM users WHERE nickname = ?', (data.username,)).fetchone()
        if not user:
            raise HTTPException(status_code=401, detail='用户名或密码错误')
    return {'user': dict(user), 'accessToken': f'token_{user["id"]}'}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=18002)
