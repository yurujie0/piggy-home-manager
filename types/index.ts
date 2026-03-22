// ==================== 用户与家庭类型定义 ====================

export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  nickname: string;
  avatar?: string;
  role: UserRole;
  familyId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Family {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  user: User;
  joinedAt: string;
}

// ==================== 点餐板块类型定义 ====================

export type DishCategory = 'hot' | 'cold' | 'soup' | 'staple' | 'dessert' | 'drink';

export const CategoryLabels: Record<DishCategory, string> = {
  hot: '热菜',
  cold: '凉菜',
  soup: '汤品',
  staple: '主食',
  dessert: '甜品',
  drink: '饮品',
};

export const CategoryColors: Record<DishCategory, string> = {
  hot: '#E74C3C',
  cold: '#3498DB',
  soup: '#1ABC9C',
  staple: '#F39C12',
  dessert: '#E91E63',
  drink: '#9B59B6',
};

export interface Dish {
  id: string;
  familyId: string;
  name: string;
  description?: string;
  image?: string;
  category: DishCategory;
  isAvailable: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SelectedDish {
  id: string;
  dishId: string;
  dishName: string;
  familyId: string;
  selectedBy: string;
  selectedByName: string;
  quantity: number;
  note?: string;
  selectedAt: string;
}

// ==================== API 请求/响应类型 ====================

export interface CreateFamilyRequest {
  familyName: string;
  adminNickname: string;
}

export interface JoinFamilyRequest {
  inviteCode: string;
  nickname: string;
}

export interface CreateDishRequest {
  name: string;
  description?: string;
  category: DishCategory;
  image?: string;
}

export interface UpdateDishRequest {
  name?: string;
  description?: string;
  category?: DishCategory;
  image?: string;
  isAvailable?: boolean;
}

export interface SelectDishRequest {
  dishId: string;
  quantity: number;
  note?: string;
}

export interface UpdateMemberRoleRequest {
  userId: string;
  newRole: UserRole;
}

// ==================== API 响应类型 ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ==================== 版本信息 ====================

export interface VersionInfo {
  version: string;
  versionCode: number;
  downloadUrl: string;
  releaseNotes: string;
  forceUpdate: boolean;
}
