<script setup>
/**
 * 个人项目卡片网格。首页与项目页共用。
 *
 * 首页不做条数截断：与画集、音乐盒两栏保持一致，
 * 否则新加的项目在首页"看不见"，会被误认为没保存成功。
 *
 * 项目卡自带 description（项目介绍），所以不再另挂简介卡。
 *
 * link 有两种形态，按前缀区分：
 *  - 以 / 开头 → 站内页面（例如游戏 /suika），用 RouterLink 走前端路由；
 *  - 其余 → 外部地址，新标签页打开。
 * 混用的话，站内页面会被当成外链新开一个标签，白白重载一次整站。
 */
defineProps({
  /** [{ id, title, description, link, cover, coverAlt, note }] */
  items: { type: Array, required: true },
  /** 列表为空时显示的文案 */
  emptyText: { type: String, default: '还没有内容。' }
})

/** 入场错峰上限，避免条目很多时末尾卡片等太久（详见 MediaGrid 的同类说明） */
const MAX_STAGGER = 8

/** 站内路径：交给 vue-router，地址栏不用刷新整页 */
function isInternal(link) {
  return link.startsWith('/')
}
</script>

<template>
  <ul v-if="items.length" class="projects">
    <li
      v-for="(project, index) in items"
      :key="project.id"
      class="project glass-card rise-in"
      :style="{ '--stagger': Math.min(index, MAX_STAGGER) }"
    >
      <div class="project__cover">
        <img
          v-if="project.cover"
          :src="project.cover"
          :alt="project.coverAlt || project.title"
          loading="lazy"
          decoding="async"
        />
        <span v-else class="project__cover-empty" aria-hidden="true">NO IMAGE</span>
      </div>

      <div class="project__body">
        <h3 class="project__title display">{{ project.title }}</h3>
        <p v-if="project.description" class="project__desc">{{ project.description }}</p>
        <RouterLink
          v-if="project.link && isInternal(project.link)"
          class="project__link"
          :to="project.link"
        >
          进入项目
          <span aria-hidden="true">→</span>
        </RouterLink>
        <a
          v-else-if="project.link"
          class="project__link"
          :href="project.link"
          target="_blank"
          rel="noopener noreferrer"
        >
          访问项目
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </li>
  </ul>

  <p v-else class="projects__empty">{{ emptyText }}</p>
</template>

<style scoped>
.projects {
  display: grid;
  gap: var(--sp-5);
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
}

.project {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* 毛玻璃配方来自全局 .glass-card，这里只把圆角收小一档，让卡片比栏位卡片更紧凑 */
  border-radius: var(--radius-card-sm);
  transition:
    transform var(--dur-base) var(--ease-out),
    box-shadow var(--dur-base) var(--ease-out),
    border-color var(--dur-base) var(--ease-out);
}

.project:hover {
  transform: translateY(-4px);
  border-color: var(--glass-line);
  box-shadow: var(--glass-shadow);
}

.project__cover {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background-color: var(--glass-soft);
}

.project__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--dur-base) var(--ease-out);
}

.project:hover .project__cover img {
  transform: scale(1.05);
}

.project__cover-empty {
  display: grid;
  place-items: center;
  height: 100%;
  font-family: var(--font-display);
  font-size: var(--fs-sm);
  letter-spacing: var(--ls-wide);
  color: var(--c-ink-muted);
}

.project__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--sp-2);
  padding: var(--sp-5);
}

.project__title {
  font-size: var(--fs-lg);
}

.project__desc {
  flex: 1 1 auto;
  color: var(--c-ink-muted);
  font-size: var(--fs-sm);
}

.project__link {
  align-self: flex-start;
  padding-bottom: 2px;
  border-bottom: 2px solid var(--c-line);
  font-size: var(--fs-sm);
  transition: opacity var(--dur-fast) var(--ease-out);
}

.project__link:hover {
  opacity: 0.6;
}

.projects__empty {
  padding: var(--sp-7) var(--sp-5);
  border: 1px dashed var(--glass-line);
  border-radius: var(--radius-card-sm);
  color: var(--c-ink-muted);
  font-size: var(--fs-sm);
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .project:hover {
    transform: none;
  }

  .project:hover .project__cover img {
    transform: none;
  }
}
</style>
