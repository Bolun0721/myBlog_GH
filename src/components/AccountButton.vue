<script setup>
import { showStaticNotice } from '@/utils/staticNotice'

/**
 * 导航栏右侧的圆形账号入口（静态版）。
 *
 * 外观与原版完全一致，但站点没有服务端，登录注册无从实现，
 * 所以它不是链接、不跳转，点击只弹一条说明。
 * 用 <button> 而不是 <a>/<RouterLink>：它不导航，语义上就该是按钮，
 * 也能被键盘聚焦和触发。
 */
const label = '登录 / 注册（静态展示版，功能不可用）'
</script>

<template>
  <button class="account" type="button" :aria-label="label" :title="label" @click="showStaticNotice">
    <svg class="account__icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle class="account__solid" cx="12" cy="7.6" r="4.2" />
      <path class="account__solid" d="M3.6 21.4c0-4.6 3.8-8.4 8.4-8.4s8.4 3.8 8.4 8.4v.6H3.6z" />
    </svg>
  </button>
</template>

<style scoped>
.account {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: var(--border-hair) solid var(--c-line);
  /* 圆形：需求要的就是一个圆形 icon */
  border-radius: 50%;
  background-color: var(--glass-strong);
  color: var(--c-ink);
  cursor: pointer;
  transition:
    transform var(--dur-fast) var(--ease-out),
    background-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);
}

.account:hover,
.account:focus-visible {
  transform: translateY(-2px);
  background-color: var(--c-ink);
  color: var(--c-inverse);
}

.account__icon {
  width: 20px;
  height: 20px;
}

.account__solid {
  fill: currentColor;
}

@media (prefers-reduced-motion: reduce) {
  .account:hover,
  .account:focus-visible {
    transform: none;
  }
}
</style>
