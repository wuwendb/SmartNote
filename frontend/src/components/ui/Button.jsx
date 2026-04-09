import React from 'react'
import { BUTTON_VARIANTS, BUTTON_SIZES } from '@/constants/design'

/**
 * Button Component
 * 通用按钮组件，支持多种变体和尺寸
 * 自动适配亮色/暗黑模式
 */
export function Button({
  variant = 'primary',
  size = 'md',
  children,
  icon: Icon,
  isLoading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const baseClass = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary
  const sizeClass = BUTTON_SIZES[size] || ''
  const finalClassName = [baseClass, sizeClass, className]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      disabled={disabled || isLoading}
      className={finalClassName}
      {...props}
    >
      {/* 加载状态 */}
      {isLoading && (
        <svg
          className="spinner spinner-sm mr-sm"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {/* 图标 */}
      {Icon && !isLoading && (
        <Icon className="w-4 h-4 mr-sm" />
      )}

      {/* 文本 */}
      <span>{children}</span>
    </button>
  )
}

export default Button
