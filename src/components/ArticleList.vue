<script setup>
import { formatDate } from '@/utils/time'

/**
 * 文章列表。首页文章栏与 /articles 页共用。
 *
 * 刻意**不加 backdrop-filter**：文章数量会增长，而每个模糊元素都要单独合成一层，
 * 数量一多滚动就掉帧（这个教训在毛玻璃那一轮已经踩过）。
 * 项目卡只有几条所以用了玻璃，这里的取舍不同是有意的。
 */
defineProps({
  articles: { type: Array, required: true },
  emptyText: { type: String, default: '还没有文章。' }
})

/** 入场错峰上限，与网格一致：条目多时末尾不用等太久 */
const MAX_STAGGER = 8
</script>

<template>
  <ul v-if="articles.length" class="articles">
    <li
      v-for="(article, index) in articles"
      :key="article.id"
      class="article rise-in"
      :style="{ '--stagger': Math.min(index, MAX_STAGGER) }"
    >
      <RouterLink class="article__link" :to="{ name: 'article', params: { slug: article.slug } }">
        <p class="article__date">{{ formatDate(article.createdAt) }}</p>
        <h3 class="article__title display">{{ article.title }}</h3>
        <p v-if="article.summary" class="article__summary">{{ article.summary }}</p>
        <span class="article__more">
          阅读全文
          <span aria-hidden="true">→</span>
        </span>
      </RouterLink>
    </li>
  </ul>

  <p v-else class="articles__empty">{{ emptyText }}</p>
</template>

<style scoped>
.articles {
  display: grid;
  gap: var(--sp-5);
  grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
}

.article {
  border: 1px solid var(--glass-line-soft);
  border-radius: var(--radius-card-sm);
  background-color: var(--glass-soft);
  transition:
    transform var(--dur-base) var(--ease-out),
    border-color var(--dur-base) var(--ease-out),
    box-shadow var(--dur-base) var(--ease-out);
}

.article:hover {
  transform: translateY(-4px);
  border-color: var(--glass-line);
  box-shadow: var(--glass-shadow);
}

/* 整块卡片都是链接：点击目标大，比只点标题友好 */
.article__link {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  padding: var(--sp-5);
  color: inherit;
  height: 100%;
}

.article__date {
  font-size: var(--fs-xs);
  color: var(--c-ink-muted);
  font-variant-numeric: tabular-nums;
}

.article__title {
  font-size: var(--fs-lg);
  color: var(--c-ink);
}

.article__summary {
  font-size: var(--fs-sm);
  line-height: var(--lh-snug);
  color: var(--c-ink-soft);
}

.article__more {
  margin-top: auto;
  padding-top: var(--sp-2);
  font-size: var(--fs-xs);
  color: var(--c-ink-muted);
}

.article:hover .article__more {
  color: var(--c-ink);
}

.articles__empty {
  padding: var(--sp-6);
  border: 1px dashed var(--glass-line);
  border-radius: var(--radius-card-sm);
  color: var(--c-ink-muted);
  font-size: var(--fs-sm);
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .article:hover {
    transform: none;
  }
}
</style>
