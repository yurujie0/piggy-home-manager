// 小猪管家 - 温暖家庭风格配色
export const Colors = {
  // 主色调 - 温暖的粉色系
  primary: '#EC4899',
  primaryLight: '#F472B6',
  primaryDark: '#DB2777',
  primaryGradient: ['#EC4899', '#F472B6'],

  // 辅助色 - 温暖的橙黄色系
  secondary: '#F59E0B',
  secondaryLight: '#FCD34D',
  secondaryDark: '#D97706',
  secondaryGradient: ['#F59E0B', '#FCD34D'],

  // 背景色 - 温暖的米白色
  background: '#FFFBF7',
  surface: '#FFFFFF',
  card: '#FFFFFF',

  // 文字色
  text: '#1F2937',
  textLight: '#6B7280',
  textMuted: '#9CA3AF',

  // 边框和分割线
  border: '#E5E7EB',
  divider: '#F3F4F6',

  // 状态色
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // 分类颜色
  category: {
    hot: '#E74C3C',
    cold: '#3498DB',
    soup: '#1ABC9C',
    staple: '#F39C12',
    dessert: '#E91E63',
    drink: '#9B59B6',
  },

  // 渐变配色
  gradients: {
    primary: ['#EC4899', '#F472B6'],
    secondary: ['#F59E0B', '#FCD34D'],
    success: ['#10B981', '#34D399'],
    card: ['#FFFFFF', '#FAF9F7'],
    overlay: ['rgba(236,72,153,0.8)', 'rgba(244,114,182,0.6)'],
  },

  // 阴影颜色
  shadow: {
    light: 'rgba(0,0,0,0.05)',
    medium: 'rgba(0,0,0,0.1)',
    dark: 'rgba(0,0,0,0.15)',
    primary: 'rgba(236,72,153,0.3)',
  },
};

// 暗色主题
export const DarkColors = {
  ...Colors,
  background: '#1F2937',
  surface: '#111827',
  card: '#374151',
  text: '#F9FAFB',
  textLight: '#D1D5DB',
  textMuted: '#9CA3AF',
  border: '#4B5563',
  divider: '#374151',
};

export default Colors;
