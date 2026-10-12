import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * 静态版构建配置。
 *
 * 与原版的差别：
 *  - 去掉了 contentApiPlugin（本地写入接口，静态托管根本没有服务端）；
 *  - 去掉了 @shared 别名（同时被前后端引用的 accountRules 只服务于登录页，
 *    静态版已无登录页）；
 *  - 去掉了 /api 代理（没有后端可代理）；
 *  - base 改成可配置，默认 /myBlog_GH/ —— 项目站点部署在 /仓库名/ 下，
 *    留成 '/' 会让所有构建产物 404。
 */
const base = process.env.STATIC_BASE || '/myBlog_GH/'

export default defineConfig({
  base,
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    target: 'es2020',
    // 按路由拆包：懒加载的视图各自成块，首屏不为它们付出体积
    cssCodeSplit: true
  }
})
