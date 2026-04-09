import React from 'react'
import { BADGE_VARIANTS } from '@/constants/design'

/**
 * Badge Component
 * 标签/徽章组件，支持多种变体
 * 自动适配亮色/暗黑模式
 */
export function Badge({
  variant = 'primary',
  children,
  onClose,
  className = '',
  ...props
}) {
  const variantClass = BADGE_VARIANTS[variant] || BADGE_VARIANTS.primary
  const finalClassName = [variantClass, className]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      className={finalClassName}
      {...props}
    >
      <span className="mr-sm">{children}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-fast"
        >
          ×
        </button>
      )}
    </span>
  )
}

export default Badge
