import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { showStaticNotice } from '@/utils/staticNotice'

/**
 * 静态版的登录态桩。
 *
 * 站点没有服务端，账号与会话都不存在，因此这里**永远**是未登录状态。
 * 保持与原版完全相同的接口（同名状态 + 同名方法），这样页面组件一行都不用改。
 * 任何需要后端的动作都不发请求，改弹一条说明。
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  // 桩没有「询问服务端」这一步，开局就是就绪状态
  const ready = ref(true)
  const loading = ref(false)
  const error = ref('')

  const isLoggedIn = computed(() => false)
  const isAdmin = computed(() => false)

  async function refresh() {
    user.value = null
  }

  async function register() {
    showStaticNotice()
    return false
  }

  async function login() {
    showStaticNotice()
    return false
  }

  async function logout() {
    showStaticNotice()
  }

  return { user, ready, loading, error, isLoggedIn, isAdmin, refresh, register, login, logout }
})
