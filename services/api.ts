// API 服务 - 调用后端
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type {
  User,
  Family,
  FamilyMember,
  Dish,
  SelectedDish,
  CreateFamilyRequest,
  JoinFamilyRequest,
  CreateDishRequest,
  UpdateDishRequest,
  SelectDishRequest,
  UpdateMemberRoleRequest,
  ApiResponse,
  VersionInfo,
} from '../types';
import { keysToCamelCase, transformUser, transformFamily, transformDishes, transformSelectedDishes } from '../utils/dataTransform';

// 文件服务器 URL
const FILE_SERVER_URL = 'http://8.135.17.245:18000';

// API 基础 URL - 使用18002端口
const API_BASE_URL = 'http://8.135.17.245:18002';

// 获取 token
async function getToken(): Promise<string | null> {
  return await AsyncStorage.getItem('access_token');
}

// 通用请求函数
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // 添加认证 token
  const token = await getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// ==================== 认证相关 API ====================

export const authApi = {
  // 用户注册
  register: async (data: { username: string; password: string; nickname: string }): Promise<{ user: User; accessToken: string }> => {
    const result = await apiRequest<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: data.username,
        password: data.password,
        nickname: data.nickname,
      }),
    });
    const user = transformUser(result.user);
    await AsyncStorage.setItem('access_token', result.accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return { user, accessToken: result.accessToken };
  },

  // 用户登录
  login: async (data: { username: string; password: string }): Promise<{ user: User; accessToken: string }> => {
    const result = await apiRequest<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: data.username,
        password: data.password,
      }),
    });
    const user = transformUser(result.user);
    await AsyncStorage.setItem('access_token', result.accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return { user, accessToken: result.accessToken };
  },

  // 创建家庭（注册管理员）
  createFamily: async (data: CreateFamilyRequest): Promise<{ user: User; family: Family; token: string }> => {
    const result = await apiRequest<any>('/api/families/create', {
      method: 'POST',
      body: JSON.stringify({
        family_name: data.familyName,
        admin_nickname: data.adminNickname,
      }),
    });
    const user = transformUser(result.user);
    const family = transformFamily(result.family);

    await AsyncStorage.setItem('access_token', result.accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    await AsyncStorage.setItem('family', JSON.stringify(family));

    return { user, family, token: result.accessToken };
  },

  // 加入家庭
  joinFamily: async (data: JoinFamilyRequest): Promise<{ user: User; family: Family; token: string }> => {
    const result = await apiRequest<any>('/api/families/join', {
      method: 'POST',
      body: JSON.stringify({
        invite_code: data.inviteCode,
        nickname: data.nickname,
      }),
    });
    const user = transformUser(result.user);
    const family = transformFamily(result.family);

    await AsyncStorage.setItem('access_token', result.accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    await AsyncStorage.setItem('family', JSON.stringify(family));

    return { user, family, token: result.accessToken };
  },

  // 登出
  logout: async (): Promise<void> => {
    await AsyncStorage.multiRemove(['access_token', 'user', 'family']);
  },

  // 获取当前用户
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        return JSON.parse(userJson);
      }
      return null;
    } catch {
      return null;
    }
  },

  // 获取当前家庭
  getCurrentFamily: async (): Promise<Family | null> => {
    try {
      const familyJson = await AsyncStorage.getItem('family');
      if (familyJson) {
        return JSON.parse(familyJson);
      }
      return null;
    } catch {
      return null;
    }
  },
};

// ==================== 家庭相关 API ====================

export const familyApi = {
  // 获取家庭成员列表
  getMembers: async (): Promise<FamilyMember[]> => {
    const data = await apiRequest<{ members: any[] }>('/api/families/members');
    return data.members.map((m: any) => ({...m, user: transformUser(m.user)}));
  },

  // 更新成员角色
  updateMemberRole: async (data: UpdateMemberRoleRequest): Promise<FamilyMember> => {
    const result = await apiRequest<FamilyMember>('/api/families/members/role', {
      method: 'PUT',
      body: JSON.stringify({
        user_id: data.userId,
        new_role: data.newRole,
      }),
    });
    return result;
  },

  // 移除成员
  removeMember: async (userId: string): Promise<void> => {
    await apiRequest('/api/families/members/remove', {
      method: 'DELETE',
      body: JSON.stringify({ user_id: userId }),
    });
  },

  // 获取邀请码
  getInviteCode: async (): Promise<string> => {
    const data = await apiRequest<{ inviteCode: string }>('/api/families/invite-code');
    return data.inviteCode;
  },

  // 刷新邀请码
  refreshInviteCode: async (): Promise<string> => {
    const data = await apiRequest<{ inviteCode: string }>('/api/families/invite-code/refresh', {
      method: 'POST',
    });
    return data.inviteCode;
  },
};

// ==================== 菜谱相关 API ====================

export const dishApi = {
  // 获取所有菜谱
  getDishes: async (category?: string): Promise<Dish[]> => {
    const params = new URLSearchParams();
    if (category && category !== 'all') {
      params.append('category', category);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await apiRequest<{ dishes: any[] }>(`/api/dishes${query}`);
    return transformDishes(data.dishes);
  },

  // 获取单个菜谱
  getDish: async (id: string): Promise<Dish | null> => {
    try {
      const data = await apiRequest<{ dish: any }>(`/api/dishes/${id}`);
      return transformDish(data.dish);
    } catch {
      return null;
    }
  },

  // 创建菜谱（管理员）
  createDish: async (data: CreateDishRequest): Promise<Dish> => {
    const result = await apiRequest<{ dish: any }>('/api/dishes', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        category: data.category,
        image: data.image,
      }),
    });
    return result.dish;
  },

  // 更新菜谱（管理员）
  updateDish: async (id: string, data: UpdateDishRequest): Promise<Dish> => {
    const result = await apiRequest<{ dish: Dish }>(`/api/dishes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.dish;
  },

  // 删除菜谱（管理员）
  deleteDish: async (id: string): Promise<void> => {
    await apiRequest(`/api/dishes/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== 点餐相关 API ====================

export const orderApi = {
  // 获取已选菜品（今日）
  getSelectedDishes: async (familyId: string): Promise<SelectedDish[]> => {
    const data = await apiRequest<{ selectedDishes: any[] }>(`/api/orders/today?family_id=${familyId}`);
    return transformSelectedDishes(data.selectedDishes);
  },

  // 选择菜品
  selectDish: async (data: SelectDishRequest, familyId: string): Promise<SelectedDish> => {
    const result = await apiRequest<{ selectedDish: any }>(`/api/orders/select?family_id=${familyId}`, {
      method: 'POST',
      body: JSON.stringify({
        dish_id: data.dishId,
        quantity: data.quantity,
        note: data.note,
      }),
    });
    return transformSelectedDish(result.selectedDish);
  },

  // 更新已选菜品数量
  updateSelectedQuantity: async (selectedDishId: string, quantity: number): Promise<SelectedDish> => {
    const result = await apiRequest<{ selectedDish: any }>(`/api/orders/selected/${selectedDishId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
    return transformSelectedDish(result.selectedDish);
    return result.selectedDish;
  },

  // 取消选择菜品
  unselectDish: async (selectedDishId: string): Promise<void> => {
    await apiRequest(`/api/orders/selected/${selectedDishId}`, {
      method: 'DELETE',
    });
  },
};

// ==================== 版本相关 API ====================

export const versionApi = {
  checkUpdate: async (): Promise<VersionInfo> => {
    const data = await apiRequest<VersionInfo>('/api/version/latest');
    return data;
  },
};

// ==================== 文件上传 API ====================

export const uploadApi = {
  // 上传图片到后端 API (端口 18001)
  uploadImage: async (imageUri: string): Promise<string> => {
    try {
      // 获取文件名
      const filename = imageUri.split('/').pop() || 'image.jpg';
      
      // 获取 token
      const token = await getToken();
      
      // 创建 FormData
      const formData = new FormData();
      
      // React Native 平台 - 使用文件 URI
      formData.append('file', {
        uri: imageUri,
        name: filename,
        type: 'image/jpeg',
      } as any);

      // 上传到后端 API (端口 18001)
      const uploadResponse = await fetch(`${API_BASE_URL}/api/upload/image`, {
        method: 'POST',
        body: formData,
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          // 注意：不要设置 Content-Type，让浏览器自动设置 multipart boundary
        },
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || `上传失败: ${uploadResponse.status}`);
      }

      const result = await uploadResponse.json();
      
      if (result.success && result.url) {
        // 返回完整的图片 URL (后端返回的是相对路径如 /api/images/xxx.jpg)
        return `${API_BASE_URL}${result.url}`;
      } else {
        throw new Error(result.message || '上传失败');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      throw new Error(error.message || '图片上传失败');
    }
  },
};
