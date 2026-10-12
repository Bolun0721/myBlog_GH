<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 数字时钟，只显示小时与分钟，放在导航栏正中。
 *
 * 每秒读一次时间即可：写入的是字符串，值没变时 ref 不会触发重渲染，
 * 所以真正更新 DOM 的频率就是每分钟一次，开销可以忽略。
 * 相比「算出到下一分钟的毫秒数再 setTimeout」，这样写更简单，
 * 也不会因为标签页被后台节流而让时间停摆后再也不校正。
 */
const time = ref('')

const pad = (n) => String(n).padStart(2, '0')

function tick() {
  const now = new Date()
  time.value = `${pad(now.getHours())}:${pad(now.getMinutes())}`
}

let timer = null

onMounted(() => {
  tick()
  timer = setInterval(tick, 1000)
})

// 卸载时清理：否则组件销毁后定时器仍在跑
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <!-- datetime 用机器可读格式，视觉上仍显示 HH:MM -->
  <time class="clock display" :datetime="time" :title="`当前时间 ${time}`">{{ time }}</time>
</template>

<style scoped>
.clock {
  font-size: var(--fs-md);
  letter-spacing: var(--ls-tight);
  /* 等宽数字：否则秒位跳变时整块时钟会左右抖动 */
  font-variant-numeric: tabular-nums;
  color: var(--c-ink);
  white-space: nowrap;
}

@media (max-width: 640px) {
  .clock {
    font-size: var(--fs-base);
  }
}
</style>
