import { lazy, Suspense } from 'react'

/**
 * 为React组件添加懒加载和Suspense包装
 * @param {Promise} importStatement 动态导入语句
 * @param {React.ReactNode} [fallback] 加载中显示的组件，默认为"加载中..."文案
 * @returns {Object} { Component, Wrapper } - Component为lazy组件，Wrapper为包装后的Suspense包装组件
 */
export function lazyLoad(importStatement, fallback = null) {
  // Handle both Promise and function inputs
  const lazyFn = typeof importStatement === 'function'
    ? importStatement
    : () => importStatement

  if (!lazyFn) {
    console.warn('lazyLoad: importStatement must be a Promise or function from dynamic import()')
  }

  const Component = lazy(lazyFn)

  const Wrapper = (props) => (
    <Suspense fallback={fallback || <div className="p-4 text-center">加载中...</div>}>
      <Component {...props} />
    </Suspense>
  )

  Wrapper.displayName = `Lazy(${Component.displayName || Component.name || 'Component'})`

  return { Component, Wrapper }
}

/**
 * 批量创建懒加载组件
 * @param {Object} components 组件映射对象，格式: { key: () => import(...) }
 * @param {React.ReactNode} [fallback] 加载中显示的组件，默认为"加载中..."文案
 * @returns {Object} 懒加载后的组件对象
 */
export function lazyLoadMultiple(components, fallback = null) {
  if (!components || typeof components !== 'object' || Array.isArray(components)) {
    console.warn('lazyLoadMultiple: components must be a plain object')
    return {}
  }

  const result = {}

  Object.entries(components).forEach(([key, importStatement]) => {
    const { Wrapper } = lazyLoad(importStatement, fallback)
    result[key] = Wrapper
  })

  return result
}
