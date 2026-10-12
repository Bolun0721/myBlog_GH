import { createRouter, createWebHistory } from 'vue-router'
import LayoutDefault from '@/components/LayoutDefault.vue'
import Home from '@/views/Home.vue'

const SITE_NAME = 'Time Cat'

/**
 * 路由表（静态版）
 *
 * 与原版的差别：
 *  - 去掉了 login 路由：静态版没有服务端，登录注册无从实现，
 *    导航栏的账号按钮改为弹提示而不是跳转。
 *  - 去掉了 admin 路由与其动态 import：静态版不含 Admin.vue。
 *    （原版这一块本来就被 import.meta.env.DEV 挡住，生产构建不会执行，
 *      但 Rollup 仍会尝试解析那个动态 import，文件不存在就会构建失败，
 *      所以这里必须真删掉。）
 */
const children = [
  {
    path: '',
    name: 'home',
    component: Home,
    meta: {
      title: '首页',
      description: 'Time Cat 个人小屋：画集、音乐盒与个人项目的入口。'
    }
  },
  {
    path: 'draw',
    name: 'draw',
    component: () => import('@/views/Draw.vue'),
    meta: {
      title: '画集',
      description: '画集——收录 Time Cat 的原创立绘与绘画作品。'
    }
  },
  {
    path: 'music',
    name: 'music',
    component: () => import('@/views/Music.vue'),
    meta: {
      title: '音乐盒',
      description: '音乐盒——精选曲目列表，点播前不产生任何音频流量。'
    }
  },
  {
    path: 'projects',
    name: 'projects',
    component: () => import('@/views/Projects.vue'),
    meta: {
      title: '个人项目',
      description: '个人项目——作品与开源项目的集中展示。'
    }
  },
  {
    path: 'articles',
    name: 'articles',
    component: () => import('@/views/Articles.vue'),
    meta: {
      title: '文章',
      description: '文章——随笔与技术笔记，正文用 Markdown 编写。'
    }
  },
  {
    path: 'suika',
    name: 'suika',
    component: () => import('@/views/Suika.vue'),
    meta: {
      title: '合成大冰球',
      description: '合成大冰球——基于 matter.js 的物理小游戏，同级冰球相撞合并，堆过红线判负。'
    }
  },
  {
    path: 'articles/:slug',
    name: 'article',
    // 详情页的 title 在视图中按文章标题覆盖（见 ArticleDetail.vue）
    component: () => import('@/views/ArticleDetail.vue'),
    meta: {
      title: '文章',
      description: '文章正文。'
    }
  }
]

// 兜底必须放最后
children.push({
  path: ':pathMatch(.*)*',
  name: 'not-found',
  component: () => import('@/views/NotFound.vue'),
  meta: {
    title: '页面不存在',
    description: '没有找到这个页面。'
  }
})

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [{ path: '/', component: LayoutDefault, children }],
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  }
})

/** 写入/更新 <meta name> 标签 */
function setMeta(name, content) {
  let tag = document.querySelector(`meta[name="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

// 逐页更新 title 与 description，单页应用的 SEO 基础项
router.afterEach((to) => {
  const title = to.meta.title
  document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME
  if (to.meta.description) setMeta('description', to.meta.description)
  setMeta('robots', to.meta.robots || 'index, follow')
})

export default router
