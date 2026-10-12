import { ref } from 'vue'

/**
 * 静态版专用：需要服务端的功能被点击时给出的说明。
 *
 * 纯静态站点没有服务端，登录、注册、发布内容这些都无从实现。
 * 这里刻意不用 window.alert / window.confirm —— 原生模态对话框会阻塞渲染进程的
 * JS 线程，自动化工具没挂对话框处理器时会把页面和工具一起卡死（这个坑踩过一次）。
 * 改为页内弹层，行为可预测，也能被键盘操作。
 */

export const STATIC_NOTICE = {
  title: '静态展示版',
  text: '这是一个纯静态网页（托管在 GitHub Pages 上），没有服务端，因此无法实现登录、注册和发布内容。这里的按钮仅作展示。'
}

/** 多久没人操作就自动收起，免得一直挡着页面 */
const AUTO_CLOSE_MS = 9000

export const staticNoticeVisible = ref(false)

let timer = 0

export function showStaticNotice() {
  staticNoticeVisible.value = true
  if (timer) window.clearTimeout(timer)
  timer = window.setTimeout(closeStaticNotice, AUTO_CLOSE_MS)
}

export function closeStaticNotice() {
  if (timer) {
    window.clearTimeout(timer)
    timer = 0
  }
  staticNoticeVisible.value = false
}
