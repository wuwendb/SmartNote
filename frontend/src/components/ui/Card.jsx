import React from 'react'

/**
 * Card Component
 * 通用卡片容器，支持hover效果和自定义className
 * 自动适配亮色/暗黑模式
 */
export function Card({
  children,
  hover = true,
  className = '',
  ...props
}) {
  const hoverClass = hover ? 'card-hover' : ''
  const finalClassName = ['card', hoverClass, className]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={finalClassName}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Card Body - 卡片内容区
 */
export function CardBody({ children, className = '', ...props }) {
  return (
    <div
      className={`p-md ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Card Header - 卡片标题区
 */
export function CardHeader({ children, className = '', ...props }) {
  return (
    <div
      className={`p-md border-b border-neutral-200 dark:border-neutral-800 ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Card Footer - 卡片底部
 */
export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`p-md border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-sm ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
