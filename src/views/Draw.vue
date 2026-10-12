<script setup>
import { computed } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import MediaGrid from '@/components/MediaGrid.vue'
import PixelCanvas from '@/components/PixelCanvas.vue'
import { useContentStore } from '@/stores/content'

const content = useContentStore()
const works = computed(() => content.draw)
</script>

<template>
  <article class="stack">
    <PageHeader
      eyebrow="DRAW"
      title="画集"
      description="绘画盒里的作品合集。图片按需懒加载，滚动到可视区域才发起请求。"
    />

    <!-- 子页面只做作品陈列：简单矩形，不挂简介卡，也不用首页那套 3D 斜侧造型 -->
    <MediaGrid
      v-if="works.length"
      :items="works"
      variant="plain"
      :show-note="false"
      col-min="240px"
      ratio="1"
    />
    <p v-else class="empty">画集还是空的。</p>

    <PixelCanvas />
  </article>
</template>

<style scoped>
.empty {
  padding: var(--sp-7) var(--sp-5);
  border: 1px dashed var(--glass-line);
  border-radius: var(--radius-card);
  color: var(--c-ink-muted);
  font-size: var(--fs-sm);
  text-align: center;
}
</style>
