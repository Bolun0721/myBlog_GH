import { ref } from 'vue'
import { defineStore } from 'pinia'
import bundled from '@/data/moments.json'
import { showStaticNotice } from '@/utils/staticNotice'

/**
 * 静态版的说说数据。
 *
 * 原版从 /api/moments 取数据，这里改成读打包进构建的 moments.json
 * （由 scripts/sync-static.mjs 从本地 SQLite 导出）。
 * 展示与分页逻辑保留，发布和删除只弹说明。
 */
const ALL = JSON.parse(JSON.stringify(bundled.moments ?? []))

const PAGE_SIZE = 10

export const useMomentsStore = defineStore('moments', () => {
  const list = ref([])
  const total = ref(0)
  const hasMore = ref(false)
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref('')

  async function fetchLatest() {
    loading.value = true
    error.value = ''
    list.value = ALL.slice(0, PAGE_SIZE)
    total.value = ALL.length
    hasMore.value = ALL.length > PAGE_SIZE
    loading.value = false
  }

  async function fetchMore() {
    if (!hasMore.value || loadingMore.value) return
    const oldest = list.value[list.value.length - 1]
    if (!oldest) return

    loadingMore.value = true
    // 与接口的游标分页等价：从当前最旧一条往后接着取
    const start = ALL.findIndex((item) => item.id === oldest.id) + 1
    const next = ALL.slice(start, start + PAGE_SIZE)
    list.value = [...list.value, ...next]
    hasMore.value = list.value.length < ALL.length
    loadingMore.value = false
  }

  /* 发布与删除都需要服务端。静态版只弹说明。 */

  async function publish() {
    showStaticNotice()
  }

  async function remove() {
    showStaticNotice()
  }

  return { list, total, hasMore, loading, loadingMore, error, fetchLatest, fetchMore, publish, remove }
})
