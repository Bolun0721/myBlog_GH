<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMomentsStore } from '@/stores/moments'
import { formatDateTime, formatRelative } from '@/utils/time'

/**
 * 说说栏（静态版）。版式参考 B 站评论区：左侧头像，右侧一列「昵称 / 正文 / 时间与操作」。
 *
 * 与原版的差别只有两处：
 *  1. 发布区**始终显示**（原版要登录后才出现）。这样版面完整，
 *     点「发布」时会弹出「静态版无法发布」的说明 —— 符合「点相关按钮就提示」的要求。
 *  2. 没有登录用户，所以发布区头像一个固定占位字；删除按钮永远不出现。
 * 列表内容来自打包的 moments.json，只读展示。
 */
const auth = useAuthStore()
const store = useMomentsStore()

/** 与原版一致的上限；静态版不会真的提交，仅用于字数显示 */
const MAX_CHARS = 500

/** 静态版没有登录用户，发布区头像用固定占位字 */
const COMPOSER_INITIAL = '时'

const draft = ref('')
const error = ref('')
const submitting = ref(false)

const draftLength = computed(() => [...draft.value].length)
const canSubmit = computed(() => draft.value.trim().length > 0 && !submitting.value)

/** 昵称首字，用码点取，避免代理对字符被切成半个 */
function initialOf(name) {
  return name ? [...name][0] : '?'
}

/** 登录态恒为 false，所以这个条件永远不成立 —— 删除按钮不会渲染 */
function canDelete(moment) {
  return auth.isLoggedIn && (auth.isAdmin || auth.user.id === moment.author.id)
}

async function onSubmit() {
  if (!canSubmit.value) return
  error.value = ''
  submitting.value = true
  try {
    // store.publish 在静态版里只弹说明、不发送任何内容
    await store.publish(draft.value.trim())
    // 刻意不清空输入框：内容并没有发出去，清空会让人误以为发布成功了
  } catch (err) {
    error.value = err.message
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (store.list.length === 0) store.fetchLatest()
})
</script>

<template>
  <div class="wall">
    <!-- 发布区：静态版始终显示，点「发布」会提示功能不可用 -->
    <div class="composer">
      <span class="avatar" aria-hidden="true">{{ COMPOSER_INITIAL }}</span>
      <div class="composer__main">
        <textarea
          v-model="draft"
          class="composer__input"
          :maxlength="MAX_CHARS"
          rows="3"
          placeholder="说点什么…（静态展示版无法发布）"
          :disabled="submitting"
        />
        <div class="composer__foot">
          <span class="composer__count" :class="{ 'is-full': draftLength >= MAX_CHARS }">
            {{ draftLength }} / {{ MAX_CHARS }}
          </span>
          <button class="btn btn--solid" type="button" :disabled="!canSubmit" @click="onSubmit">
            {{ submitting ? '发布中…' : '发布' }}
          </button>
        </div>
      </div>
    </div>

    <p v-if="error" class="wall__error" role="alert">{{ error }}</p>

    <!-- 列表 -->
    <p v-if="store.loading && !store.list.length" class="wall__status">加载中…</p>
    <p v-else-if="store.error && !store.list.length" class="wall__status">{{ store.error }}</p>
    <p v-else-if="!store.list.length" class="wall__status">还没有人说话，来做第一个。</p>

    <ul v-else class="comments">
      <li v-for="moment in store.list" :key="moment.id" class="comment">
        <span class="avatar" aria-hidden="true">{{ initialOf(moment.author.name) }}</span>

        <div class="comment__main">
          <p class="comment__name">{{ moment.author.name }}</p>
          <!-- 文本插值 + pre-wrap：换行保留，且不可能被当成 HTML 执行 -->
          <p class="comment__body">{{ moment.body }}</p>

          <div class="comment__foot">
            <time :datetime="new Date(moment.createdAt).toISOString()" :title="formatDateTime(moment.createdAt)">
              {{ formatRelative(moment.createdAt) }}
            </time>
            <button v-if="canDelete(moment)" class="comment__action" type="button">
              删除
            </button>
          </div>
        </div>
      </li>
    </ul>

    <div v-if="store.hasMore" class="wall__more">
      <button class="btn" type="button" :disabled="store.loadingMore" @click="store.fetchMore()">
        {{ store.loadingMore ? '加载中…' : '加载更多' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.wall {
  display: grid;
  gap: var(--sp-5);
}

/* ---------- 头像 ---------- */

.avatar {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex: none;
  border: var(--border-hair) solid var(--c-line);
  border-radius: 50%;
  background-color: var(--glass-strong);
  font-family: var(--font-display);
  font-size: var(--fs-sm);
  color: var(--c-ink);
}

/* ---------- 发布区 ---------- */

.composer {
  display: flex;
  gap: var(--sp-4);
}

.composer__main {
  flex: 1;
  min-width: 0;
}

.composer__input {
  width: 100%;
  padding: var(--sp-3) var(--sp-4);
  border: var(--border-hair) solid var(--c-line);
  border-radius: var(--radius-sm);
  background-color: var(--glass-strong);
  font: inherit;
  font-size: var(--fs-sm);
  line-height: var(--lh-snug);
  color: var(--c-ink);
  resize: vertical;
}

.composer__input::placeholder {
  color: var(--c-ink-muted);
}

.composer__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  margin-top: var(--sp-3);
}

.composer__count {
  font-size: var(--fs-xs);
  color: var(--c-ink-muted);
  font-variant-numeric: tabular-nums;
}

.composer__count.is-full {
  color: var(--c-ink);
  font-weight: 600;
}

/* ---------- 按钮 ---------- */

.btn {
  padding: var(--sp-2) var(--sp-5);
  border: var(--border-hair) solid var(--c-line);
  border-radius: var(--radius-sm);
  background-color: transparent;
  font-family: var(--font-display);
  font-size: var(--fs-sm);
  color: var(--c-ink);
  transition:
    background-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);
}

.btn--solid {
  background-color: var(--c-ink);
  color: var(--c-inverse);
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* ---------- 列表 ---------- */

.comments {
  display: grid;
  gap: var(--sp-5);
}

.comment {
  display: flex;
  gap: var(--sp-4);
  padding-bottom: var(--sp-5);
  border-bottom: 1px solid var(--glass-line-soft);
}

.comment:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.comment__main {
  min-width: 0;
  flex: 1;
}

.comment__name {
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--c-ink);
}

.comment__body {
  margin-top: var(--sp-2);
  font-size: var(--fs-base);
  line-height: var(--lh-normal);
  color: var(--c-ink-soft);
  /* 保留用户输入的换行与空格 */
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.comment__foot {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  margin-top: var(--sp-3);
  font-size: var(--fs-xs);
  color: var(--c-ink-muted);
}

.comment__action {
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: var(--c-ink-muted);
  text-decoration: underline;
  cursor: pointer;
}

.comment__action:hover {
  color: var(--c-ink);
}

/* ---------- 状态 ---------- */

.wall__status {
  padding: var(--sp-6);
  border: 1px dashed var(--glass-line);
  border-radius: var(--radius-card-sm);
  font-size: var(--fs-sm);
  color: var(--c-ink-muted);
  text-align: center;
}

.wall__error {
  padding: var(--sp-3) var(--sp-4);
  border: var(--border-hair) solid var(--c-ink);
  border-radius: var(--radius-sm);
  background-color: var(--glass-strong);
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--c-ink);
}

.wall__more {
  display: flex;
  justify-content: center;
}

@media (max-width: 640px) {
  .comment {
    gap: var(--sp-3);
  }

  .avatar {
    width: 34px;
    height: 34px;
  }
}
</style>
