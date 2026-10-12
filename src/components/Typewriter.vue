<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

/**
 * 打字机：文字逐个出现 → 停顿 → 像 Backspace 一样倒退 → 循环。
 *
 * 核心状态只有两个：已显示字符数 n 和阶段 phase，
 * 显示内容永远是 text.slice(0, n) —— 加字 n++、减字 n--，天然对称。
 * 停顿用 setTimeout 递归实现，间隔就是速度。
 */
const props = defineProps({
  /** 要逐字打出的文案（单句循环） */
  text: { type: String, required: true },
  /** 打字间隔（ms） */
  speed: { type: Number, default: 120 },
  /** 倒退间隔，比打字快一些更像连续按 Backspace */
  eraseSpeed: { type: Number, default: 60 },
  /** 播完后的停顿，也是光标闪烁的时长 */
  pauseTime: { type: Number, default: 1600 },
  /** 开场与换句前的短停顿 */
  restartDelay: { type: Number, default: 420 }
})

/** 系统开启「减少动态效果」时直接展示完整文案，不做逐字动画 */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const displayed = ref(reducedMotion ? props.text : '')
const phase = ref('typing')

let timer = null
let n = reducedMotion ? props.text.length : 0

function clearTimer() {
  clearTimeout(timer)
  timer = null
}

function type() {
  if (n < props.text.length) {
    n += 1
    displayed.value = props.text.slice(0, n)
    phase.value = 'typing'
    timer = setTimeout(type, props.speed)
  } else {
    phase.value = 'pausing'
    timer = setTimeout(erase, props.pauseTime)
  }
}

function erase() {
  if (n > 0) {
    n -= 1
    displayed.value = props.text.slice(0, n)
    phase.value = 'erasing'
    timer = setTimeout(erase, props.eraseSpeed)
  } else {
    // 删完重新打同一句，形成循环
    timer = setTimeout(type, props.restartDelay)
  }
}

function restart() {
  clearTimer()
  n = reducedMotion ? props.text.length : 0
  displayed.value = reducedMotion ? props.text : ''
  phase.value = 'typing'
  if (!reducedMotion) timer = setTimeout(type, props.restartDelay)
}

onMounted(() => {
  if (!reducedMotion) timer = setTimeout(type, props.restartDelay)
})

// 卸载必须清理定时器：否则会继续对已销毁组件的 ref 赋值，造成泄漏与告警
onBeforeUnmount(clearTimer)

// 文案被改（例如从管理页改了个人简介）时从头重播
watch(() => props.text, restart)
</script>

<template>
  <p class="typewriter">
    <!-- 动画部分对读屏隐藏：逐字播报没法听；完整文案单独给一份 -->
    <span class="visually-hidden">{{ text }}</span>
    <span class="typewriter__text" aria-hidden="true">{{ displayed }}</span>
    <span
      class="typewriter__cursor"
      :class="{ 'is-blinking': phase !== 'typing' }"
      aria-hidden="true"
    />
  </p>
</template>

<style scoped>
.typewriter {
  /* 固定最小高度：文字从空到满的过程中容器高度不能变，否则下方内容会跟着跳。
     用 em 表示，字号变时间距一起等比缩放。 */
  min-height: 3em;
  font-family: var(--font-display);
  /* 字号留给使用方通过 --typewriter-font-size 调整，默认用正文小字 */
  font-size: var(--typewriter-font-size, var(--fs-sm));
  line-height: 1.5;
  color: var(--c-ink-soft);
  /* 窄列里中文长句要能正常折行而不是溢出 */
  word-break: break-word;
}

.typewriter__text {
  /* 保留行尾空白，避免最后一个字与光标贴在一起 */
  white-space: pre-wrap;
}

.typewriter__cursor {
  display: inline-block;
  width: 0.55em;
  height: 1.05em;
  margin-left: 2px;
  vertical-align: -0.15em;
  /* 方块光标跟随文字颜色 */
  background-color: currentColor;
}

.typewriter__cursor.is-blinking {
  /* steps 让可见性阶跃变化，才是「闪」；用默认缓动会变成「呼吸」 */
  animation: typewriter-blink 0.75s steps(2, start) infinite;
}

@keyframes typewriter-blink {
  to {
    visibility: hidden;
  }
}
</style>
