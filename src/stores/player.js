import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useContentStore } from './content'

/** 曲单被清空时的兜底展示对象，保证模板里的 player.current.title 不会炸 */
const EMPTY_TRACK = { id: '', title: '暂无曲目', artist: '', src: '' }

/**
 * 全站单例音频播放器。
 *
 * 取代原站「隐藏 iframe 里再放一个 audio」的做法：
 *  - 整站只有一个 <audio>，不会出现两条音轨同时播放；
 *  - preload = 'none'，用户点播之前不产生任何音频请求；
 *  - 音频元素在首次点播时才创建，纯浏览页面的用户不会付出任何代价。
 *
 * 状态放在 store 里，切路由时播放不中断（音乐盒 → 主页仍继续播）。
 * 曲单不再写死，而是读 content store，管理页增删曲目后播放器随之更新。
 */
export const usePlayerStore = defineStore('player', () => {
  const content = useContentStore()
  const tracks = computed(() => content.tracks)

  const currentIndex = ref(0)
  const playing = ref(false)
  const loading = ref(false)
  const error = ref('')
  const position = ref(0)
  const duration = ref(0)

  /** 非响应式：媒体元素本身不需要被 Vue 追踪 */
  let audio = null

  const current = computed(() => tracks.value[currentIndex.value] ?? tracks.value[0] ?? EMPTY_TRACK)

  // 当前曲目被管理页删掉后下标会越界，拉回有效范围，否则列表高亮会凭空消失
  watch(tracks, (list) => {
    if (currentIndex.value >= list.length) currentIndex.value = 0
  })


  function ensureAudio() {
    if (audio) return audio

    audio = new Audio()
    // 关键：不预载。src 赋值后也不会发起请求，只有 play() 才真正拉流。
    audio.preload = 'none'

    audio.addEventListener('play', () => {
      playing.value = true
      error.value = ''
    })
    audio.addEventListener('pause', () => {
      playing.value = false
    })
    audio.addEventListener('waiting', () => {
      loading.value = true
    })
    audio.addEventListener('playing', () => {
      loading.value = false
    })
    audio.addEventListener('timeupdate', () => {
      position.value = audio.currentTime
    })
    audio.addEventListener('loadedmetadata', () => {
      duration.value = audio.duration || 0
      loading.value = false
    })
    audio.addEventListener('ended', () => {
      next()
    })
    audio.addEventListener('error', () => {
      playing.value = false
      loading.value = false
      error.value = `无法播放《${current.value.title}》，请确认音频文件存在。`
    })

    return audio
  }

  /** 播放指定曲目；不传 index 则播放/续播当前曲目 */
  function play(index) {
    const list = tracks.value
    // 曲单被清空时直接返回，避免读到 undefined.src
    if (!list.length) return

    const el = ensureAudio()

    if (index !== undefined && index !== currentIndex.value) {
      currentIndex.value = index
      position.value = 0
      duration.value = 0
      loading.value = true
      el.src = list[index].src
    } else if (!el.src) {
      loading.value = true
      el.src = list[currentIndex.value].src
    }

    // 浏览器自动播放策略可能拒绝，此处静默降级由 pause 事件复位状态
    el.play().catch(() => {
      playing.value = false
      loading.value = false
    })
  }

  /** 主页苹果按钮 / 迷你播放器：单纯开或关当前曲目 */
  function toggle() {
    const el = ensureAudio()
    if (el.paused) play()
    else el.pause()
  }

  /** 曲目列表点击：点当前正在播的 → 暂停，点别的 → 切歌播放 */
  function select(index) {
    const el = ensureAudio()
    if (index === currentIndex.value && !el.paused) el.pause()
    else play(index)
  }

  function next() {
    const total = tracks.value.length
    if (!total) return
    play((currentIndex.value + 1) % total)
  }

  function prev() {
    const total = tracks.value.length
    if (!total) return
    play((currentIndex.value - 1 + total) % total)
  }

  /** 按 0~1 比例跳转 */
  function seek(ratio) {
    if (!audio || !duration.value) return
    audio.currentTime = Math.min(Math.max(ratio, 0), 1) * duration.value
    position.value = audio.currentTime
  }

  return {
    tracks,
    currentIndex,
    current,
    playing,
    loading,
    error,
    position,
    duration,
    play,
    toggle,
    select,
    next,
    prev,
    seek
  }
})
