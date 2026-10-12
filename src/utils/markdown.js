import DOMPurify from 'dompurify'
import { marked } from 'marked'

/**
 * Markdown → 安全的 HTML。
 *
 * 两步缺一不可，职责要分清：
 *  1. marked 只做语法转换，**它不做任何净化**（官方文档明确要求自行配套净化器）。
 *     Markdown 语法本来就允许内嵌原始 HTML，所以它的输出天然可能带脚本。
 *  2. DOMPurify 负责把脚本、事件属性、javascript: 协议一类危险内容全部剔除。
 *
 * 「文章只有管理员能写」不是跳过净化的理由 ——
 * 管理员账号一旦被盗，或日后开放投稿，这里就是存储型 XSS 的入口。
 * 自己写正则来清洗 HTML 是这类漏洞最常见的来源，所以这里用成熟实现而不是手搓。
 */
marked.setOptions({ gfm: true, breaks: true })

// 让正文里的外链在新标签打开，并带上 noopener（防止目标页通过 window.opener 反向操作本页）
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('href')) {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

export function renderMarkdown(source) {
  const html = marked.parse(String(source ?? ''))
  return DOMPurify.sanitize(html)
}
