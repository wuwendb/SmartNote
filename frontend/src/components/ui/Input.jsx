import React from 'react'

/**
 * Input Component
 * 通用输入框，支持icon、error状态和自定义样式
 * 自动适配亮色/暗黑模式
 */
export function Input({
  type = 'text',
  icon: Icon,
  error,
  label,
  helperText,
  className = '',
  ...props
}) {
  return (
    <div className="w-full">
      {/* 标签 */}
      {label && (
        <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-sm">
          {label}
        </label>
      )}

      {/* 输入框容器 */}
      <div className="relative w-full">
        {/* 图标 */}
        {Icon && (
          <div className="absolute left-md top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}

        {/* 输入框 */}
        <input
          type={type}
          className={`
            input
            ${Icon ? 'pl-xl' : ''}
            ${error ? 'border-error-500 focus:ring-error-600' : ''}
            ${className}
          `.trim()}
          {...props}
        />
      </div>

      {/* 错误信息 */}
      {error && (
        <p className="mt-xs text-sm text-error-600 dark:text-error-400">
          {error}
        </p>
      )}

      {/* 辅助文本 */}
      {helperText && !error && (
        <p className="mt-xs text-sm text-neutral-500 dark:text-neutral-400">
          {helperText}
        </p>
      )}
    </div>
  )
}

/**
 * Textarea Component
 * 多行文本输入框
 */
export function Textarea({
  label,
  error,
  helperText,
  className = '',
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-sm">
          {label}
        </label>
      )}

      <textarea
        className={`
          input
          resize-vertical
          ${error ? 'border-error-500 focus:ring-error-600' : ''}
          ${className}
        `.trim()}
        {...props}
      />

      {error && (
        <p className="mt-xs text-sm text-error-600 dark:text-error-400">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="mt-xs text-sm text-neutral-500 dark:text-neutral-400">
          {helperText}
        </p>
      )}
    </div>
  )
}

/**
 * Select Component
 * 选择框
 */
export function Select({
  label,
  error,
  helperText,
  options = [],
  className = '',
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-sm">
          {label}
        </label>
      )}

      <select
        className={`
          input
          ${error ? 'border-error-500 focus:ring-error-600' : ''}
          ${className}
        `.trim()}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="mt-xs text-sm text-error-600 dark:text-error-400">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="mt-xs text-sm text-neutral-500 dark:text-neutral-400">
          {helperText}
        </p>
      )}
    </div>
  )
}

export default Input
