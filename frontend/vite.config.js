import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer' // 用于Task 5的构建分析

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    // 代码分割策略
    rollupOptions: {
      output: {
        // 将node_modules中的库分离到vendor chunk
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router-dom') || /react[\/\\]/.test(id)) {
              return 'vendor-react'
            } else if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype')) {
              return 'vendor-markdown'
            } else if (id.includes('axios') || id.includes('katex')) {
              return 'vendor-utils'
            }
            return 'vendor-other'
          }
        },
        // 优化chunk命名，方便缓存
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) {
            return '[name]-[hash][extname]'
          }
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`
          } else if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return `fonts/[name]-[hash][extname]`
          } else if (ext === 'css') {
            return `css/[name]-[hash][extname]`
          }
          return `[name]-[hash][extname]`
        },
      },
    },
    // 目标浏览器版本
    target: 'es2015',
    // 启用gzip压缩提示
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        dead_code: true,
      },
      format: {
        comments: false,
      },
    },
    // 大文件警告阈值
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
    // 启用source map用于调试
    sourcemap: false,
  },
  // 开发服务器配置
  server: {
    // 使用Vite默认的开发服务器配置
  },
  // 优化依赖预加载
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios'],
  },
})
