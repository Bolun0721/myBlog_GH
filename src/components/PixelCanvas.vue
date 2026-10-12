<script setup>
import { computed, onMounted, ref } from 'vue'

/**
 * 32×32 单图层像素画板。
 *
 * 用一块 32×32 的 <canvas> 而不是 1024 个 DOM 格子：
 *  - 只有 1 个元素，落笔就是 ctx.fillRect，不需要为每个格子建响应式状态；
 *  - 缩放交给 CSS（image-rendering: pixelated），位图始终是 32×32，不重绘；
 *  - 导出直接 toDataURL，不必把格子再拼一遍。
 */

const SIZE = 32
const MIN_ZOOM = 8
const MAX_ZOOM = 28
const DEFAULT_ZOOM = 16

/** 导出倍数：按整数倍放大并不做插值，像素边缘保持硬朗 */
const EXPORT_SCALE = 16

/** DawnBringer 16 —— 像素画里最常用的 16 色盘，明度跨度够，混色不脏 */
const PALETTE = [
  '#140c1c',
  '#442434',
  '#30346d',
  '#4e4a4e',
  '#854c30',
  '#346524',
  '#d04648',
  '#757161',
  '#597dce',
  '#d27d2c',
  '#8595a1',
  '#6daa2c',
  '#d2aa99',
  '#6dc2ca',
  '#dad45e',
  '#deeed6'
]

const canvasEl = ref(null)
const stageEl = ref(null)

const color = ref(PALETTE[0])
const erasing = ref(false)
const zoom = ref(DEFAULT_ZOOM)

const cellSize = computed(() => `${zoom.value}px`)

/** 非响应式：像素数据只存在画布位图里，不需要 Vue 追踪 */
let ctx = null
let painting = false

function setup() {
  const el = canvasEl.value
  if (!el) return
  // 位图尺寸由模板上的 width/height 属性给定（32×32，一格一像素），
  // 这里只取绘图上下文。
  ctx = el.getContext('2d')
}

onMounted(() => {
  setup()

  // 默认缩放在窄屏会超出容器，按容器宽度先降到能放下的最大档
  const available = stageEl.value?.clientWidth ?? 0
  if (available) {
    // 只取偶数档，和滑杆的 step 对齐
    const fit = Math.floor(available / SIZE / 2) * 2
    zoom.value = Math.max(MIN_ZOOM, Math.min(DEFAULT_ZOOM, fit))
  }
})

/** 把指针位置换算成格子坐标。按比例算，因此与缩放倍数、滚动位置都无关。 */
function cellFrom(event) {
  const el = canvasEl.value
  if (!el) return null
  const rect = el.getBoundingClientRect()
  const col = Math.floor(((event.clientX - rect.left) / rect.width) * SIZE)
  const row = Math.floor(((event.clientY - rect.top) / rect.height) * SIZE)
  if (col < 0 || col >= SIZE || row < 0 || row >= SIZE) return null
  return { col, row }
}

function paint(event) {
  const cell = cellFrom(event)
  if (!cell || !ctx) return
  if (erasing.value) {
    ctx.clearRect(cell.col, cell.row, 1, 1)
  } else {
    ctx.fillStyle = color.value
    ctx.fillRect(cell.col, cell.row, 1, 1)
  }
}

function onPointerDown(event) {
  // 只响应鼠标左键；触摸与手写笔没有按键概念，放行
  if (event.pointerType === 'mouse' && event.button !== 0) return
  painting = true
  // 捕获指针：拖着画到画布外再拖回来也不会断线
  canvasEl.value?.setPointerCapture?.(event.pointerId)
  paint(event)
}

function onPointerMove(event) {
  if (!painting) return
  paint(event)
}

function onPointerUp() {
  painting = false
}

function pickColor(value) {
  color.value = value
  erasing.value = false
}

function toggleEraser() {
  erasing.value = !erasing.value
}

function exportPng() {
  const source = canvasEl.value
  if (!source) return

  const out = document.createElement('canvas')
  out.width = SIZE * EXPORT_SCALE
  out.height = SIZE * EXPORT_SCALE
  const outCtx = out.getContext('2d')
  if (!outCtx) return

  // 关掉插值，放大后仍是硬边像素
  outCtx.imageSmoothingEnabled = false
  outCtx.drawImage(source, 0, 0, out.width, out.height)

  // 交给 <a download> 触发下载，落盘位置由浏览器的下载设置决定
  const link = document.createElement('a')
  link.download = `timecat-pixel-${out.width}x${out.height}.png`
  link.href = out.toDataURL('image/png')
  link.click()
}
</script>

<template>
  <section class="pixel glass-card">
    <header class="pixel__head">
      <h2 class="pixel__title display">像素画板</h2>
      <p class="pixel__desc">
        32×32 单图层。点格子落笔，按住拖动可以连笔；画错了切到「橡皮」擦掉。
      </p>
    </header>

    <div ref="stageEl" class="pixel__stage">
      <canvas
        ref="canvasEl"
        class="pixel__canvas"
        :style="{ '--cell': cellSize }"
        :width="SIZE"
        :height="SIZE"
        role="img"
        :aria-label="`${SIZE} 乘 ${SIZE} 的像素画板，用鼠标点击格子作画`"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      />
    </div>

    <div class="pixel__tools">
      <div class="palette" role="group" aria-label="配色">
        <button
          v-for="item in PALETTE"
          :key="item"
          class="palette__swatch"
          :class="{ 'is-active': !erasing && color === item }"
          type="button"
          :style="{ '--swatch': item }"
          :aria-label="`选用颜色 ${item}`"
          :aria-pressed="!erasing && color === item"
          @click="pickColor(item)"
        />

        <button
          class="palette__swatch palette__swatch--eraser"
          :class="{ 'is-active': erasing }"
          type="button"
          aria-label="橡皮（擦除格子）"
          :aria-pressed="erasing"
          @click="toggleEraser"
        />
      </div>

      <div class="pixel__zoom">
        <label class="pixel__zoom-label" for="pixel-zoom">缩放</label>
        <input
          id="pixel-zoom"
          v-model.number="zoom"
          class="pixel__zoom-range"
          type="range"
          :min="MIN_ZOOM"
          :max="MAX_ZOOM"
          step="2"
        />
        <span class="pixel__zoom-value">{{ zoom }}px / 格</span>
      </div>

      <button class="pixel__export" type="button" @click="exportPng">导出 PNG</button>
    </div>

    <p class="pixel__hint">
      导出为 {{ SIZE * EXPORT_SCALE }}×{{ SIZE * EXPORT_SCALE }} 的 PNG（按 16 倍整数放大，像素边缘不插值）。
      未落笔的格子是透明的，方便再叠到别的底图上。画的内容不会保存，离开页面即清空。
    </p>
  </section>
</template>

<style scoped>
.pixel {
  padding: var(--sp-6);
}

.pixel__head {
  margin-bottom: var(--sp-5);
}

.pixel__title {
  font-size: var(--fs-2xl);
}

.pixel__desc {
  margin-top: var(--sp-2);
  max-width: 52ch;
  font-size: var(--fs-sm);
  color: var(--c-ink-muted);
}

.pixel__stage {
  display: flex;
  /* 放大超过容器宽时横向滚动，而不是把卡片撑破。
     内层用 margin: auto 居中：若改用 justify-content: center，
     内容超出时左侧会被裁掉（flex 居中的经典坑）。 */
  overflow: auto;
  padding: var(--sp-4);
  border: 1px solid var(--glass-line-soft);
  border-radius: var(--radius-card-sm);
  background-color: var(--glass-soft);
}

.pixel__canvas {
  margin: auto;
  /* 显示尺寸 = 格子数 × 每格像素，位图本身仍是 32×32 */
  width: calc(32 * var(--cell));
  height: calc(32 * var(--cell));
  /* 网格线画在 CSS 背景上而不是画布里，这样导出时不会把网格一起导出去。
     背景在画布位图之下，已落笔的格子会盖住网格线，空格子才显示网格。
     颜色调深过一档：太浅时在浅色底上看不出格子边界，落笔位置不好判断。 */
  --grid-line: rgba(17, 17, 17, 0.3);
  background-image:
    linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px);
  background-size: var(--cell) var(--cell);
  /* 放大后保持硬边像素，不要被插值糊掉 */
  image-rendering: pixelated;
  border: 1px solid var(--glass-line);
  border-radius: 2px;
  /* 触屏上拖动是画画而不是滚页面 */
  touch-action: none;
  cursor: crosshair;
}

.pixel__tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-4) var(--sp-5);
  margin-top: var(--sp-5);
}

.palette {
  display: grid;
  grid-template-columns: repeat(9, auto);
  gap: var(--sp-2);
}

.palette__swatch {
  width: 26px;
  height: 26px;
  border: var(--border-hair) solid var(--c-line);
  border-radius: var(--radius-xs);
  background-color: var(--swatch);
  transition: transform var(--dur-fast) var(--ease-out);
}

.palette__swatch:hover {
  transform: translateY(-2px);
}

/* 选中态：外圈再套一层，色块本身颜色不动，避免看不清选的是哪一色 */
.palette__swatch.is-active {
  outline: var(--border-thick) solid var(--c-ink);
  outline-offset: 2px;
}

.palette__swatch--eraser {
  background-color: var(--c-paper);
  /* 一道斜线表示「擦掉」，不占用 16 色里的任何一格 */
  background-image: linear-gradient(
    to top right,
    transparent calc(50% - 1px),
    var(--c-line) calc(50% - 1px),
    var(--c-line) calc(50% + 1px),
    transparent calc(50% + 1px)
  );
}

.pixel__zoom {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  font-size: var(--fs-sm);
  color: var(--c-ink-soft);
}

.pixel__zoom-range {
  width: 140px;
  height: 24px;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

.pixel__zoom-range::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: var(--radius-pill);
  background-color: rgba(17, 17, 17, 0.2);
}

.pixel__zoom-range::-moz-range-track {
  height: 4px;
  border-radius: var(--radius-pill);
  background-color: rgba(17, 17, 17, 0.2);
}

.pixel__zoom-range::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  margin-top: -5px;
  border: none;
  border-radius: 50%;
  background-color: var(--c-ink);
}

.pixel__zoom-range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: none;
  border-radius: 50%;
  background-color: var(--c-ink);
}

.pixel__zoom-value {
  min-width: 72px;
  font-variant-numeric: tabular-nums;
  color: var(--c-ink-muted);
}

.pixel__export {
  padding: var(--sp-2) var(--sp-5);
  border: var(--border-hair) solid var(--c-line);
  border-radius: var(--radius-sm);
  background-color: var(--glass-strong);
  font-family: var(--font-display);
  font-size: var(--fs-sm);
  transition:
    background-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);
}

.pixel__export:hover,
.pixel__export:focus-visible {
  background-color: var(--c-ink);
  color: var(--c-inverse);
}

.pixel__hint {
  margin-top: var(--sp-5);
  font-size: var(--fs-xs);
  line-height: var(--lh-snug);
  color: var(--c-ink-muted);
}

@media (max-width: 640px) {
  .pixel {
    padding: var(--sp-5) var(--sp-4);
    border-radius: var(--radius-card-sm);
  }

  .pixel__title {
    font-size: var(--fs-xl);
  }

  .palette {
    grid-template-columns: repeat(9, auto);
    gap: var(--sp-1);
  }

  .palette__swatch {
    width: 22px;
    height: 22px;
  }

  .pixel__tools {
    gap: var(--sp-4);
  }
}
</style>
