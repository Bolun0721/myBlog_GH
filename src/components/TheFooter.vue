<script setup>
import { ADMIN_AVAILABLE } from '@/config'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer glass">
    <div class="footer__inner">
      <p class="footer__brand display">TIME CAT</p>
      <p class="footer__note">像素风二次元小站 · 画集 / 音乐盒 / 个人项目</p>
      <p class="footer__copy">
        <span>© {{ year }} Time Cat</span>
        <!-- 仅本地开发时出现，生产构建里这个入口不存在 -->
        <router-link v-if="ADMIN_AVAILABLE" class="footer__admin" to="/admin">内容管理</router-link>
      </p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: var(--sp-8);
  /* 通栏元素：只要「玻璃材质」，描边收成一条顶边 */
  border-top: 1px solid var(--glass-line);
  border-radius: 0;
}

.footer__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-3) var(--sp-5);
  max-width: var(--container);
  margin-inline: auto;
  padding: var(--sp-6) var(--gutter);
}

.footer__brand {
  font-size: var(--fs-md);
  letter-spacing: var(--ls-wide);
}

.footer__note,
.footer__copy {
  color: var(--c-ink-muted);
  font-size: var(--fs-xs);
}

.footer__copy {
  display: flex;
  align-items: baseline;
  gap: var(--sp-4);
}

.footer__admin {
  padding-bottom: 1px;
  border-bottom: 1px solid currentColor;
}

.footer__admin:hover {
  color: var(--c-ink);
}

@media (max-width: 640px) {
  .footer__inner {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}
</style>
