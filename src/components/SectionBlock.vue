<script setup>
import FillLink from './FillLink.vue'

/**
 * 首页区块容器。
 * 原站把 画集 / 音乐盒 / 照片墙 三块内容各自绝对定位在 top:210px / 750px / 1300px，
 * 这里改为统一结构与间距节奏，高度交给内容自然撑开。
 */
defineProps({
  index: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  /** 留空则不渲染右下角按钮（说说栏没有子页面） */
  to: { type: String, default: '' },
  linkLabel: { type: String, default: '查看全部' }
})
</script>

<template>
  <section class="section glass-card">
    <header class="section__head">
      <p class="section__index display" aria-hidden="true">{{ index }}</p>
      <div class="section__text">
        <h2 class="section__title display">{{ title }}</h2>
        <p v-if="description" class="section__desc">{{ description }}</p>
      </div>
      <FillLink v-if="to" class="section__action" :to="to" size="sm">{{ linkLabel }}</FillLink>
    </header>
    <div class="section__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
/* 栏位卡片：毛玻璃配方由全局 .glass-card 提供（半透明底 + 模糊 + 高光描边 + 圆角 + 投影），
   这里只管内边距与卡片之间的间距。 */
.section {
  padding: var(--sp-6) var(--sp-6) var(--sp-7);
}

.section__head {
  display: flex;
  align-items: flex-end;
  gap: var(--sp-5);
  margin-bottom: var(--sp-6);
}

/* 巨大编号用半透明墨色而不是 --c-line-soft：
   后者是接近白的浅灰，压在毛玻璃上会直接看不见。 */
.section__index {
  flex: none;
  font-size: var(--fs-3xl);
  color: rgba(17, 17, 17, 0.22);
  line-height: 1;
}

.section__text {
  flex: 1 1 auto;
  min-width: 0;
}

.section__title {
  font-size: var(--fs-2xl);
  color: var(--c-ink);
}

.section__desc {
  margin-top: var(--sp-2);
  color: var(--c-ink-muted);
  font-size: var(--fs-sm);
  max-width: 46ch;
}

.section__action {
  flex: none;
}

/* 窄屏改用 grid 明确排版：编号与标题必定同行，按钮必定独占下一行。
   原先的 flex-wrap 写法会因各区块文案长度不同而出现「有的编号独占一行、
   有的与标题同行」的不一致（实测 01/02 与 03 表现不同）。 */
@media (max-width: 640px) {
  .section {
    /* 窄屏收窄内边距并换小一号圆角，避免卡片看起来过于臃肿 */
    padding: var(--sp-5) var(--sp-4) var(--sp-6);
    border-radius: var(--radius-card-sm);
  }

  .section__head {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: baseline;
    gap: var(--sp-2) var(--sp-3);
    margin-bottom: var(--sp-5);
  }

  .section__index {
    font-size: var(--fs-xl);
  }

  .section__title {
    font-size: var(--fs-xl);
  }

  .section__action {
    grid-column: 1 / -1;
    width: 100%;
  }
}
</style>
