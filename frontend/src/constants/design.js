/**
 * Design Tokens & Constants
 * 所有的设计系统常量定义
 */

export const COLORS = {
  // 主色系 - Indigo
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },

  // 中性色系 - Slate
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // 辅助色系
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#145231',
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  error: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },

  danger: {
    50: '#ffe4e6',
    100: '#fecdd3',
    200: '#fda29b',
    300: '#f87171',
    400: '#f43f5e',
    500: '#e11d48',
    600: '#be185d',
    700: '#9d174d',
    800: '#831843',
    900: '#500724',
  },
}

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '40px',
  '3xl': '48px',
}

export const BORDER_RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
}

export const TYPOGRAPHY = {
  heading: {
    h1: { size: '1.875rem', weight: 'bold', lineHeight: '2.25rem' },
    h2: { size: '1.5rem', weight: 'semibold', lineHeight: '2rem' },
    h3: { size: '1.25rem', weight: 'semibold', lineHeight: '1.75rem' },
    h4: { size: '1.125rem', weight: 'semibold', lineHeight: '1.75rem' },
  },
  body: {
    large: { size: '1rem', weight: 'normal', lineHeight: '1.5rem' },
    regular: { size: '0.875rem', weight: 'normal', lineHeight: '1.25rem' },
    small: { size: '0.75rem', weight: 'normal', lineHeight: '1rem' },
  },
  caption: {
    medium: { size: '0.75rem', weight: 'medium', lineHeight: '1rem' },
  },
}

export const SHADOWS = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
}

export const TRANSITIONS = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  timing: 'cubic-bezier(0.4, 0, 0.2, 1)',
}

export const ZINDEX = {
  hide: -1,
  base: 0,
  sticky: 10,
  fixed: 20,
  dropdown: 30,
  offcanvas: 40,
  modal: 50,
  tooltip: 60,
  notification: 70,
}

// Button Variants
export const BUTTON_VARIANTS = {
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  ghost: 'btn btn-ghost',
  danger: 'btn btn-danger',
}

export const BUTTON_SIZES = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}

// Badge Variants
export const BADGE_VARIANTS = {
  primary: 'badge badge-primary',
  secondary: 'badge badge-secondary',
  success: 'badge badge-success',
  warning: 'badge badge-warning',
  danger: 'badge badge-danger',
}

export const BADGE_SIZES = {
  sm: 'text-xs px-2 py-1',
  md: '',
  lg: 'text-sm px-3 py-2',
}
