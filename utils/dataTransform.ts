// 数据转换工具 - 将后端 snake_case 转换为前端 camelCase

/**
 * 将 snake_case 字符串转换为 camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * 递归转换对象的键名为 camelCase
 */
export function keysToCamelCase(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(keysToCamelCase);
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const camelKey = toCamelCase(key);
        result[camelKey] = keysToCamelCase(obj[key]);
      }
    }
    return result;
  }

  return obj;
}

/**
 * 转换用户数据
 */
export function transformUser(data: any): any {
  if (!data) return null;
  return keysToCamelCase(data);
}

/**
 * 转换家庭数据
 */
export function transformFamily(data: any): any {
  if (!data) return null;
  return keysToCamelCase(data);
}

/**
 * 转换菜谱数据
 */
export function transformDish(data: any): any {
  if (!data) return null;
  return keysToCamelCase(data);
}

/**
 * 转换菜谱列表
 */
export function transformDishes(data: any[]): any[] {
  if (!data) return [];
  return data.map(keysToCamelCase);
}

/**
 * 转换已选菜品数据
 */
export function transformSelectedDish(data: any): any {
  if (!data) return null;
  return keysToCamelCase(data);
}

/**
 * 转换已选菜品列表
 */
export function transformSelectedDishes(data: any[]): any[] {
  if (!data) return [];
  return data.map(keysToCamelCase);
}
