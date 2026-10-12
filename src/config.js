/**
 * 站点级开关。
 *
 * ADMIN_ENABLED：内容管理的人工总开关。
 *   - true  → 本地开发时可访问 /admin 增删内容；
 *   - false → 彻底关掉：路由不注册（访问 /admin 落到 404）、页脚入口消失。
 *
 * ADMIN_AVAILABLE：实际是否启用。除了总开关，还要求当前是 dev server ——
 * 写入接口由 dev/contentApiPlugin.js 提供（apply: 'serve'），生产构建里根本不存在，
 * 所以线上站点天然是只读的，管理页与相关代码也不会进产物。
 */
export const ADMIN_ENABLED = true

export const ADMIN_AVAILABLE = ADMIN_ENABLED && import.meta.env.DEV
