import contentData from './content.json'

/**
 * 站点内容真源：src/data/content.json
 *
 * 这是三个栏内容的唯一来源，和图片、音频一样属于项目资源：
 *  - 提交到 git，随构建一起部署；
 *  - /admin 的增删由本地 dev server 的写入接口直接改这个文件（见 dev/contentApiPlugin.js）；
 *  - 生产构建里管理接口不存在，站点只读这份内容。
 *
 * 数据结构（每个条目都必须有全局唯一的 id，管理页靠它定位要删除的条目）：
 *   draw        [{ id, src, alt }]                        画集图片
 *   musicCovers [{ id, src, alt }]                        音乐盒封面
 *   tracks      [{ id, title, artist, src, format, sizeMB }] 曲目，src 为音频地址
 *   projects    [{ id, title, description, link, cover, coverAlt }] 个人项目
 *
 * 也可以不用管理页，直接手改 content.json —— 保持合法 JSON 即可。
 */
export const bundledContent = contentData

export { SECTION_KEYS } from './sections'
