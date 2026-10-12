import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { backgrounds } from '@/data/site'

/** 本次会话选中的背景序号 */
const SESSION_KEY = 'timecat:bg'
/** 上次用过的那张，用来决定「下次重新进入」该轮到谁 */
const LAST_KEY = 'timecat:bg:last'

/**
 * 网页背景图轮换。
 *
 * 规则：每次重新进入站点换下一张，同一会话内（含刷新页面）保持不变。
 *
 * 为什么用 sessionStorage 记「本次会话的选择」而不是每次加载都重新算：
 * 管理页增删内容会让 Vite 整页刷新，若每次刷新都换背景会非常烦躁；
 * 而关闭标签页后 sessionStorage 自然失效，下次进来就是一个新会话，正好触发轮换。
 * localStorage 只记「上次用过哪张」，用来保证跨会话按顺序轮换，而不是随机撞重复。
 */
export const useBackgroundStore = defineStore('background', () => {
  const index = ref(0)

  function pickIndex(total) {
    try {
      // 注意不能直接 Number(getItem())：空值时 Number(null) 是 0，会被误判为合法序号
      const savedRaw = sessionStorage.getItem(SESSION_KEY)
      if (savedRaw !== null) {
        const saved = Number(savedRaw)
        if (Number.isInteger(saved) && saved >= 0 && saved < total) return saved
      }

      const lastRaw = localStorage.getItem(LAST_KEY)
      const last = lastRaw === null ? NaN : Number(lastRaw)
      const next = Number.isInteger(last) && last >= 0 && last < total ? (last + 1) % total : 0

      sessionStorage.setItem(SESSION_KEY, String(next))
      localStorage.setItem(LAST_KEY, String(next))
      return next
    } catch {
      // 隐私模式等 storage 不可用的场景：退化为随机，功能不受影响
      return Math.floor(Math.random() * total)
    }
  }

  if (backgrounds.length) index.value = pickIndex(backgrounds.length)

  const src = computed(() => backgrounds[index.value] ?? backgrounds[0] ?? '')

  return { src }
})
