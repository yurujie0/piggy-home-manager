# 小猪管家 - 经验教训

## 问题：后端API返回字段格式不一致导致白屏

### 现象
- 创建/加入家庭后，主界面闪现一下然后变成白屏
- 多次尝试修复导航逻辑、状态管理均未解决问题
- 添加ErrorBoundary后才定位到问题

### 根因
**后端API返回snake_case格式，前端期望camelCase格式**

后端返回：
```json
{
  "user": {
    "id": "xxx",
    "nickname": "爸爸",
    "family_id": "xxx",      // ❌ snake_case
    "created_at": "..."      // ❌ snake_case
  },
  "family": {
    "id": "xxx",
    "name": "幸福小家",
    "invite_code": "ABC123"    // ❌ snake_case
  }
}
```

前端期望：
```json
{
  "user": {
    "id": "xxx",
    "nickname": "爸爸",
    "familyId": "xxx",         // ✅ camelCase
    "createdAt": "..."         // ✅ camelCase
  },
  "family": {
    "id": "xxx",
    "name": "幸福小家",
    "inviteCode": "ABC123"      // ✅ camelCase
  }
}
```

### 为什么难以定位
1. **没有错误边界** - React Native崩溃直接白屏，没有错误信息
2. **数据存储成功** - AsyncStorage存储了数据，但字段名不匹配
3. **组件访问undefined** - 渲染时访问`family.inviteCode`得到undefined
4. **问题延迟暴露** - 创建/加入时正常，进入主页面才崩溃

### 解决方案

#### 1. 添加ErrorBoundary
```tsx
class ErrorBoundary extends Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error:', error);
    // 显示错误信息而不是白屏
  }
}
```

#### 2. 统一API数据格式
**方案A：后端返回camelCase（推荐）**
```python
def to_camel_case(snake_str):
    components = snake_str.split('_')
    return components[0] + ''.join(x.capitalize() for x in components[1:])

# 返回前转换
return convert_keys_to_camel_case(data)
```

**方案B：前端转换**
```typescript
// API层统一转换
const data = await apiRequest(...);
return convertKeysToCamelCase(data);
```

#### 3. 类型定义与API保持一致
```typescript
// types/index.ts
interface Family {
  id: string;
  name: string;
  inviteCode: string;  // 与API返回一致
  createdAt: string;
}
```

### 预防措施

1. **API文档先行**
   - 定义好请求/响应格式再开发
   - 使用OpenAPI/Swagger文档

2. **统一命名规范**
   - 后端：snake_case（Python惯例）
   - 前端：camelCase（JavaScript惯例）
   - 在边界处转换，不要混用

3. **添加数据校验**
   ```typescript
   // 使用zod等库校验
   const FamilySchema = z.object({
     id: z.string(),
     inviteCode: z.string(),  // 明确字段名
   });
   ```

4. **错误处理**
   - 每个API调用都加try-catch
   - 记录详细错误日志
   - 给用户友好的错误提示

### 调试技巧

1. **查看后端日志**
   ```bash
   journalctl -u piggy-home -f
   ```

2. **React Native日志**
   ```bash
   adb logcat | grep ReactNative
   ```

3. **网络请求查看**
   - 使用Flipper
   - 或添加console.log打印请求/响应

### 相关文件
- `backend/main.py` - 后端API
- `services/api.ts` - 前端API层
- `types/index.ts` - TypeScript类型定义
- `contexts/AuthContext.tsx` - 状态管理

---

**记录时间**: 2026-03-22
**问题修复版本**: v1.0.9
