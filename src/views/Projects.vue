<script setup>
import { computed } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import ProjectGrid from '@/components/ProjectGrid.vue'
import { useContentStore } from '@/stores/content'
import { ADMIN_AVAILABLE } from '@/config'

const content = useContentStore()
const projects = computed(() => content.projects)
</script>

<template>
  <article class="stack">
    <PageHeader
      eyebrow="PROJECTS"
      title="个人项目"
      description="做过的东西都收在这里，点击卡片右下角可跳到项目地址。"
    />

    <ProjectGrid
      :items="projects"
      empty-text="还没有项目。"
    />

    <p v-if="ADMIN_AVAILABLE" class="manage">
      维护内容请到
      <router-link class="manage__link" to="/admin">/admin 内容管理</router-link>
      。线上站点是只读的，改完记得提交并重新部署。
    </p>
  </article>
</template>

<style scoped>
.manage {
  padding: var(--sp-3) var(--sp-4);
  border: 1px solid var(--glass-line-soft);
  border-radius: var(--radius-card-sm);
  /* 一行提示，模糊看不出来，用半透明底即可 */
  background-color: var(--glass-soft);
  font-size: var(--fs-sm);
  color: var(--c-ink-soft);
}

.manage__link {
  border-bottom: 1px solid currentColor;
}
</style>
