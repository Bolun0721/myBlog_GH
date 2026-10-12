/**
 * 一次性音效播放。
 *
 * 刻意不复用全站播放器 store：点击音效属于「交互反馈」，
 * 若走同一个 audio 元素，戳两下小猫就会把正在播的背景音乐切掉。
 *
 * 两个要点：
 *  - 每种音效保留一份模板元素并 preload，首次点击前就已缓存，点击能即时出声；
 *  - 每次播放克隆一份，允许连点时多个实例重叠，而不是互相截断。
 *    （复用同一个元素时，第二次 play() 不会从头开始，连点会变成「只响第一下」。）
 */

const templates = new Map()

function getTemplate(src) {
  let el = templates.get(src)
  if (!el) {
    el = new Audio()
    el.preload = 'auto'
    el.src = src
    templates.set(src, el)
  }
  return el
}

/** 提前把音效拉进缓存，让首次点击没有延迟。体积很小，值得预载。 */
export function preloadSfx(src) {
  if (src) getTemplate(src)
}

export function playSfx(src, volume = 0.6) {
  if (!src) return
  const el = getTemplate(src).cloneNode()
  el.volume = volume
  // 浏览器可能因自动播放策略或缺少音频设备而拒绝，静默降级，不影响任何主流程
  el.play().catch(() => {})
}
