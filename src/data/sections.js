/**
 * 需要管理与持久化的栏位清单。
 *
 * 单独成文件是为了让三处共用同一份定义、避免写两份而失配：
 *  - 客户端 store（src/stores/content.js）
 *  - 管理页（src/views/Admin.vue）
 *  - 服务端写入接口（dev/contentApiPlugin.js，在 Node 里直接 import 本文件）
 *
 * 因此这里只能写最朴素的 ESM，不要引入任何依赖 Vite 的语法或 JSON 导入。
 */
export const SECTION_KEYS = ['draw', 'musicCovers', 'tracks', 'projects']
