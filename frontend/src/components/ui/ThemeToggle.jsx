import React, { useState, useEffect } from 'react'

/**
 * ThemeToggle Component
 * 主题切换按钮 - 在亮色和暗黑模式之间切换
 * 优先级：localStorage >系统偏好 > 默认亮色
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  // 初始化主题
  useEffect(() => {
    // 检查localStorage
    const savedTheme = localStorage.getItem('smartnote-theme')

    if (savedTheme) {
      // 使用保存的主题
      const darkMode = savedTheme === 'dark'
      setIsDark(darkMode)
      applyTheme(darkMode)
    } else {
      // 检查系统偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDark(prefersDark)
      applyTheme(prefersDark)
    }

    setMounted(true)
  }, [])

  // 应用主题
  const applyTheme = (dark) => {
    const root = document.documentElement

    if (dark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // 保存到localStorage
    localStorage.setItem('smartnote-theme', dark ? 'dark' : 'light')
  }

  // 切换主题
  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    applyTheme(newIsDark)

    // 发送自定义事件, 可用于其他组件监听主题变化
    window.dispatchEvent(
      new CustomEvent('themechange', { detail: { isDark: newIsDark } })
    )
  }

  // 防止未挂载时渲染
  if (!mounted) return null

  return (
    <button
      onClick={toggleTheme}
      className="p-sm text-lg rounded-lg
        bg-neutral-100 dark:bg-neutral-800
        text-neutral-600 dark:text-neutral-400
        hover:bg-neutral-200 dark:hover:bg-neutral-700
        transition-smooth
        focus:outline-none focus:ring-2 focus:ring-primary-600"
      title={isDark ? '切换到亮色模式' : '切换到暗黑模式'}
      aria-label="切换主题"
    >
      {isDark ? (
        // 太阳图标 (暗黑模式时显示)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        // 月亮图标 (亮色模式时显示)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}

export default ThemeToggle
