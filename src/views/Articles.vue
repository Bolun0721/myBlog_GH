<script setup>
import { onMounted } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import ArticleList from '@/components/ArticleList.vue'
import { useArticlesStore } from '@/stores/articles'

/**
 * 文章列表页（静态版）。
 * 去掉了原版的写作面板 —— 静态版没有服务端，写不了文章。
 * 内容来自打包的 articles.json，由同步脚本从本地库导出。
 */
const articles = useArticlesStore()

onMounted(() => articles.fetchList())
</script>

<template>
  <article class="stack">
    <PageHeader
      eyebrow="ARTICLES"
      title="文章"
      description="随笔与技术笔记。正文用 Markdown 编写，渲染前会做净化处理。"
    />

    <section class="list-card glass-card">
      <p v-if="articles.listLoading && !articles.list.length" class="status">加载中…</p>
      <p v-else-if="articles.listError" class="status">{{ articles.listError }}</p>
      <ArticleList v-else :articles="articles.list" empty-text="还没有文章。" />
    </section>
  </article>
</template>

<style scoped>
.list-card {
  padding: var(--sp-6);
}

.status {
  padding: var(--sp-6);
  font-size: var(--fs-sm);
  color: var(--c-ink-muted);
  text-align: center;
}

@media (max-width: 640px) {
  .list-card {
    padding: var(--sp-5) var(--sp-4);
    border-radius: var(--radius-card-sm);
  }
}
</style>
