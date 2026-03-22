# 🐷 小猪管家 - 家庭百宝箱

一个面向家庭的智能管理应用，支持家庭成员协作点餐、菜谱管理等功能。

## ✨ 功能特性

### 🏠 家庭管理
- 创建家庭，自动成为管理员
- 通过邀请码加入家庭
- 管理员可添加/删除成员
- 支持设置多个管理员

### 🍽️ 智能点餐
- 浏览家庭菜谱
- 所有成员可加减想吃的菜
- 已选菜品全员实时可见
- 按分类筛选菜品

### 📋 菜谱管理
- 管理员添加/编辑/删除菜谱
- 支持菜品分类（热菜、凉菜、汤品等）
- 支持菜品标签
- 普通成员仅可浏览

## 🛠️ 技术栈

- **框架**: React Native + Expo
- **语言**: TypeScript
- **UI库**: React Native Paper
- **状态管理**: React Context
- **导航**: React Navigation
- **HTTP**: Fetch API

## 📱 支持平台

- ✅ Android
- ✅ HarmonyOS（通过Android兼容层）
- ✅ iOS

## 🚀 快速开始

### 环境要求

- Node.js 18+
- Java 17
- Android SDK
- Expo CLI

### 安装依赖

```bash
npm install
```

### 开发运行

```bash
# 启动开发服务器
npm start

# Android
npm run android

# iOS（需要macOS）
npm run ios
```

### 构建APK

```bash
# 使用构建脚本
chmod +x build-apk.sh
./build-apk.sh
```

或手动构建：

```bash
# 生成Android项目
npx expo prebuild --platform android

# 配置SDK路径
cd android
echo "sdk.dir=/path/to/android-sdk" > local.properties

# 构建Release APK
./gradlew assembleRelease
```

## 📁 项目结构

```
piggy-home-manager/
├── app/                    # 页面组件
│   ├── auth/              # 认证页面
│   └── main/              # 主页面
├── components/            # 公共组件
├── constants/             # 常量配置
├── contexts/              # 状态管理
├── hooks/                 # 自定义Hooks
├── services/              # API服务
├── types/                 # TypeScript类型
├── assets/                # 静态资源
├── App.tsx               # 应用入口
└── app.json              # 应用配置
```

## 🔌 API接口

后端API基于food-order-app项目扩展，主要接口：

### 认证
- `POST /api/families/create` - 创建家庭
- `POST /api/families/join` - 加入家庭

### 家庭管理
- `GET /api/families/members` - 获取成员列表
- `PUT /api/families/members/role` - 更新成员角色
- `DELETE /api/families/members/remove` - 移除成员
- `GET /api/families/invite-code` - 获取邀请码
- `POST /api/families/invite-code/refresh` - 刷新邀请码

### 菜谱
- `GET /api/dishes` - 获取菜谱列表
- `POST /api/dishes` - 创建菜谱（管理员）
- `PUT /api/dishes/:id` - 更新菜谱（管理员）
- `DELETE /api/dishes/:id` - 删除菜谱（管理员）

### 点餐
- `GET /api/orders/today` - 获取今日已选
- `POST /api/orders/select` - 选择菜品
- `PUT /api/orders/selected/:id` - 更新数量
- `DELETE /api/orders/selected/:id` - 取消选择

## 🎨 主题配色

- 主色: `#EC4899` (粉色)
- 辅助色: `#F59E0B` (橙色)
- 背景色: `#FFFBF7` (米白)

## 📝 版本历史

### v1.0.0 (2026-03-22)
- 初始版本发布
- 家庭管理功能
- 智能点餐功能
- 菜谱管理功能

## 📄 许可证

MIT License

## 👨‍💻 开发者

基于food-order-app项目重构
