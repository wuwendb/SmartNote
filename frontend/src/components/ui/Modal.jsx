import React from 'react'
import { Card, CardHeader, CardBody, CardFooter } from './Card'
import { Button } from './Button'

/**
 * Modal Component
 * 模态框/对话框组件
 * 自动适配亮色/暗黑模式
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className = '',
}) {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/80 transition-opacity z-50"
        onClick={onClose}
      />

      {/* 模态框容器 */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-md">
        <Card
          hover={false}
          className={`w-full ${sizeClasses[size]} ${className}`.trim()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 标题区 */}
          {title && (
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-fast text-xl leading-none"
              >
                ×
              </button>
            </CardHeader>
          )}

          {/* 内容区 */}
          <CardBody>
            {children}
          </CardBody>

          {/* 页脚区 */}
          {footer && (
            <CardFooter>
              {footer}
            </CardFooter>
          )}
        </Card>
      </div>
    </>
  )
}

/**
 * 确认对话框便利函数
 */
export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = '确认',
  cancelText = '取消',
  isDangerous = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
    >
      <div className="py-md">
        <p className="text-neutral-600 dark:text-neutral-400">
          {message}
        </p>
      </div>

      <div className="flex gap-sm justify-end">
        <Button
          variant="secondary"
          onClick={onCancel}
        >
          {cancelText}
        </Button>
        <Button
          variant={isDangerous ? 'danger' : 'primary'}
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}

export default Modal
