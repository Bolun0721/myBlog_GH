<script setup>
import { socialLinks } from '@/data/site'

/**
 * 主页社交图标（哔哩哔哩 / GitHub）。
 *
 * 链接在 src/data/site.js 的 socialLinks 里配置，填上 href 即自动变为可点击外链。
 * href 留空时仍渲染图标（方便先确认位置），但不可点击，悬停提示会标注「链接待填写」。
 *
 * 图标用内联 SVG 而不是图片或图标字体：两个图标约 1KB，且省掉一次请求。
 */
const items = socialLinks.map((link) => ({ ...link, enabled: Boolean(link.href) }))

const tipFor = (item) => (item.enabled ? item.label : `${item.label}（链接待填写）`)
</script>

<template>
  <ul class="social" aria-label="社交主页">
    <li v-for="item in items" :key="item.id">
      <a
        class="social__link"
        :class="{ 'social__link--pending': !item.enabled }"
        :href="item.enabled ? item.href : undefined"
        :target="item.enabled ? '_blank' : undefined"
        :rel="item.enabled ? 'noopener noreferrer' : undefined"
        :aria-label="tipFor(item)"
        :aria-disabled="item.enabled ? undefined : 'true'"
      >
        <!-- 哔哩哔哩：电视机身 + 两根天线 + 两个眼条 -->
        <svg v-if="item.id === 'bilibili'" class="social__icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect class="social__solid" x="2.6" y="6" width="18.8" height="13.4" rx="3.6" />
          <path class="social__line" d="M6.9 2.2 9.7 6.8" />
          <path class="social__line" d="M17.1 2.2 14.3 6.8" />
          <rect class="social__eye" x="8.4" y="10.8" width="1.7" height="3.7" rx="0.85" />
          <rect class="social__eye" x="13.9" y="10.8" width="1.7" height="3.7" rx="0.85" />
        </svg>

        <!-- GitHub：官方 octocat 标记 -->
        <svg v-else class="social__icon" viewBox="0 0 16 16" aria-hidden="true">
          <path
            class="social__solid"
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"
          />
        </svg>

        <span class="social__tip" role="tooltip">{{ tipFor(item) }}</span>
      </a>
    </li>
  </ul>
</template>

<style scoped>
.social {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}

.social__link {
  position: relative;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  /* 底色始终偏实：图标里的「眼睛」用纸白挖空，若背景太透会把眼睛一起吃掉 */
  background-color: var(--glass-strong);
  border: var(--border-hair) solid var(--c-line);
  border-radius: var(--radius-sm);
  color: var(--c-ink);
  transition:
    transform var(--dur-base) var(--ease-out),
    box-shadow var(--dur-base) var(--ease-out);
}

.social__link:hover,
.social__link:focus-visible {
  transform: translateY(-3px);
  box-shadow: var(--glass-shadow);
}

.social__link--pending {
  border-style: dashed;
  border-color: var(--c-ink-muted);
  color: var(--c-ink-muted);
  cursor: default;
}

.social__link--pending:hover {
  transform: none;
  box-shadow: none;
}

.social__icon {
  width: 22px;
  height: 22px;
}

.social__solid {
  fill: currentColor;
}

.social__line {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
}

/* 用纸白挖出眼睛，与容器底色一致 */
.social__eye {
  fill: var(--c-paper);
}

.social__tip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  z-index: 2;
  padding: var(--sp-1) var(--sp-3);
  border-radius: var(--radius-sm);
  background-color: var(--c-ink);
  color: var(--c-inverse);
  font-size: var(--fs-xs);
  line-height: 1.4;
  white-space: nowrap;
  opacity: 0;
  transform: translate(-50%, 4px);
  pointer-events: none;
  transition:
    opacity var(--dur-fast) var(--ease-out),
    transform var(--dur-fast) var(--ease-out);
}

.social__link:hover .social__tip,
.social__link:focus-visible .social__tip {
  opacity: 1;
  transform: translate(-50%, 0);
}

@media (prefers-reduced-motion: reduce) {
  .social__link:hover,
  .social__link:focus-visible {
    transform: none;
  }
}
</style>
