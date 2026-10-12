<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useArticlesStore } from '@/stores/articles'
import { renderMarkdown } from '@/utils/markdown'
import { formatDate } from '@/utils/time'

const route = useRoute()
const articles = useArticlesStore()

/**
 * 正文渲染。这是全站**唯一**使用 v-html 的地方，
 * 内容来自 renderMarkdown —— 先由 marked 转语法，再由 DOMPurify 剔除脚本、
 * 事件属性与 javascript: 协议。两个步骤都在 utils/markdown.js 里，缺一不可。
 */
const bodyHtml = computed(() => (articles.current ? renderMarkdown(articles.current.bodyMd) : ''))

const updated = computed(() => {
  const article = articles.current
  if (!article) return ''
  return article.updatedAt && article.updatedAt !== article.createdAt ? formatDate(article.updatedAt) : ''
})

async function load(slug) {
  if (!slug) return
  const ok = await articles.fetchOne(slug)
  // 详情页的标题要跟着文章走。路由的 afterEach 先跑（用的是路由表里的通用标题），
  // 所以这里取到数据后再覆盖一次。
  if (ok && articles.current) document.title = `${articles.current.title} · Time Cat`
}

onMounted(() => load(route.params.slug))
// 文章之间互相跳转时组件会复用，只靠 onMounted 不会重新加载
watch(() => route.params.slug, load)
</script>

<template>
  <article class="stack">
    <p v-if="articles.detailLoading" class="status glass-card">加载中…</p>

    <section v-else-if="articles.detailError || !articles.current" class="status glass-card">
      <p class="status__text">{{ articles.detailError || '文章不存在' }}</p>
      <RouterLink class="back" :to="{ name: 'articles' }">← 返回文章列表</RouterLink>
    </section>

    <template v-else>
      <header class="head glass-card">
        <RouterLink class="back" :to="{ name: 'articles' }">← 全部文章</RouterLink>
        <h1 class="head__title display">{{ articles.current.title }}</h1>
        <p class="head__meta">
          <time :datetime="new Date(articles.current.createdAt).toISOString()">
            {{ formatDate(articles.current.createdAt) }}
          </time>
          <span v-if="updated">· 更新于 {{ updated }}</span>
          <span class="head__slug">· {{ articles.current.slug }}</span>
        </p>
      </header>

      <!-- eslint-disable-next-line vue/no-v-html -- 内容已在 renderMarkdown 中净化 -->
      <div class="prose glass-card" v-html="bodyHtml" />
    </template>
  </article>
</template>

<style scoped>
.head {
  padding: var(--sp-6);
}

.back {
  font-size: var(--fs-sm);
  color: var(--c-ink-muted);
}

.back:hover {
  color: var(--c-ink);
}

.head__title {
  margin-top: var(--sp-4);
  font-size: var(--fs-3xl);
  color: var(--c-ink);
}

.head__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  margin-top: var(--sp-3);
  font-size: var(--fs-sm);
  color: var(--c-ink-muted);
  font-variant-numeric: tabular-nums;
}

.head__slug {
  font-family: var(--font-display);
  font-size: var(--fs-xs);
}

.status {
  padding: var(--sp-7) var(--sp-6);
  text-align: center;
}

.status__text {
  font-size: var(--fs-sm);
  color: var(--c-ink-muted);
}

.status .back {
  display: inline-block;
  margin-top: var(--sp-4);
}

/* ---------- 正文排版 ----------
   v-html 插入的节点拿不到 scoped 的 data 属性，所以必须用 :deep() 才能命中。 */
.prose {
  padding: var(--sp-6);
  font-size: var(--fs-base);
  line-height: var(--lh-normal);
  color: var(--c-ink-soft);
  /* 长链接/长单词不撑破卡片 */
  overflow-wrap: anywhere;
}

.prose :deep(> *:first-child) {
  margin-top: 0;
}

.prose :deep(> *:last-child) {
  margin-bottom: 0;
}

.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3),
.prose :deep(h4) {
  margin: var(--sp-6) 0 var(--sp-3);
  font-family: var(--font-display);
  line-height: var(--lh-tight);
  color: var(--c-ink);
}

.prose :deep(h1) {
  font-size: var(--fs-2xl);
}

.prose :deep(h2) {
  font-size: var(--fs-xl);
}

.prose :deep(h3) {
  font-size: var(--fs-lg);
}

.prose :deep(h4) {
  font-size: var(--fs-md);
}

.prose :deep(p) {
  margin: var(--sp-4) 0;
}

.prose :deep(a) {
  color: var(--c-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.prose :deep(ul),
.prose :deep(ol) {
  margin: var(--sp-4) 0;
  padding-left: 1.5em;
}

.prose :deep(ul) {
  list-style: square;
}

.prose :deep(ol) {
  list-style: decimal;
}

.prose :deep(li) {
  margin: var(--sp-1) 0;
}

.prose :deep(blockquote) {
  margin: var(--sp-5) 0;
  padding: var(--sp-3) var(--sp-5);
  border-left: var(--border-thick) solid var(--c-line);
  background-color: var(--glass-soft);
  color: var(--c-ink-muted);
}

.prose :deep(code) {
  padding: 2px 6px;
  border: 1px solid var(--glass-line-soft);
  border-radius: var(--radius-xs);
  background-color: var(--glass-soft);
  font-family: ui-monospace, 'Cascadia Code', 'Courier New', monospace;
  font-size: 0.92em;
}

.prose :deep(pre) {
  margin: var(--sp-5) 0;
  padding: var(--sp-4);
  border: 1px solid var(--glass-line-soft);
  border-radius: var(--radius-sm);
  background-color: var(--glass-strong);
  /* 代码块横向滚动，不把卡片撑宽 */
  overflow-x: auto;
}

.prose :deep(pre code) {
  padding: 0;
  border: none;
  background: none;
  font-size: var(--fs-sm);
  line-height: 1.6;
}

.prose :deep(hr) {
  margin: var(--sp-6) 0;
  border: none;
  border-top: 1px dashed rgba(17, 17, 17, 0.2);
}

.prose :deep(img) {
  max-width: 100%;
  height: auto;
  border: 1px solid var(--glass-line-soft);
  border-radius: var(--radius-sm);
}

.prose :deep(table) {
  width: 100%;
  margin: var(--sp-5) 0;
  border-collapse: collapse;
  font-size: var(--fs-sm);
}

.prose :deep(th),
.prose :deep(td) {
  padding: var(--sp-2) var(--sp-3);
  border: 1px solid var(--glass-line-soft);
  text-align: left;
}

.prose :deep(th) {
  background-color: var(--glass-soft);
  color: var(--c-ink);
}

@media (max-width: 640px) {
  .head,
  .prose {
    padding: var(--sp-5) var(--sp-4);
    border-radius: var(--radius-card-sm);
  }

  .head__title {
    font-size: var(--fs-2xl);
  }
}
</style>
