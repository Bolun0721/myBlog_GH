import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import bundled from '@/data/articles.json'
import { showStaticNotice } from '@/utils/staticNotice'

/**
 * 静态版的文章数据。
 *
 * 原版从 /api/articles 取数据，这里改成读打包进构建的 articles.json ——
 * 该文件由 scripts/sync-static.mjs 从本地 SQLite 导出，
 * 所以内容仍然在本地用完整版管理，静态版只是它的只读快照。
 *
 * 接口形态与原版保持一致：列表不带正文、详情才给 bodyMd。
 * 这样页面组件不需要知道数据来自接口还是本地 JSON。
 */
const ALL = JSON.parse(JSON.stringify(bundled.articles ?? []))

/** 列表接口返回的字段，刻意不含正文（与原版「数据与页面分离」的做法一致） */
const LIST_FIELDS = ['id', 'slug', 'title', 'summary', 'createdAt', 'updatedAt']

export const useArticlesStore = defineStore('articles', () => {
  const list = ref([])
  const listLoading = ref(false)
  const listError = ref('')
  const listLoaded = ref(false)

  const current = ref(null)
  const detailLoading = ref(false)
  const detailError = ref('')

  const count = computed(() => list.value.length)

  async function fetchList({ force = false } = {}) {
    if (listLoaded.value && !force) return
    list.value = ALL.map((item) => Object.fromEntries(LIST_FIELDS.map((key) => [key, item[key]])))
    listLoaded.value = true
  }

  async function fetchOne(slug) {
    // 切文章时先清空，避免详情页短暂显示上一篇的内容
    current.value = null
    detailLoading.value = true
    detailError.value = ''
    try {
      const found = ALL.find((item) => item.slug === slug)
      if (!found) {
        detailError.value = '文章不存在'
        return false
      }
      current.value = { ...found }
      return true
    } finally {
      detailLoading.value = false
    }
  }

  /* 以下三个是写作动作。静态版没有服务端，只会弹说明，不做任何改动。 */

  async function create() {
    showStaticNotice()
  }

  async function update() {
    showStaticNotice()
  }

  async function remove() {
    showStaticNotice()
  }

  return {
    list,
    listLoading,
    listError,
    listLoaded,
    current,
    detailLoading,
    detailError,
    count,
    fetchList,
    fetchOne,
    create,
    update,
    remove
  }
})
