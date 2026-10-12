/** 站点级静态资源与链接配置（这些不参与内容管理，是写死在代码里的） */

/** 吉祥物：仅作装饰性跑动动画，不承载信息，因此不需要 alt */
export const mascot = { src: '/myBlog_GH/images/niro1.png' }

/**
 * hero 跑道上的小猫队列，紧挨着吉祥物从左到右排开、一样站在那条虚线上。
 * 纯装饰，所以 alt 留空。
 */
export const heroCats = [
  '/myBlog_GH/images/Cat1.webp',
  '/myBlog_GH/images/Cat2.webp',
  '/myBlog_GH/images/Cat3.webp',
  '/myBlog_GH/images/Cat4.webp',
  '/myBlog_GH/images/Cat5.webp'
]

/**
 * 点击吉祥物小人时播放的音效。
 * 文件名保持 ASCII：中文、空格、& 这类字符在 URL 里需要额外编码，部署时容易踩坑。
 */
export const mascotSfx = '/myBlog_GH/audio/nero-click.ogg'

/** hero 右侧的个人资料：头像卡片与打字机文案 */
export const profile = {
  id: '拉菲不非',
  avatar: '/myBlog_GH/images/my_head.webp',
  motto: '时间啊停滞吧，你是如此的美丽'
}

/** 音频开关按钮图标 */
export const appleIcons = { idle: '/myBlog_GH/images/apple1.png', playing: '/myBlog_GH/images/apple2.png' }

/**
 * 网页背景图列表。
 *
 * 每次「重新进入」站点时按顺序轮换到下一张；同一会话内（含刷新页面）保持不变。
 * 轮换逻辑见 src/stores/background.js。
 *
 * 新增背景：把图片放进 public/images/，再在这里加一行即可。
 * 建议先压到 1920px 长边、转成 WebP —— 背景图每次进站都要下载，
 * 原始 JPG 往往十几 MB（本项目这 6 张原图合计 27MB，压完只有 1.2MB）。
 */
export const backgrounds = [
  '/myBlog_GH/images/bgi1.webp',
  '/myBlog_GH/images/bgi2.webp',
  '/myBlog_GH/images/bgi3.webp',
  '/myBlog_GH/images/bgi4.webp',
  '/myBlog_GH/images/bgi5.webp',
  '/myBlog_GH/images/bgi6.webp'
]

/**
 * 主页社交图标。
 *
 * href 留空时图标仍会显示（方便先看位置），但不可点击，悬停提示会标注「链接待填写」。
 */
export const socialLinks = [
  { id: 'bilibili', label: '哔哩哔哩', href: 'https://space.bilibili.com/525703803?spm_id_from=333.1365.0.0' },
  { id: 'github', label: 'GitHub', href: 'https://github.com/Bolun0721' }
]
