import { lazy, Suspense } from 'react'

/**
 * 为React组件添加懒加载和Suspense包装
 * @param {Promise} importStatement 动态导入语句
 * @param {React.ReactNode} fallback 加载中显示的组件
 * @returns {Object} { Component, Wrapper }
 */
export function lazyLoad(importStatement, fallback = null) {
  const Component = lazy(() => importStatement)

  const Wrapper = (props) => (
    <Suspense fallback={fallback || <div className="p-4 text-center">加载中...</div>}>
      <Component {...props} />
    </Suspense>
  )

  Wrapper.displayName = `Lazy(${Component.displayName || 'Component'})`

  return { Component, Wrapper }
}

/**
 * 批量创建懒加载组件
 * @param {Object} components 组件映射对象
 * @returns {Object} 懒加载后的组件
 */
export function lazyLoadMultiple(components, fallback = null) {
  const result = {}

  Object.entries(components).forEach(([key, importStatement]) => {
    const { Wrapper } = lazyLoad(importStatement, fallback)
    result[key] = Wrapper
  })

  return result
}
