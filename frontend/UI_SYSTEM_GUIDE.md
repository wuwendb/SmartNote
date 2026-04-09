# SmartNote UI系统使用指南

## 📋 目录

1. [快速开始](#快速开始)
2. [颜色系统](#颜色系统)
3. [组件库](#组件库)
4. [主题切换](#主题切换)
5. [迁移现有代码](#迁移现有代码)
6. [最佳实践](#最佳实践)

---

## 快速开始

### 导入组件

```jsx
// 方式1: 单个导入
import { Button, Card, Input } from '@/components/ui'

// 方式2: 分组导入
import * as UI from '@/components/ui'

// 使用
<UI.Button variant="primary">点击我</UI.Button>
```

### 导入设计令牌

```jsx
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/design'

// 使用颜色常量
<div style={{ color: COLORS.primary[600] }}>
  文本
</div>
```

---

## 颜色系统

### 主色系（Indigo）

```jsx
// 使用Tailwind类
<button className="bg-primary-600 text-white">
  主按钮
</button>

// 对应的暗黑模式自动应用
// 亮色: bg-primary-600
// 暗黑: 相同 (Tailwind自动处理)
```

### 中性色（Slate）

```jsx
// 背景色
<div className="bg-white dark:bg-neutral-900">
  内容
</div>

// 文本色
<p className="text-neutral-900 dark:text-neutral-100">
  文本
</p>
```

### 辅助色

```jsx
// 成功 (Emerald)
<div className="bg-success-50 text-success-600 dark:bg-success-900 dark:text-success-200">
  成功消息
</div>

// 警告 (Amber)
<div className="bg-warning-50 text-warning-600 dark:bg-warning-900 dark:text-warning-200">
  警告消息
</div>

// 错误 (Rose/Danger)
<div className="bg-error-50 text-error-600 dark:bg-error-900 dark:text-error-200">
  错误消息
</div>
```

---

## 组件库

### Button 按钮

```jsx
import { Button } from '@/components/ui'

// 基础用法
<Button>默认按钮</Button>

// 不同变体
<Button variant="primary">主按钮</Button>
<Button variant="secondary">次按钮</Button>
<Button variant="ghost">幽灵按钮</Button>
<Button variant="danger">危险按钮</Button>

// 不同尺寸
<Button size="sm">小</Button>
<Button size="md">中（默认）</Button>
<Button size="lg">大</Button>

// 带图标
<Button icon={<CheckIcon />}>确认</Button>

// 加载状态
<Button isLoading={isLoading}>
  {isLoading ? '处理中...' : '提交'}
</Button>

// 禁用状态
<Button disabled>禁用按钮</Button>
```

### Card 卡片

```jsx
import { Card, CardBody, CardHeader, CardFooter } from '@/components/ui'

// 基础卡片
<Card>
  <CardBody>
    内容
  </CardBody>
</Card>

// 完整卡片
<Card hover={true}>
  <CardHeader>
    <h3>标题</h3>
  </CardHeader>
  <CardBody>
    主要内容
  </CardBody>
  <CardFooter>
    <Button>操作</Button>
  </CardFooter>
</Card>
```

### Input 输入框

```jsx
import { Input, Textarea, Select } from '@/components/ui'

// 基础输入框
<Input
  type="text"
  placeholder="输入内容"
/>

// 带标签和错误提示
<Input
  label="邮箱"
  type="email"
  error={emailError}
  helperText="请输入有效邮箱"
/>

// 带图标
<Input
  icon={<SearchIcon />}
  placeholder="搜索..."
/>

// 多行文本
<Textarea
  label="评论"
  placeholder="输入评论..."
  rows={5}
/>

// 选择框
<Select
  label="选择"
  options={[
    { value: '1', label: '选项1' },
    { value: '2', label: '选项2' },
  ]}
/>
```

### Badge 标签

```jsx
import { Badge } from '@/components/ui'

// 不同变体
<Badge variant="primary">标签</Badge>
<Badge variant="secondary">标签</Badge>
<Badge variant="success">成功</Badge>
<Badge variant="warning">警告</Badge>
<Badge variant="danger">危险</Badge>

// 可关闭的标签
<Badge
  variant="primary"
  onClose={() => handleRemove()}
>
  可关闭标签
</Badge>
```

### Modal 模态框

```jsx
import { Modal, ConfirmModal } from '@/components/ui'
import { useState } from 'react'

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        打开模态框
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="对话框标题"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsOpen(false)}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                // 处理确认
                setIsOpen(false)
              }}
            >
              确认
            </Button>
          </>
        }
      >
        <p>对话框内容</p>
      </Modal>
    </>
  )
}

// 确认对话框
<ConfirmModal
  isOpen={showConfirm}
  title="确认删除"
  message="确定要删除这项吗？此操作不可撤销"
  onConfirm={() => handleDelete()}
  onCancel={() => setShowConfirm(false)}
  isDangerous={true}
/>
```

### ThemeToggle 主题切换

```jsx
import { ThemeToggle } from '@/components/ui'

// 在导航栏添加
<nav className="flex items-center justify-between">
  <div>Logo</div>
  <ThemeToggle />
</nav>
```

---

## 主题切换

### 自动切换逻辑

```
优先级：
1. localStorage中保存的主题 (最高优先)
2. 系统偏好 (prefers-color-scheme)
3. 默认亮色模式 (最低)
```

### 手动检测主题

```jsx
import { useEffect, useState } from 'react'

function MyComponent() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // 检测暗黑模式
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)

    // 监听主题变化
    const handleThemeChange = (e) => {
      setIsDark(e.detail.isDark)
    }

    window.addEventListener('themechange', handleThemeChange)
    return () => window.removeEventListener('themechange', handleThemeChange)
  }, [])

  return <div>当前模式: {isDark ? '暗黑' : '亮色'}</div>
}
```

---

## 迁移现有代码

### 前后对比

#### Before（旧代码）

```jsx
<button
  className="px-4 py-2 rounded-lg font-bold text-sm transition-all
    bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md
    disabled:opacity-50 disabled:cursor-not-allowed"
>
  提交
</button>
```

#### After（新代码）

```jsx
import { Button } from '@/components/ui'

<Button variant="primary" size="md">
  提交
</Button>
```

### 样式迁移示例

```jsx
// 替换内联样式的卡片
// Before
<div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all">
  内容
</div>

// After
import { Card } from '@/components/ui'

<Card hover>
  内容
</Card>
```

---

## 最佳实践

### 1. 使用颜色变量而非硬编码

```jsx
// ❌ 不推荐
<div className="bg-indigo-600">内容</div>

// ✅ 推荐
<div className="bg-primary-600">内容</div>
```

### 2. 使用间距标准

```jsx
// ❌ 不推荐
<div className="p-3 m-2">内容</div>

// ✅ 推荐 (使用 xs/sm/md/lg/xl)
<div className="p-md m-sm">内容</div>
```

### 3. 遵循圆角标准

```jsx
// ❌ 不推荐
<div className="rounded-2xl">内容</div>

// ✅ 推荐 (使用 sm/md/lg 标准)
<div className="rounded-lg">
  {/* sm(4px) / md(8px) / lg(12px) */}
</div>
```

### 4. 使用组件库

```jsx
// ❌ 不推荐 (每次都重复定义)
<button className="bg-primary-600 text-white...">按钮</button>

// ✅ 推荐 (复用组件)
<Button variant="primary">按钮</Button>
```

### 5. 暗黑模式支持

```jsx
// ❌ 不推荐 (只适配亮色)
<div className="bg-white text-black">内容</div>

// ✅ 推荐 (包含暗黑)
<div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
  内容
</div>

// ✅ 更推荐 (使用CSS变量)
<div className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
  内容
</div>
```

---

## 设计系统文件结构

```
frontend/
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       ├── Input.jsx
│   │       ├── Badge.jsx
│   │       ├── Modal.jsx
│   │       ├── ThemeToggle.jsx
│   │       └── index.js
│   ├── styles/
│   │   ├── globals.css          (CSS变量 + 基础样式)
│   │   └── components.css       (组件基类)
│   ├── constants/
│   │   └── design.js            (设计令牌)
│   └── index.css                (导入所有样式)
└── tailwind.config.js           (完整设计系统配置)
```

---

## 查看效果

### 启动开发服务器

```bash
npm run dev
```

### 应用主题切换

点击导航栏右上角的太阳/月亮图标可在亮色/暗黑模式之间切换。
主题选择会自动保存到localStorage。

### 构建优化版本

```bash
npm run build
# 或查看构建分析
npm run build:analyze
```

---

## 常见问题

**Q: 如何自定义颜色？**
A: 编辑 `tailwind.config.js` 的 `colors` 配置，或使用CSS变量在 `globals.css` 中覆盖。

**Q: 暗黑模式为什么不工作？**
A: 确保：
1. `tailwind.config.js` 中有 `darkMode: 'class'`
2. 根元素有 `dark` class
3. 样式使用了 `dark:` 前缀

**Q: 如何添加新组件？**
A: 在 `components/ui/` 下创建新文件，然后导出到 `index.js`

---

## 下一步

- [x] 基础设计系统安装
- [ ] 逐步迁移现有组件到新系统
- [ ] 建立风格指南文档
- [ ] 添加Storybook组件库文档
- [ ] 实现响应式设计完整测试

---

**更新时间**: 2026-04-09
**版本**: 1.0.0
