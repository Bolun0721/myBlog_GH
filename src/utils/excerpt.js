/**
 * 纯文本摘要。
 *
 * 刻意与 utils/markdown.js 分开：那个文件会引入 marked + dompurify（约 75KB），
 * 而文章列表页只用到这个截断函数，不该为了它把整个 Markdown 渲染器也拉下来。
 */

/** 从 Markdown 源码里裁一小段纯文本，用于列表页 */
export function plainExcerpt(source, maxChars = 120) {
  const text = String(source ?? '')
    .replace(/```[\s\S]*?```/g, ' ') // 代码块
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // 图片
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 链接保留文字
    .replace(/[#>*_`~\-]+/g, ' ') // 各类标记符
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > maxChars ? `${text.slice(0, maxChars)}…` : text
}
