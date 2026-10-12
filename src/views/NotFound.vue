<script setup>
import FillLink from '@/components/FillLink.vue'
</script>

<template>
  <article class="nf glass-card">
    <p class="nf__code display">404</p>
    <h1 class="nf__title display">这只猫也没找到这个页面</h1>
    <p class="nf__desc">链接可能已经失效，或者地址输错了。</p>
    <FillLink to="/" size="md">回到首页</FillLink>
  </article>
</template>

<style scoped>
.nf {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--sp-3);
  padding: var(--sp-8) var(--sp-6);
}

.nf__code {
  font-size: var(--fs-4xl);
  line-height: 1;
  /* 半透明墨色：--c-line-soft 是接近白的浅灰，压在毛玻璃上会看不见 */
  color: rgba(17, 17, 17, 0.22);
}

.nf__title {
  font-size: var(--fs-2xl);
}

.nf__desc {
  color: var(--c-ink-muted);
}

.nf a {
  margin-top: var(--sp-3);
}
</style>
