<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Matter from 'matter-js'
import PageHeader from '@/components/PageHeader.vue'
import { playSfx, preloadSfx } from '@/utils/sfx'
import {
  CHECK_INTERVAL,
  COLORS,
  OVER_STREAK_LIMIT,
  SIZES,
  TOP_LINE,
  canMerge,
  clampX,
  isOverLine,
  mergeResult,
  pickStartLevel
} from '@/utils/suika'

const { Bodies, Composite, Engine, Events } = Matter

/**
 * 「合成大冰球」。玩法与参数来自教程，这里只做「物理世界 + 渲染 + 交互」的接线，
 * 等级、合并规则、判负条件都在 @/utils/suika 里，可以脱离界面单独测试。
 *
 * 关键取舍：物理世界用固定的逻辑尺寸（360×560），显示尺寸完全交给 CSS 缩放。
 * 这样窗口大小变化时不需要重建墙体、也不会改变手感 ——
 * 若改用真实像素做物理，每次 resize 都要把整套墙体和刚体重算一遍。
 */
const WORLD_W = 360
const WORLD_H = 560

/**
 * 合成音效。用 BASE_URL 拼而不是写死 '/audio/...'：
 * 静态版部署在 /仓库名/ 下，根绝对路径会 404，而组件代码不在同步脚本的改写范围内
 * （脚本只改写数据文件里的路径），所以这里必须自己跟着 base 走。
 */
const MERGE_SFX = `${import.meta.env.BASE_URL}audio/bingbingbing.mp3`

/** 两次掉落的最小间隔（ms）：没有它就能按住连点，在同一位置堆出一根柱子 */
const DROP_COOLDOWN = 260

/** 键盘每次左右移动的距离 */
const KEY_STEP = 14

/** 物理步长固定 60Hz。用累加器而不是「每帧一步」，
 *  否则在 120Hz 屏幕上物理会跑成两倍速。 */
const STEP = 1000 / 60

/** 飘分存活时长（ms） */
const POPUP_LIFE = 700

const BEST_KEY = 'timecat-suika-best'

const canvasEl = ref(null)
/** idle（未开始）| playing（进行中）| over（已判负） */
const state = ref('idle')
const score = ref(0)
const best = ref(0)
const nextLevel = ref(pickStartLevel())

/** 下一颗球的预览：直径直接沿用配置，颜色取等级色 */
const nextStyle = computed(() => ({
  width: `${SIZES[nextLevel.value]}px`,
  height: `${SIZES[nextLevel.value]}px`,
  backgroundColor: COLORS[nextLevel.value]
}))

// 以下都是非响应式状态：它们每帧都在变，交给 Vue 追踪只会白费开销
let engine = null
let world = null
let ctx = null
let rafId = 0
let observer = null
let lastTime = 0
let accumulator = 0
let lastDrop = 0
let lastCheck = 0
let hoverX = WORLD_W / 2
let overflowStreak = 0
let popups = []

/** 三面墙：左右与底。顶部留开口让球掉进来。墙没有 level，不参与合成与判负。 */
function buildWalls() {
  const t = 60
  return [
    Bodies.rectangle(-t / 2, WORLD_H / 2, t, WORLD_H * 2, { isStatic: true }),
    Bodies.rectangle(WORLD_W + t / 2, WORLD_H / 2, t, WORLD_H * 2, { isStatic: true }),
    Bodies.rectangle(WORLD_W / 2, WORLD_H + t / 2, WORLD_W * 2, t, { isStatic: true })
  ]
}

/**
 * 按等级合成。位置取两球中点，分数按新等级累加。
 *
 * `merged` 标记必须在移除刚体**之前**打上：一次 collisionStart 里可能同时有多对接触，
 * 先处理的一对标记掉之后，其余含它们的 pair 就会被 canMerge 拦掉，不会重复合成。
 */
function merge(a, b) {
  const result = mergeResult(a.level)
  a.merged = true
  b.merged = true

  const ball = Bodies.circle(
    (a.position.x + b.position.x) / 2,
    (a.position.y + b.position.y) / 2,
    SIZES[result.level] / 2,
    { label: 'ball', level: result.level, friction: 0.5, restitution: 0.15 }
  )

  Composite.remove(world, a)
  Composite.remove(world, b)
  Composite.add(world, ball)

  score.value += result.score
  popups.push({
    x: ball.position.x,
    y: ball.position.y - SIZES[result.level] / 2,
    text: `+${result.score}`,
    at: performance.now()
  })
  // 加分即合成成功，给一声反馈。连锁合成会连着响，playSfx 每次克隆一份，
  // 多个实例可以叠着播，不会互相截断。
  playSfx(MERGE_SFX)
}

function onCollision(event) {
  // 新合成的球是同帧才加入的，不会出现在本次已经算好的碰撞对里；
  // 它与周围同级球的接触会在下一帧再触发，形成自然的连锁合成。
  for (const pair of event.pairs) {
    if (canMerge(pair.bodyA, pair.bodyB)) merge(pair.bodyA, pair.bodyB)
  }
}

/** 越线判定：隔一段时间查一次，连续多次才算输，避免下落途中穿过红线被误判 */
function checkGameOver() {
  let high = false
  for (const body of Composite.allBodies(world)) {
    if (isOverLine(body)) {
      high = true
      break
    }
  }
  overflowStreak = high ? overflowStreak + 1 : 0
  if (overflowStreak >= OVER_STREAK_LIMIT && state.value === 'playing') {
    state.value = 'over'
    if (score.value > best.value) {
      best.value = score.value
      try {
        localStorage.setItem(BEST_KEY, String(best.value))
      } catch {
        // 隐私模式下 localStorage 会抛错：存不下最高分不影响游玩
      }
    }
  }
}

function draw(now) {
  const el = canvasEl.value
  if (!ctx || !el) return

  // 位图按显示尺寸 × devicePixelRatio 设定，这里统一缩放到逻辑坐标系，
  // 之后所有绘制都用 0~360 / 0~560 的物理坐标即可
  const scale = el.width / WORLD_W
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.clearRect(0, 0, WORLD_W, WORLD_H)

  // 危险红线
  ctx.save()
  ctx.setLineDash([6, 6])
  ctx.lineWidth = 1.5
  ctx.strokeStyle = 'rgba(206, 44, 44, 0.6)'
  ctx.beginPath()
  ctx.moveTo(0, TOP_LINE)
  ctx.lineTo(WORLD_W, TOP_LINE)
  ctx.stroke()
  ctx.restore()

  // 倒序遍历：与删除无关，只是保持一个固定的遍历习惯
  const bodies = Composite.allBodies(world)
  for (let i = bodies.length - 1; i >= 0; i -= 1) {
    const body = bodies[i]
    if (body.level === undefined) continue
    ctx.beginPath()
    ctx.arc(body.position.x, body.position.y, SIZES[body.level] / 2, 0, Math.PI * 2)
    ctx.fillStyle = COLORS[body.level]
    ctx.fill()
  }

  // 顶部半透明预览圆，跟着指针走
  if (state.value === 'playing') {
    const radius = SIZES[nextLevel.value] / 2
    ctx.globalAlpha = 0.4
    ctx.beginPath()
    ctx.arc(clampX(hoverX, radius, WORLD_W), radius + 4, radius, 0, Math.PI * 2)
    ctx.fillStyle = COLORS[nextLevel.value]
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // 飘分
  if (popups.length) {
    popups = popups.filter((item) => now - item.at < POPUP_LIFE)
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '700 18px system-ui, sans-serif'
    for (const item of popups) {
      const age = (now - item.at) / POPUP_LIFE
      ctx.globalAlpha = 1 - age
      ctx.fillStyle = '#0e3b68'
      ctx.fillText(item.text, item.x, item.y - age * 22)
    }
    ctx.restore()
  }
}

function loop(now) {
  rafId = requestAnimationFrame(loop)

  const elapsed = lastTime ? now - lastTime : STEP
  lastTime = now

  if (state.value === 'playing') {
    // 掉帧或切到后台再回来时，最多补 200ms，避免一次性追帧把堆叠炸开
    accumulator = Math.min(accumulator + elapsed, 200)
    while (accumulator >= STEP) {
      Engine.update(engine, STEP)
      accumulator -= STEP
    }
    if (now - lastCheck >= CHECK_INTERVAL) {
      lastCheck = now
      checkGameOver()
    }
  }

  draw(now)
}

/** 位图分辨率跟随显示尺寸，保证在高分屏上不糊、也不会白白按 3x 渲染 */
function resize() {
  const el = canvasEl.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  if (!rect.width) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const width = Math.max(1, Math.round(rect.width * dpr))
  const height = Math.max(1, Math.round(rect.height * dpr))
  if (el.width !== width || el.height !== height) {
    el.width = width
    el.height = height
  }
}

function drop() {
  if (state.value !== 'playing') return

  const now = performance.now()
  if (now - lastDrop < DROP_COOLDOWN) return
  lastDrop = now

  const level = nextLevel.value
  const radius = SIZES[level] / 2
  // 半径也要 clampX：球心太靠边会让圆越出墙体
  const body = Bodies.circle(clampX(hoverX, radius, WORLD_W), radius + 4, radius, {
    label: 'ball',
    level,
    friction: 0.5,
    restitution: 0.15
  })
  Composite.add(world, body)
  nextLevel.value = pickStartLevel()
}

function startGame() {
  // 只留墙体：非静态的一律清掉（Composite.clear 的第二个参数 keepStatic 传 false）
  Composite.clear(world, false)
  Composite.add(world, buildWalls())

  score.value = 0
  overflowStreak = 0
  popups = []
  accumulator = 0
  lastTime = 0
  lastCheck = performance.now()
  lastDrop = 0
  hoverX = WORLD_W / 2
  nextLevel.value = pickStartLevel()
  state.value = 'playing'

  // 用鼠标点「重新开始」后，焦点会停在那个按钮上：此时按空格会再次触发按钮
  // 而不是落球，用户会以为键盘失灵。开局顺手把焦点摘掉，键盘控制才是连续的。
  // （键盘用户主动 Tab 到按钮再按空格仍会重开，这是按钮本身应有的行为。）
  const active = document.activeElement
  if (active instanceof HTMLElement) active.blur()
}

function worldXFrom(event) {
  const el = canvasEl.value
  if (!el) return hoverX
  const rect = el.getBoundingClientRect()
  if (!rect.width) return hoverX
  return ((event.clientX - rect.left) / rect.width) * WORLD_W
}

function onPointerMove(event) {
  hoverX = worldXFrom(event)
}

function onPointerDown(event) {
  // 只响应鼠标左键；触摸与手写笔没有按键概念，放行
  if (event.pointerType === 'mouse' && event.button !== 0) return
  hoverX = worldXFrom(event)
  drop()
}

function onKeydown(event) {
  if (state.value !== 'playing') return

  if (event.key === 'ArrowLeft') {
    hoverX = Math.max(0, hoverX - KEY_STEP)
  } else if (event.key === 'ArrowRight') {
    hoverX = Math.min(WORLD_W, hoverX + KEY_STEP)
  } else if (event.key === ' ' || event.key === 'Enter') {
    drop()
  } else {
    return
  }
  // 只在真的用到了按键时才拦默认行为，否则会把页面滚动也一起锁死
  event.preventDefault()
}

onMounted(() => {
  // 13KB，先在开局前缓存好；等到第一次合成才去下载会明显慢半拍
  preloadSfx(MERGE_SFX)

  try {
    best.value = Number(localStorage.getItem(BEST_KEY)) || 0
  } catch {
    best.value = 0
  }

  engine = Engine.create({ enableSleeping: true })
  engine.gravity.y = 1.1
  world = engine.world
  Composite.add(world, buildWalls())
  Events.on(engine, 'collisionStart', onCollision)

  ctx = canvasEl.value?.getContext('2d') ?? null
  resize()

  observer = new ResizeObserver(resize)
  if (canvasEl.value) observer.observe(canvasEl.value)

  window.addEventListener('keydown', onKeydown)
  rafId = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  observer?.disconnect()
  window.removeEventListener('keydown', onKeydown)
  if (engine) {
    Events.off(engine, 'collisionStart', onCollision)
    Composite.clear(world, false)
    Engine.clear(engine)
  }
  engine = null
  world = null
  ctx = null
})
</script>

<template>
  <article class="stack">
    <PageHeader
      eyebrow="MINI GAME"
      title="合成大冰球"
      description="移动指针选好位置，点击（或按空格）把冰球丢下去。两颗同级的冰球撞在一起会合成更大的一颗，堆过上面那条红线就输了。"
    >
      <RouterLink class="back" to="/projects">← 返回个人项目</RouterLink>
    </PageHeader>

    <section class="game glass-card">
      <div class="hud">
        <p class="hud__stat">
          <span class="hud__label">得分</span>
          <strong class="hud__value display" aria-live="polite">{{ score }}</strong>
        </p>
        <p class="hud__stat">
          <span class="hud__label">最高</span>
          <strong class="hud__value display">{{ best }}</strong>
        </p>
        <p class="hud__stat">
          <span class="hud__label">下一个</span>
          <span class="hud__ball">
            <span class="hud__ball-dot" :style="nextStyle" />
          </span>
        </p>
        <button class="hud__action" type="button" @click="startGame">
          {{ state === 'playing' ? '重新开始' : '开始游戏' }}
        </button>
      </div>

      <div
        class="board"
        :aria-label="`合成大冰球棋盘，当前得分 ${score}`"
        @pointermove="onPointerMove"
        @pointerdown="onPointerDown"
      >
        <canvas ref="canvasEl" class="board__canvas" />

        <div v-if="state !== 'playing'" class="board__overlay">
          <p class="board__overlay-title display">
            {{ state === 'idle' ? '准备好了吗' : '堆过头了' }}
          </p>
          <p v-if="state === 'over'" class="board__overlay-score">本局得分 {{ score }}</p>
          <button class="board__overlay-btn" type="button" @click="startGame">
            {{ state === 'idle' ? '开始' : '再来一局' }}
          </button>
        </div>
      </div>

      <p class="hint">
        键盘：← → 左右移动，空格或回车落下。手机上直接用手指点选位置。最高分只记在这台设备上。
      </p>
    </section>
  </article>
</template>

<style scoped>
.back {
  display: inline-block;
  margin-top: var(--sp-4);
  padding-bottom: 2px;
  border-bottom: 2px solid var(--c-line);
  font-size: var(--fs-sm);
  transition: opacity var(--dur-fast) var(--ease-out);
}

.back:hover {
  opacity: 0.6;
}

.game {
  padding: var(--sp-6);
}

.hud {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-4) var(--sp-6);
}

.hud__stat {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}

.hud__label {
  font-size: var(--fs-xs);
  letter-spacing: var(--ls-wide);
  color: var(--c-ink-muted);
}

.hud__value {
  min-width: 3ch;
  font-size: var(--fs-xl);
  font-variant-numeric: tabular-nums;
}

/* 预览球尺寸随等级变化，用一个固定大小的盒子托住，HUD 不会跟着抖动 */
.hud__ball {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
}

.hud__ball-dot {
  border-radius: 50%;
}

.hud__action {
  margin-left: auto;
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

.hud__action:hover,
.hud__action:focus-visible {
  background-color: var(--c-ink);
  color: var(--c-inverse);
}

/* 棋盘宽度同时受三样东西约束：容器宽度、最大 360px（逻辑宽度的 1:1）、
   以及 46vh —— 46vh × (560/360) ≈ 72vh，保证竖屏时整块棋盘不会被挤出视口。
   高度由 aspect-ratio 推出来，与逻辑尺寸 360×560 严格一致。 */
.board {
  position: relative;
  width: min(100%, 360px, 46vh);
  aspect-ratio: 360 / 560;
  margin: var(--sp-5) auto 0;
  overflow: hidden;
  border: 1px solid var(--glass-line);
  border-radius: var(--radius-card-sm);
  background-color: var(--glass-soft);
  /* 触屏上在棋盘内拖动是瞄准而不是滚页面 */
  touch-action: none;
  cursor: pointer;
}

.board__canvas {
  width: 100%;
  height: 100%;
}

.board__overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: var(--sp-4);
  /* 偏实的白底：文字要压在球堆之上，透太多就读不清了 */
  background-color: rgba(255, 255, 255, 0.88);
}

.board__overlay-title {
  font-size: var(--fs-xl);
}

.board__overlay-score {
  font-size: var(--fs-sm);
  color: var(--c-ink-muted);
}

.board__overlay-btn {
  padding: var(--sp-2) var(--sp-6);
  border: var(--border-hair) solid var(--c-line);
  border-radius: var(--radius-pill);
  background-color: var(--c-ink);
  color: var(--c-inverse);
  font-family: var(--font-display);
  font-size: var(--fs-sm);
  transition: opacity var(--dur-fast) var(--ease-out);
}

.board__overlay-btn:hover {
  opacity: 0.78;
}

.hint {
  margin-top: var(--sp-5);
  font-size: var(--fs-xs);
  line-height: var(--lh-snug);
  color: var(--c-ink-muted);
}

@media (max-width: 640px) {
  .game {
    padding: var(--sp-5) var(--sp-4);
    border-radius: var(--radius-card-sm);
  }

  .hud {
    gap: var(--sp-3) var(--sp-5);
  }

  .hud__action {
    margin-left: 0;
  }
}
</style>
