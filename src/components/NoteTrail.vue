<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 音符拖尾：鼠标划过与点击时在指针处生成随机音符，音符轻缓上浮、旋转并淡出。
 * 实现参考「音符拖尾」教程。
 *
 * 与教程的三处差异，都是为了让它能叠在一个**已有内容的页面**上：
 *  1. 教程里由 canvas 自己监听 mousemove/click，那样它会把页面的点击全部吃掉。
 *     这里 canvas 设成 pointer-events: none，事件改挂到 window 上，
 *     播放器按钮、进度条照常可点。
 *  2. 不做五线谱底纹。
 *  3. 字形只用前四种（♩♪♫♬）。
 */

/** 教程里有 7 种字形，这里只取前四种 */
const GLYPHS = ['♩', '♪', '♫', '♬']

const SPACING = 22 // 相邻音符的最小间距（px）
const SPAWN_INTERVAL = 45 // 两次生成之间的最短间隔（ms）
const MAX_NOTES = 520 // 同时在场的音符上限
const MAX_DPR = 2 // 高分屏缩放上限，避免 canvas 像素量爆炸

const canvasEl = ref(null)

let ctx = null
let notes = []
let rafId = 0
let lastT = 0
let lastSpawnAt = 0
let last = null
let width = 0
let height = 0
let ink = '#111111'

const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)

const rand = (min, max) => min + Math.random() * (max - min)

/**
 * 乐谱符号必须显式指定带这些字形的字体。
 * 不能落到站点的像素字体上 —— pixl 与隶行体都没有 ♪，会渲染成豆腐块。
 */
const noteFont = (size) => `${size}px 'Segoe UI Symbol', 'Apple Symbols', 'Noto Music', serif`

function resize() {
  const canvas = canvasEl.value
  if (!canvas || !ctx) return
  width = window.innerWidth
  height = window.innerHeight
  // 位图按物理像素铺满，再用 setTransform 缩放，之后一律按 CSS 像素绘制
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

/**
 * 时间节流。鼠标、点击、触摸共用同一个计时器，
 * 于是任意来源的生成频率都被压在同一个上限，这是不掉帧的关键。
 */
function shouldSpawn() {
  const now = performance.now()
  if (now - lastSpawnAt < SPAWN_INTERVAL) return false
  lastSpawnAt = now
  return true
}

function spawn(x, y, options = {}) {
  // 超上限时丢最旧的，防止数组无限增长
  if (notes.length > MAX_NOTES) notes.shift()

  notes.push({
    x,
    y,
    vx: options.vx ?? rand(-0.5, 0.5),
    vy: options.vy ?? rand(-1.4, -0.5),
    rot: rand(-0.5, 0.5),
    vr: rand(-1.2, 1.2),
    glyph: GLYPHS[(Math.random() * GLYPHS.length) | 0],
    size: options.size ?? rand(14, 26),
    ttl: options.ttl ?? rand(1.1, 1.9),
    life: 0,
    alpha: options.alpha ?? 0.8
  })
}

/** 只负责画，不推进时间 —— 减少动态效果的降级路径要单独用它 */
function drawNotes() {
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = ink

  for (let i = 0; i < notes.length; i += 1) {
    const n = notes[i]
    const p = Math.min(n.life / n.ttl, 1)
    const ease = 1 - (1 - p) ** 3 // easeOutCubic
    const alpha = n.alpha * (1 - p) ** 2 // 二次衰减淡出

    ctx.save()
    ctx.translate(n.x, n.y)
    ctx.rotate(n.rot)
    ctx.globalAlpha = Math.max(alpha, 0)
    ctx.font = noteFont(n.size * (1 - 0.12 * ease))
    ctx.fillText(n.glyph, 0, 0)
    ctx.restore()
  }

  ctx.globalAlpha = 1
}

function step(dt) {
  // 倒序遍历：一边绘制一边删除过期音符。正序 splice 会改变后续下标，导致漏项。
  for (let i = notes.length - 1; i >= 0; i -= 1) {
    const n = notes[i]
    n.life += dt
    if (n.life >= n.ttl) {
      notes.splice(i, 1)
      continue
    }

    n.x += n.vx
    n.y += n.vy
    n.vy -= 0.08 * dt * 60 // 持续减小 vy，音符越飘越快地往上浮
    n.rot += n.vr * dt
  }
}

function frame(ts) {
  // 帧间隔上限 40ms：标签页切回来时不会因为 dt 过大让音符瞬移
  const dt = Math.min(ts - (lastT || ts), 40) / 1000
  lastT = ts

  step(dt)
  drawNotes()

  rafId = requestAnimationFrame(frame)
}

function onPointerMove(event) {
  const x = event.clientX
  const y = event.clientY

  if (!last) {
    last = { x, y }
    return
  }

  // 距离 + 时间双重节流：快速划过时不会在一处叠一堆音符
  if (Math.hypot(x - last.x, y - last.y) >= SPACING && shouldSpawn()) {
    spawn(x, y)
  }
  last.x = x
  last.y = y
}

function onPointerDown(event) {
  if (!shouldSpawn()) return
  // 点击的音符更大、更亮、上浮更快
  spawn(event.clientX, event.clientY, {
    size: rand(26, 42),
    vy: rand(-2.2, -0.8),
    alpha: 0.9
  })
}

function onPointerOut() {
  // 指针离开窗口后重置起点，否则回来时会从边缘拉出一条长线
  last = null
}

function onReducedClick(event) {
  // 减少动态效果：不跑动画循环，只在点击处留一个静态音符
  notes = []
  spawn(event.clientX, event.clientY, { ttl: Number.MAX_SAFE_INTEGER, size: rand(26, 42) })
  drawNotes()
}

let reduced = false

onMounted(() => {
  ctx = canvasEl.value?.getContext('2d')
  if (!ctx) return

  // 颜色取自设计令牌，避免这里再硬编码一份 #111111
  ink = getComputedStyle(document.documentElement).getPropertyValue('--c-ink').trim() || ink

  resize()
  window.addEventListener('resize', resize)

  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    window.addEventListener('pointerdown', onReducedClick)
    return
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerdown', onPointerDown, { passive: true })
  window.addEventListener('pointerout', onPointerOut)
  rafId = requestAnimationFrame(frame)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('resize', resize)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerdown', onPointerDown)
  window.removeEventListener('pointerout', onPointerOut)
  window.removeEventListener('pointerdown', onReducedClick)
  notes = []
})
</script>

<template>
  <!-- 纯装饰层。pointer-events: none 是关键：绝不能拦住页面上的点击 -->
  <canvas ref="canvasEl" class="note-trail" aria-hidden="true" />
</template>

<style scoped>
.note-trail {
  position: fixed;
  top: 0;
  left: 0;
  z-index: var(--z-float);
  pointer-events: none;
}
</style>
