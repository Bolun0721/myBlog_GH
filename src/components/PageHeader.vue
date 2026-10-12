<script setup>
/**
 * 内页页头。画集 / 音乐盒 / 个人项目 三个页面共用，
 * 保证内页的大标题、说明与留白节奏完全一致。
 *
 * 做成毛玻璃卡片而不是直接压在背景图上：
 * 次要文字（--c-ink-muted）在浅色蒙层上对比度不够，
 * 放进玻璃里才能保证任何背景下都读得清。
 */
defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, default: '' }
})
</script>

<template>
  <header class="page-header glass-card">
    <p v-if="eyebrow" class="page-header__eyebrow display">{{ eyebrow }}</p>
    <h1 class="page-header__title display">{{ title }}</h1>
    <p v-if="description" class="page-header__desc">{{ description }}</p>
    <slot />
  </header>
</template>

<style scoped>
.page-header {
  padding: var(--sp-6);
}

.page-header__eyebrow {
  font-size: var(--fs-sm);
  letter-spacing: var(--ls-wide);
  color: var(--c-ink-muted);
}

.page-header__title {
  margin-top: var(--sp-2);
  font-size: var(--fs-3xl);
}

.page-header__desc {
  margin-top: var(--sp-3);
  max-width: 52ch;
  color: var(--c-ink-muted);
}

@media (max-width: 640px) {
  .page-header {
    padding: var(--sp-5) var(--sp-4);
    border-radius: var(--radius-card-sm);
  }

  .page-header__title {
    font-size: var(--fs-2xl);
  }
}
</style>
