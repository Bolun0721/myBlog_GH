<script setup>
import { RouterLink } from 'vue-router'

/**
 * 统一站内导航链接。
 *
 * 效果取自原 Test.html / testST.css 的「两侧黑条对向铺满」动效，
 * 但在原实现上修了三处：
 *  1. 原版用负 z-index + 父级 z-index:1 的层叠技巧，改用 overflow 裁切 + 正层级，语义清晰；
 *  2. 原版动效只覆盖按钮，这里同时接管导航的选中态，全站交互语言因此统一；
 *  3. 直接引用 RouterLink 组件对象而非 <component :is="'router-link'"> 字符串写法——
 *     后者会丢掉 RouterLink 的 props 解析，渲染出没有 href 的 <a>，
 *     既无法被键盘聚焦，也不会被读屏和爬虫识别为链接。
 */
defineProps({
  /** 站内路径 */
  to: { type: String, required: true },
  /** 尺寸 */
  size: { type: String, default: 'md' }
})
</script>

<template>
  <!-- 不加 .glass：底色已是 78% 白的近实底，模糊几乎看不出来，不值得多一层独立合成 -->
  <RouterLink :to="to" class="fill-link" :class="`fill-link--${size}`">
    <span class="fill-link__bar fill-link__bar--start" aria-hidden="true" />
    <span class="fill-link__bar fill-link__bar--end" aria-hidden="true" />
    <span class="fill-link__label"><slot /></span>
  </RouterLink>
</template>

<style scoped>
.fill-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: var(--sp-2) var(--sp-5);
  border: var(--border-hair) solid var(--c-line);
  border-radius: var(--radius-sm);
  /* 底色是 78% 白的近实底，靠它自己就够，不再叠 backdrop-filter：
     模糊在小尺寸、近实底上几乎不可见，却要多一层独立合成。 */
  background-color: var(--glass-strong);
  color: var(--c-ink);
  font-family: var(--font-display);
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: var(--ls-tight);
  white-space: nowrap;
  transition:
    color var(--dur-slow) var(--ease-out),
    box-shadow var(--dur-base) var(--ease-out),
    transform var(--dur-base) var(--ease-out);
}

.fill-link--sm {
  padding: var(--sp-1) var(--sp-3);
  font-size: var(--fs-sm);
}

.fill-link--md {
  font-size: var(--fs-md);
}

/* 两侧黑条：hover 时各自铺开一半，合起来正好填满 */
.fill-link__bar {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: var(--c-ink);
  transition: width var(--dur-slow) var(--ease-in-out);
}

.fill-link__bar--start {
  left: 0;
}

.fill-link__bar--end {
  right: 0;
}

.fill-link__label {
  position: relative;
  z-index: 1;
}

.fill-link:hover,
.fill-link:focus-visible {
  color: var(--c-inverse);
  box-shadow: var(--glass-shadow);
  transform: translateY(-2px);
}

.fill-link:hover .fill-link__bar,
.fill-link:focus-visible .fill-link__bar {
  width: 50%;
}

.fill-link:active {
  transform: translateY(0);
}

/* 当前页常驻填充态，用户始终知道自己在哪 */
.fill-link.router-link-exact-active {
  color: var(--c-inverse);
}

.fill-link.router-link-exact-active .fill-link__bar {
  width: 50%;
}

@media (prefers-reduced-motion: reduce) {
  .fill-link:hover {
    transform: none;
  }
}
</style>
