<script setup>
import { computed, onMounted } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { appleIcons } from '@/data/site'

/**
 * 悬浮苹果开关：全站唯一的播放控制入口。
 *
 * 原实现是 .apple_btn { position: fixed; top: 75%; left: 95% }，
 * 按钮在窄屏和小窗口下会直接跑出视口；这里改成贴右下角并避让安全区。
 */
const player = usePlayerStore()

const icon = computed(() => (player.playing ? appleIcons.playing : appleIcons.idle))
const label = computed(() => (player.playing ? `暂停《${player.current.title}》` : '播放背景音乐'))

onMounted(() => {
  // 预载「播放中」图标。
  // 原 JS 每次 play/pause 都把 src 拼成 apple1.png?时间戳 来强制刷新，
  // 导致每次切换都重新下载一张图；预载一次后交给浏览器缓存即可。
  const preload = new Image()
  preload.src = appleIcons.playing
})
</script>

<template>
  <div class="apple">
    <p v-if="player.playing" class="apple__now">
      <span class="apple__dot" aria-hidden="true" />
      <span class="apple__now-text">{{ player.current.title }}</span>
    </p>
    <button
      class="apple__btn"
      type="button"
      :aria-pressed="player.playing"
      :aria-label="label"
      :title="label"
      @click="player.toggle()"
    >
      <img :src="icon" alt="" width="40" height="40" />
    </button>
  </div>
</template>

<style scoped>
.apple {
  position: fixed;
  right: var(--sp-5);
  /* 同时用 bottom 与 env() 避让 iOS 底部安全区 */
  bottom: calc(var(--sp-5) + env(safe-area-inset-bottom, 0px));
  z-index: var(--z-float);
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}

.apple__now {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  max-width: 220px;
  padding: var(--sp-2) var(--sp-4);
  border: 1px solid var(--glass-line);
  border-radius: var(--radius-pill);
  background-color: var(--glass-strong);
  box-shadow: var(--glass-shadow-sm);
  font-size: var(--fs-xs);
  color: var(--c-ink-soft);
}

.apple__now-text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 一个纯 CSS 的呼吸圆点，替代额外的动图资源 */
.apple__dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--c-ink);
  animation: pulse 1.6s var(--ease-in-out) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.35;
    transform: scale(0.7);
  }
}

.apple__btn {
  flex: none;
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border: var(--border-hair) solid var(--c-line);
  border-radius: 50%;
  /* 玻璃材质 + 墨线描边：与站内其它按钮保持同一套语言 */
  background-color: var(--glass-strong);
  box-shadow: var(--glass-shadow-sm);
  transition:
    transform var(--dur-base) var(--ease-out),
    box-shadow var(--dur-base) var(--ease-out);
}

.apple__btn:hover,
.apple__btn:focus-visible {
  transform: translateY(-3px) rotate(-6deg);
  box-shadow: var(--glass-shadow);
}

.apple__btn:active {
  transform: translateY(0) rotate(0deg);
}

.apple__btn img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

@media (max-width: 640px) {
  .apple {
    right: var(--sp-4);
    bottom: calc(var(--sp-4) + env(safe-area-inset-bottom, 0px));
    /* 窄屏让出宽度，避免 now-playing 药丸压住正文 */
    flex-direction: column-reverse;
    align-items: flex-end;
  }

  .apple__btn {
    width: 48px;
    height: 48px;
  }

  .apple__btn img {
    width: 32px;
    height: 32px;
  }

  .apple__now {
    max-width: 60vw;
  }
}

@media (prefers-reduced-motion: reduce) {
  .apple__btn:hover,
  .apple__btn:focus-visible {
    transform: none;
  }

  .apple__dot {
    animation: none;
  }
}
</style>
