<script setup>
import { onMounted, ref } from 'vue'
import TheHeader from './TheHeader.vue'
import TheFooter from './TheFooter.vue'
import AppleToggle from './AppleToggle.vue'
import { useBackgroundStore } from '@/stores/background'
import { useAuthStore } from '@/stores/auth'

/**
 * 默认布局：背景层 / 头部 / 内容 / 页脚 / 悬浮播放器。
 * 原站每个页面都要自己重复一遍结构与样式，这里统一收口一次。
 */
const background = useBackgroundStore()
const auth = useAuthStore()

/** 图片加载完成后再淡入，避免白底直接硬切到照片 */
const backgroundReady = ref(false)

// 每次进入站点都向服务端问一次登录态（会话存在服务端的 HttpOnly Cookie 里，
// 前端不缓存"我登录了"这件事，否则会和服务端的过期状态对不上）
onMounted(() => auth.refresh())
</script>

<template>
  <div class="app-bg" aria-hidden="true">
    <img
      class="app-bg__img"
      :class="{ 'is-ready': backgroundReady }"
      :src="background.src"
      alt=""
      @load="backgroundReady = true"
    />
  </div>

  <a class="skip-link" href="#main">跳到主要内容</a>

  <TheHeader />

  <main id="main" class="main">
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>

  <TheFooter />

  <AppleToggle />
</template>

<style scoped>
/* 页面统一容器：全站左右边距一致，各视图只需关心自己的内容 */
.main {
  width: 100%;
  max-width: var(--container);
  margin-inline: auto;
  padding: var(--sp-6) var(--gutter) var(--sp-7);
}

@media (max-width: 640px) {
  .main {
    padding: var(--sp-4) var(--gutter) var(--sp-6);
  }
}
</style>
