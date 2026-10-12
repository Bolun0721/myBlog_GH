<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { STATIC_NOTICE, closeStaticNotice, staticNoticeVisible } from '@/utils/staticNotice'

/**
 * 静态版的功能提示弹层。挂在 App.vue 上，全局只有一个实例。
 */
const closeButton = ref(null)

function onKeydown(event) {
  if (event.key === 'Escape' && staticNoticeVisible.value) closeStaticNotice()
}

// 弹层打开时锁住页面滚动，避免背景跟着滑
watch(staticNoticeVisible, (open) => {
  document.documentElement.style.overflow = open ? 'hidden' : ''
  if (open) {
    // 等 DOM 渲染出来再聚焦，否则按钮还不存在
    requestAnimationFrame(() => closeButton.value?.focus())
  }
})

onMounted(() => document.addEventListener('keydown', onKeydown))

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.documentElement.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="notice">
      <div
        v-if="staticNoticeVisible"
        class="notice"
        role="dialog"
        aria-modal="true"
        aria-labelledby="static-notice-title"
      >
        <!-- 点击遮罩关闭；点击卡片本身不关闭，所以用 @click.self -->
        <div class="notice__scrim" @click.self="closeStaticNotice">
          <div class="notice__card">
            <p class="notice__eyebrow">NOTICE</p>
            <h2 id="static-notice-title" class="notice__title">{{ STATIC_NOTICE.title }}</h2>
            <p class="notice__text">{{ STATIC_NOTICE.text }}</p>
            <button ref="closeButton" class="notice__close" type="button" @click="closeStaticNotice">
              知道了
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.notice__scrim {
  position: fixed;
  inset: 0;
  /* 要盖住页头的 sticky 层（z-index 100） */
  z-index: 200;
  display: grid;
  place-items: center;
  padding: var(--sp-5);
  background-color: rgba(17, 17, 17, 0.34);
}

.notice__card {
  width: 100%;
  max-width: 380px;
  padding: var(--sp-6);
  text-align: left;
  /*
   * 刻意不使用毛玻璃（glass-card）：提示文字必须一眼看清。
   * 半透明底 + backdrop-filter 会让文字对比度随背后的照片起伏，
   * 深色背景图下尤其糊。这里改用不透明的实底，
   * 层次感靠描边与投影来拉开，不靠透明度。
   */
  background-color: #ffffff;
  border: var(--border-hair) solid var(--c-line);
  border-radius: var(--radius-card-sm);
  box-shadow: 0 18px 44px rgba(17, 17, 17, 0.22);
}

.notice__eyebrow {
  font-size: var(--fs-xs);
  letter-spacing: 0.18em;
  color: var(--c-ink-muted);
}

.notice__title {
  margin-top: var(--sp-2);
  font-family: var(--font-display);
  font-size: var(--fs-lg);
  color: var(--c-ink);
}

.notice__text {
  margin-top: var(--sp-4);
  font-size: var(--fs-sm);
  line-height: var(--lh-normal);
  color: var(--c-ink-soft);
}

.notice__close {
  margin-top: var(--sp-5);
  width: 100%;
  padding: var(--sp-3) var(--sp-5);
  border: var(--border-hair) solid var(--c-line);
  border-radius: var(--radius-sm);
  background-color: var(--c-ink);
  font-family: var(--font-display);
  font-size: var(--fs-sm);
  color: var(--c-inverse);
  transition: opacity var(--dur-fast) var(--ease-out);
}

.notice__close:hover {
  opacity: 0.85;
}

.notice-enter-active,
.notice-leave-active {
  transition: opacity var(--dur-base) var(--ease-out);
}

.notice-enter-from,
.notice-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .notice-enter-active,
  .notice-leave-active {
    transition: none;
  }
}
</style>
