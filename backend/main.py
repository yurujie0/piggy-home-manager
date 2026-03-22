#!/usr/bin/env python3
"""
小猪管家后端API服务
基于FastAPI，端口18001
"""

from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
import random
import string
import os
import shutil
from datetime import datetime

# 上传文件存储目录
UPLOAD_DIR = "/tmp/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="小猪管家API", version="1.0.0")

# 转换snake_case为camelCase
def to_camel_case(snake_str: str) -> str:
    components = snake_str.split('_')
    return components[0] + ''.join(x.capitalize() for x in components[1:])

def convert_keys_to_camel_case(data: Any) -> Any:
    """递归转换字典的key为camelCase"""
    if isinstance(data, dict):
        return {to_camel_case(k): convert_keys_to_camel_case(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_keys_to_camel_case(item) for item in data]
    else:
        return data

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 内存数据存储（生产环境应使用数据库）
families_db = {}
users_db = {}
dishes_db = {}
selected_dishes_db = {}

# ==================== 数据模型 ====================

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

class SelectDishRequest(BaseModel):
    dish_id: str
    quantity: int
    note: Optional[str] = None

class UpdateMemberRoleRequest(BaseModel):
    user_id: str
    new_role: str

# ==================== 工具函数 ====================

def generate_id():
    return str(uuid.uuid4())

def generate_invite_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

# ==================== 认证API ====================

@app.post("/api/families/create")
async def create_family(data: CreateFamilyRequest):
    """创建家庭，注册者为管理员"""
    family_id = generate_id()
    user_id = generate_id()
    invite_code = generate_invite_code()
    timestamp = datetime.now().isoformat()
    
    family = {
        "id": family_id,
        "name": data.family_name,
        "invite_code": invite_code,
        "created_by": user_id,
        "created_at": timestamp,
        "updated_at": timestamp
    }
    
    user = {
        "id": user_id,
        "nickname": data.admin_nickname,
        "role": "admin",
        "family_id": family_id,
        "created_at": timestamp,
        "updated_at": timestamp
    }
    
    families_db[family_id] = family
    users_db[user_id] = user
    
    return {
        "user": {
            "id": user_id,
            "nickname": data.admin_nickname,
            "role": "admin",
            "familyId": family_id,
            "createdAt": timestamp,
            "updatedAt": timestamp
        },
        "family": {
            "id": family_id,
            "name": data.family_name,
            "inviteCode": invite_code,
            "createdBy": user_id,
            "createdAt": timestamp,
            "updatedAt": timestamp
        },
        "accessToken": f"token_{user_id}"
    }

@app.post("/api/families/join")
async def join_family(data: JoinFamilyRequest):
    """通过邀请码加入家庭"""
    # 查找家庭
    family = None
    for f in families_db.values():
        if f["invite_code"] == data.invite_code.upper():
            family = f
            break
    
    if not family:
        raise HTTPException(status_code=404, detail="邀请码无效")
    
    user_id = generate_id()
    timestamp = datetime.now().isoformat()
    
    user = {
        "id": user_id,
        "nickname": data.nickname,
        "role": "member",
        "family_id": family["id"],
        "created_at": timestamp,
        "updated_at": timestamp
    }
    
    users_db[user_id] = user
    
    return {
        "user": {
            "id": user_id,
            "nickname": data.nickname,
            "role": "member",
            "familyId": family["id"],
            "createdAt": timestamp,
            "updatedAt": timestamp
        },
        "family": {
            "id": family["id"],
            "name": family["name"],
            "inviteCode": family["invite_code"],
            "createdBy": family["created_by"],
            "createdAt": family["created_at"],
            "updatedAt": timestamp
        },
        "accessToken": f"token_{user_id}"
    }

# ==================== 家庭API ====================

@app.get("/api/families/members")
async def get_members(family_id: Optional[str] = None):
    """获取家庭成员列表"""
    members = []
    for user in users_db.values():
        if family_id and user.get("family_id") == family_id:
            members.append({"user": user, "joined_at": user["created_at"]})
    return {"members": members}

@app.get("/api/families/invite-code")
async def get_invite_code(family_id: str):
    """获取家庭邀请码"""
    family = families_db.get(family_id)
    if not family:
        raise HTTPException(status_code=404, detail="家庭不存在")
    return {"invite_code": family["invite_code"]}

@app.post("/api/families/invite-code/refresh")
async def refresh_invite_code(family_id: str):
    """刷新邀请码"""
    family = families_db.get(family_id)
    if not family:
        raise HTTPException(status_code=404, detail="家庭不存在")
    
    new_code = generate_invite_code()
    family["invite_code"] = new_code
    family["updated_at"] = datetime.now().isoformat()
    
    return {"invite_code": new_code}

# ==================== 菜谱API ====================

@app.get("/api/dishes")
async def get_dishes(family_id: Optional[str] = None, category: Optional[str] = None):
    """获取菜谱列表"""
    dishes = []
    for dish in dishes_db.values():
        if family_id and dish.get("family_id") != family_id:
            continue
        if category and category != "all" and dish.get("category") != category:
            continue
        dishes.append(dish)
    return {"dishes": dishes}

@app.post("/api/dishes")
async def create_dish(data: CreateDishRequest, family_id: str, user_id: str):
    """创建菜谱（管理员）"""
    dish_id = generate_id()
    timestamp = datetime.now().isoformat()
    
    dish = {
        "id": dish_id,
        "family_id": family_id,
        "name": data.name,
        "description": data.description,
        "category": data.category,
        "image": data.image,
        "is_available": True,
        "created_by": user_id,
        "created_at": timestamp,
        "updated_at": timestamp
    }
    
    dishes_db[dish_id] = dish
    return {"dish": dish}

@app.put("/api/dishes/{dish_id}")
async def update_dish(dish_id: str, data: dict):
    """更新菜谱"""
    dish = dishes_db.get(dish_id)
    if not dish:
        raise HTTPException(status_code=404, detail="菜谱不存在")
    
    for key, value in data.items():
        if value is not None:
            dish[key] = value
    
    dish["updated_at"] = datetime.now().isoformat()
    return {"dish": dish}

@app.delete("/api/dishes/{dish_id}")
async def delete_dish(dish_id: str):
    """删除菜谱"""
    if dish_id not in dishes_db:
        raise HTTPException(status_code=404, detail="菜谱不存在")
    del dishes_db[dish_id]
    return {"success": True}

# ==================== 点餐API ====================

@app.get("/api/orders/today")
async def get_selected_dishes(family_id: Optional[str] = None):
    """获取今日已选菜品"""
    selected = []
    for sd in selected_dishes_db.values():
        if family_id and sd.get("family_id") == family_id:
            selected.append(sd)
    return {"selectedDishes": selected}

@app.post("/api/orders/select")
async def select_dish(data: SelectDishRequest, family_id: str, user_id: str, user_name: str):
    """选择菜品"""
    dish = dishes_db.get(data.dish_id)
    if not dish:
        raise HTTPException(status_code=404, detail="菜谱不存在")
    
    selected_id = generate_id()
    timestamp = datetime.now().isoformat()
    
    selected = {
        "id": selected_id,
        "dish_id": data.dish_id,
        "dish_name": dish["name"],
        "family_id": family_id,
        "selected_by": user_id,
        "selected_by_name": user_name,
        "quantity": data.quantity,
        "note": data.note,
        "selected_at": timestamp
    }
    
    selected_dishes_db[selected_id] = selected
    return {"selected_dish": selected}

@app.put("/api/orders/selected/{selected_id}")
async def update_selected_quantity(selected_id: str, quantity: int):
    """更新已选菜品数量"""
    selected = selected_dishes_db.get(selected_id)
    if not selected:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    selected["quantity"] = quantity
    return {"selected_dish": selected}

@app.delete("/api/orders/selected/{selected_id}")
async def unselect_dish(selected_id: str):
    """取消选择菜品"""
    if selected_id not in selected_dishes_db:
        raise HTTPException(status_code=404, detail="记录不存在")
    del selected_dishes_db[selected_id]
    return {"success": True}

# ==================== 图片上传API ====================

@app.post("/api/upload/image")
async def upload_image(file: UploadFile = File(...)):
    """上传图片"""
    # 生成唯一文件名
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    file_name = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    # 保存文件
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {
        "success": True,
        "url": f"/api/images/{file_name}"
    }

@app.get("/api/images/{file_name}")
async def get_image(file_name: str):
    """获取图片"""
    file_path = os.path.join(UPLOAD_DIR, file_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="图片不存在")
    return FileResponse(file_path)

# ==================== 版本API ====================

@app.get("/api/version/latest")
async def get_latest_version():
    """获取最新版本信息"""
    return {
        "version": "1.0.0",
        "version_code": 1,
        "download_url": "http://8.135.17.245:18000/download/a2038c6a_file",
        "release_notes": "初始版本发布",
        "force_update": False
    }

# ==================== 启动 ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=18001)
