import { ref } from 'vue'
import { defineStore } from 'pinia'
import { SECTION_KEYS, bundledContent } from '@/data/content'
import { isApiAvailable, saveContent } from '@/api/contentApi'

/** 深拷贝：避免运行时改动污染模块级的打包内容 */
const clone = (value) => JSON.parse(JSON.stringify(value))

/**
 * 三个栏的内容源。
 *
 * 真源是项目文件 src/data/content.json：
 *  - 页面初始数据来自随构建打包的这份 JSON，所以首屏无需额外请求；
 *  - /admin 的增删通过 dev server 的写入接口直接改写该文件（见 dev/contentApiPlugin.js），
 *    Vite 检测到文件变化后会整页刷新，刷新后读到的就是磁盘上的最终结果；
 *  - 生产构建里写入接口不存在，store 处于只读状态，站点只展示打包时的那份内容。
 *
 * 早期版本把改动存在 localStorage，现已废弃：那样只有本机浏览器看得到，
 * 也无法随构建部署，与「内容要和图片、音频一样存在项目目录里」的目标不符。
 */
export const useContentStore = defineStore('content', () => {
  const draw = ref([])
  const musicCovers = ref([])
  const tracks = ref([])
  const projects = ref([])

  /** null = 仍在探测写入接口；true = 可写；false = 只读 */
  const writable = ref(null)
  const notice = ref('')

  const lists = { draw, musicCovers, tracks, projects }

  function snapshot() {
    const data = {}
    for (const key of SECTION_KEYS) data[key] = lists[key].value
    return data
  }

  function apply(data) {
    if (!data) return
    for (const key of SECTION_KEYS) {
      if (Array.isArray(data[key])) lists[key].value = data[key]
    }
  }

  apply(clone(bundledContent))

  isApiAvailable().then((available) => {
    writable.value = available
  })

  /**
   * 所有改动都经这里：先本地生效（即时反馈），再整份提交给写入接口。
   * 接口报错就回滚并提示，避免出现「界面改好了、文件没动」的假成功。
   */
  async function mutate(change) {
    if (writable.value !== true) {
      notice.value = '写入接口不可用，当前为只读模式。请在本地执行 npm run dev 后再修改内容。'
      return false
    }

    const backup = clone(snapshot())
    change()

    try {
      await saveContent(snapshot())
      notice.value = ''
      return true
    } catch (error) {
      apply(backup)
      notice.value = `保存失败，改动已还原：${error.message}`
      return false
    }
  }

  async function add(key, item) {
    if (!lists[key]) return false
    return mutate(() => {
      lists[key].value = [...lists[key].value, item]
    })
  }

  async function remove(key, id) {
    if (!lists[key]) return false
    return mutate(() => {
      lists[key].value = lists[key].value.filter((item) => item.id !== id)
    })
  }

  /** 只改某一条的部分字段，用于管理页里直接编辑简介这类小改动 */
  async function update(key, id, patch) {
    if (!lists[key]) return false
    return mutate(() => {
      lists[key].value = lists[key].value.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      )
    })
  }

  let counter = 0
  /** 条目 id：不依赖 crypto.randomUUID，非 HTTPS 环境（如局域网 http 访问）也能用 */
  function createId(prefix) {
    counter += 1
    return `${prefix}-${Date.now().toString(36)}-${counter}-${Math.random().toString(36).slice(2, 7)}`
  }

  return {
    draw,
    musicCovers,
    tracks,
    projects,
    writable,
    notice,
    add,
    remove,
    update,
    createId
  }
})
