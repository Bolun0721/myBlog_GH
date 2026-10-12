<script setup>
import { computed } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import NoteTrail from '@/components/NoteTrail.vue'
import { usePlayerStore } from '@/stores/player'

const player = usePlayerStore()

/** 进度条用 0~1000 的整数，避免浮点抖动 */
const SEEK_STEPS = 1000

const seekValue = computed(() =>
  player.duration ? Math.round((player.position / player.duration) * SEEK_STEPS) : 0
)

const progressText = computed(
  () => `${formatTime(player.position)} / ${formatTime(player.duration)}`
)

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function onSeek(event) {
  player.seek(Number(event.target.value) / SEEK_STEPS)
}

const playLabel = computed(() => {
  if (player.loading) return '加载中'
  return player.playing ? '暂停' : '播放'
})
</script>

<template>
  <article class="stack">
    <PageHeader
      eyebrow="MUSIC"
      title="音乐盒"
      description="所有音频都放在 public/audio/ 并设为 preload=none——在你按下播放之前，这里不会产生任何音频流量。"
    />

    <section class="player glass-card" aria-label="播放器">
      <div class="player__top">
        <div class="player__meta">
          <p class="player__label">正在播放</p>
          <p class="player__title display">{{ player.current.title }}</p>
          <p class="player__artist">{{ player.current.artist }}</p>
        </div>

        <div class="player__controls">
          <button class="player__ctrl" type="button" aria-label="上一首" @click="player.prev()">
            <span aria-hidden="true">◀◀</span>
          </button>
          <button
            class="player__ctrl player__ctrl--main"
            type="button"
            :aria-pressed="player.playing"
            :aria-label="playLabel"
            @click="player.toggle()"
          >
            <span aria-hidden="true">{{ player.playing ? '暂停' : '播放' }}</span>
          </button>
          <button class="player__ctrl" type="button" aria-label="下一首" @click="player.next()">
            <span aria-hidden="true">▶▶</span>
          </button>
        </div>
      </div>

      <div class="player__progress">
        <input
          class="player__seek"
          type="range"
          min="0"
          :max="SEEK_STEPS"
          :value="seekValue"
          :disabled="!player.duration"
          aria-label="播放进度"
          @input="onSeek"
        />
        <p class="player__time">{{ progressText }}</p>
      </div>

      <p v-if="player.error" class="player__error" role="alert">{{ player.error }}</p>
    </section>

    <section class="list glass-card" aria-label="曲目列表">
      <h2 class="list__heading display">曲目（{{ player.tracks.length }}）</h2>

      <ul class="list__items">
        <li v-for="(track, index) in player.tracks" :key="track.id">
          <button
            class="track"
            :class="{ 'track--active': index === player.currentIndex }"
            type="button"
            :aria-current="index === player.currentIndex ? 'true' : undefined"
            @click="player.select(index)"
          >
            <span class="track__index display">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="track__text">
              <span class="track__title">{{ track.title }}</span>
              <span class="track__artist">{{ track.artist }}</span>
            </span>
            <span class="track__format">{{ track.format }}</span>
            <span class="track__size">{{ track.sizeMB }} MB</span>
          </button>
        </li>
      </ul>
    </section>

    <!-- 鼠标拖尾音符。固定定位的全屏装饰层，不参与页面布局 -->
    <NoteTrail />
  </article>
</template>

<style scoped>
/* 毛玻璃配方由全局 .glass-card 提供，这里只给内边距 */
.player {
  padding: var(--sp-5) var(--sp-6) var(--sp-6);
}

.player__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-5);
}

.player__meta {
  min-width: 0;
}

.player__label {
  font-size: var(--fs-xs);
  letter-spacing: var(--ls-wide);
  color: var(--c-ink-muted);
}

.player__title {
  margin-top: var(--sp-1);
  font-size: var(--fs-xl);
  /* 长曲名不换行撑破卡片 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player__artist {
  margin-top: var(--sp-1);
  font-size: var(--fs-sm);
  color: var(--c-ink-muted);
}

.player__controls {
  flex: none;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.player__ctrl {
  display: grid;
  place-items: center;
  min-width: 44px;
  min-height: 44px;
  padding-inline: var(--sp-3);
  border: 1px solid var(--c-line);
  border-radius: var(--radius-sm);
  font-family: var(--font-display);
  font-size: var(--fs-sm);
  transition:
    background-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);
}

.player__ctrl:hover,
.player__ctrl:focus-visible {
  background-color: var(--c-ink);
  color: var(--c-inverse);
}

.player__ctrl--main {
  min-width: 84px;
  background-color: var(--c-ink);
  color: var(--c-inverse);
}

.player__ctrl--main:hover,
.player__ctrl--main:focus-visible {
  background-color: var(--c-ink-soft);
}

.player__progress {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  margin-top: var(--sp-5);
}

.player__time {
  flex: none;
  min-width: 92px;
  text-align: right;
  font-family: var(--font-display);
  font-size: var(--fs-xs);
  color: var(--c-ink-muted);
  font-variant-numeric: tabular-nums;
}

/* 用原生 range 换取键盘可操作与无障碍语义，只做最小外观改写 */
.player__seek {
  flex: 1 1 auto;
  min-width: 0;
  height: 24px;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

.player__seek::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: var(--radius-pill);
  background-color: rgba(17, 17, 17, 0.2);
}

.player__seek::-moz-range-track {
  height: 4px;
  border-radius: var(--radius-pill);
  background-color: rgba(17, 17, 17, 0.2);
}

.player__seek::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  margin-top: -5px;
  border: none;
  border-radius: 50%;
  background-color: var(--c-ink);
}

.player__seek::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: none;
  border-radius: 50%;
  background-color: var(--c-ink);
}

.player__seek:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.player__error {
  margin-top: var(--sp-4);
  padding: var(--sp-3) var(--sp-4);
  border: 1px solid var(--c-line);
  border-radius: var(--radius-sm);
  background-color: var(--glass-soft);
  font-size: var(--fs-sm);
}

.list {
  padding: var(--sp-5) var(--sp-6) var(--sp-6);
}

.list__heading {
  font-size: var(--fs-md);
  letter-spacing: var(--ls-wide);
  color: var(--c-ink-muted);
}

.list__items {
  margin-top: var(--sp-4);
  border-top: 1px solid var(--glass-line-soft);
}

.track {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: var(--sp-4);
  width: 100%;
  padding: var(--sp-3) var(--sp-3);
  border-bottom: 1px solid var(--glass-line-soft);
  text-align: left;
  transition: background-color var(--dur-fast) var(--ease-out);
}

.track:hover,
.track:focus-visible {
  background-color: var(--glass-soft);
}

.track--active {
  background-color: var(--glass-soft);
}

.track--active .track__index {
  color: var(--c-ink);
}

.track__index {
  font-size: var(--fs-sm);
  color: var(--c-ink-muted);
}

.track__text {
  display: flex;
  align-items: baseline;
  gap: var(--sp-3);
  min-width: 0;
}

.track__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track--active .track__title {
  font-weight: 600;
}

.track__artist {
  flex: none;
  font-size: var(--fs-xs);
  color: var(--c-ink-muted);
}

.track__format {
  padding: 1px var(--sp-2);
  border: 1px solid rgba(17, 17, 17, 0.22);
  border-radius: var(--radius-xs);
  font-family: var(--font-display);
  font-size: var(--fs-xs);
  color: var(--c-ink-muted);
}

.track__size {
  min-width: 62px;
  text-align: right;
  font-size: var(--fs-xs);
  color: var(--c-ink-muted);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 640px) {
  .player__top {
    flex-direction: column;
    align-items: stretch;
    gap: var(--sp-4);
  }

  .player__controls {
    justify-content: space-between;
  }

  .track {
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: var(--sp-3);
  }

  /* 窄屏优先保证标题不被挤断，体积提示让位 */
  .track__size {
    display: none;
  }

  .track__text {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
}
</style>
