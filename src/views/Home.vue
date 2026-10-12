<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import SectionBlock from '@/components/SectionBlock.vue'
import MediaGrid from '@/components/MediaGrid.vue'
import ProjectGrid from '@/components/ProjectGrid.vue'
import ArticleList from '@/components/ArticleList.vue'
import MomentWall from '@/components/MomentWall.vue'
import SocialLinks from '@/components/SocialLinks.vue'
import Typewriter from '@/components/Typewriter.vue'
import { useContentStore } from '@/stores/content'
import { useArticlesStore } from '@/stores/articles'
import { mascot, mascotSfx, heroCats, profile } from '@/data/site'
import { playSfx, preloadSfx } from '@/utils/sfx'

const content = useContentStore()
const articles = useArticlesStore()

/**
 * 五个栏的区块配置。
 * 画集/音乐盒/个人项目的内容来自 content store（由 /admin 维护）；
 * 文章与说说来自后端接口，属于「用户数据」而不是站点素材，两者不混在一起。
 * kind 决定用哪种方式渲染。
 */
const sections = computed(() => [
  {
    index: '01',
    title: '画集',
    description: '收录原创立绘与绘画练习，点击卡片即可进入画集。',
    to: '/draw',
    linkLabel: '进入画集',
    kind: 'media',
    variant: 'tilt',
    items: content.draw,
    colMin: '180px',
    ratio: '1'
  },
  {
    index: '02',
    title: '音乐盒',
    description: '点播式曲目列表，音频按需加载，浏览页面本身不消耗流量。',
    to: '/music',
    linkLabel: '进入音乐盒',
    kind: 'media',
    variant: 'circle',
    items: content.musicCovers,
    colMin: '180px',
    ratio: '1'
  },
  {
    index: '03',
    title: '个人项目',
    description: '做过的工具与作品，点击可跳转到项目地址。',
    to: '/projects',
    linkLabel: '查看全部项目',
    kind: 'projects',
    items: content.projects
  },
  {
    index: '04',
    title: '文章',
    description: '随笔与技术笔记，点开就是完整正文。',
    to: '/articles',
    linkLabel: '查看全部文章',
    kind: 'articles'
  },
  {
    index: '05',
    title: '说说',
    // 说说没有子页面，所以不给 to，区块右下角的按钮会自动隐藏
    description: '随手记下的话。登录后可以在这里发言。',
    kind: 'moments'
  }
])

/** 戳小人的果冻弹动 */
const poking = ref(false)
const mascotImg = ref(null)

async function poke() {
  playSfx(mascotSfx)

  // 先把类摘掉、等 DOM 真的更新，再强制一次样式重算，最后才把类加回来。
  // 少了中间这两步，「摘掉 + 加回」会被合进同一帧：浏览器从没计算过
  // 「没有动画」的中间态，就会认为动画没变过，连点时只有第一次能播。
  poking.value = false
  await nextTick()
  // 读一次布局属性以强制样式重算，上一条动画在这一步才真正被销毁
  void mascotImg.value?.offsetWidth
  poking.value = true
}

// 提前把音效拉进缓存，首次点击就没有延迟
onMounted(() => {
  preloadSfx(mascotSfx)
  // 文章列表要用来渲染 04 栏。说说的列表由 MomentWall 自己按需拉取。
  articles.fetchList()
})
</script>

<template>
  <div class="stack">
    <section class="hero glass-card">
      <div class="hero__grid">
        <div class="hero__intro">
          <p class="hero__eyebrow display">TIME CAT</p>
          <h1 class="hero__title display">时之猫</h1>
          <p class="hero__lead">
            一间像素风二次元小屋：画集、音乐盒与个人项目，都在这里收着。
          </p>
          <SocialLinks class="hero__social" />
        </div>

        <!-- 大标题右侧：上半是头像卡片，下半是打字机文案 -->
        <div class="hero__side">
          <figure class="avatar">
            <img
              class="avatar__img"
              :src="profile.avatar"
              :alt="`${profile.id} 的头像`"
              width="112"
              height="112"
            />
            <figcaption class="avatar__id display">{{ profile.id }}</figcaption>
          </figure>

          <Typewriter class="hero__motto" :text="profile.motto" />
        </div>
      </div>

      <div class="hero__track">
        <button class="hero__mascot" type="button" aria-label="戳一下尼禄" @click="poke">
          <img
            ref="mascotImg"
            class="hero__mascot-img"
            :class="{ 'is-poking': poking }"
            :src="mascot.src"
            alt=""
            width="64"
            height="64"
            @animationend="poking = false"
          />
        </button>

        <!-- 小猫队列：与小人排成一行，一样站在这条虚线上 -->
        <img
          v-for="cat in heroCats"
          :key="cat"
          class="hero__cat"
          :src="cat"
          alt=""
          width="40"
          height="40"
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>

    <SectionBlock
      v-for="section in sections"
      :key="section.index"
      :index="section.index"
      :title="section.title"
      :description="section.description"
      :to="section.to"
      :link-label="section.linkLabel"
    >
      <ArticleList v-if="section.kind === 'articles'" :articles="articles.list" empty-text="还没有文章。" />
      <MomentWall v-else-if="section.kind === 'moments'" />
      <ProjectGrid
        v-else-if="section.kind === 'projects'"
        :items="section.items"
        empty-text="还没有项目。"
      />
      <MediaGrid
        v-else-if="section.items?.length"
        :items="section.items"
        :variant="section.variant"
        :col-min="section.colMin"
        :ratio="section.ratio"
      />
      <p v-else class="home__empty">这一栏还是空的。</p>
    </SectionBlock>
  </div>
</template>

<style scoped>
/* 首页是一列等距的毛玻璃卡片：hero + 三个栏位，间距由全局 .stack 提供 */
.hero {
  padding: var(--sp-7) var(--sp-6) var(--sp-6);
}

/* 左：大标题与简介；右：头像卡片 + 打字机。
   右列内部再纵向分两块，对应「上半头像、下半文案」。
   右列宽度决定这两块的大小：加宽会让卡片左边缘同时左移，所以「放大」与「左移」是一起发生的。 */
.hero__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 288px;
  gap: var(--sp-6);
  align-items: start;
}

.hero__eyebrow {
  font-size: var(--fs-sm);
  letter-spacing: var(--ls-wide);
  color: var(--c-ink-muted);
}

.hero__title {
  margin-top: var(--sp-3);
  font-size: var(--fs-4xl);
  color: var(--c-ink);
}

.hero__lead {
  margin-top: var(--sp-4);
  max-width: 44ch;
  color: var(--c-ink-soft);
}

.hero__social {
  margin-top: var(--sp-6);
}

.hero__side {
  display: grid;
  gap: var(--sp-4);
  /* 不再与大标题顶部对齐，整体下沉一点 */
  margin-top: var(--sp-5);
}

/* 头像卡片。它嵌在 hero 的毛玻璃之内，所以不再叠一层 backdrop-filter ——
   嵌套模糊既显脏又多一层合成开销，用更实的半透明底就够。 */
.avatar {
  display: grid;
  justify-items: center;
  gap: var(--sp-3);
  padding: var(--sp-5);
  border: 1px solid var(--glass-line);
  border-radius: var(--radius-card-sm);
  background-color: var(--glass-strong);
}

.avatar__img {
  width: 144px;
  height: 144px;
  object-fit: cover;
  border: var(--border-hair) solid var(--c-line);
  border-radius: var(--radius-card-sm);
  background-color: var(--glass-soft);
}

.avatar__id {
  font-size: var(--fs-lg);
  letter-spacing: var(--ls-tight);
  color: var(--c-ink);
}

/* 打字机比默认小字放大一档（14px → 18px），与头像卡片同步 */
.hero__motto {
  --typewriter-font-size: var(--fs-md);
}

/* 跑道：一条虚线 + 站在线上的小人与小猫队列。
   不再需要 container-type（原本只为跑动动画的 100cqw 服务），少一层包含块。
   高度比小人大一截：给点击时的果冻弹动留出向上跳的空间，否则会被 overflow 裁掉。 */
.hero__track {
  display: flex;
  /* 底边对齐 = 所有角色的脚都落在那条虚线上 */
  align-items: flex-end;
  gap: var(--sp-3);
  height: 100px;
  margin-top: var(--sp-6);
  border-bottom: 1px dashed rgba(17, 17, 17, 0.18);
  overflow: hidden;
}

/* 小人排在队列最左。align-items: flex-end 让它的底边正好压在那条虚线上。
   图片本体是 128×128 正方形，object-fit: contain 在 64×64 盒子里正好铺满，
   不会有透明留白把它垫高。 */
.hero__mascot {
  flex: none;
  display: block;
  width: 64px;
  height: 64px;
}

/* 小猫，紧挨着小人往右排。
   不设 image-rendering: pixelated —— 源图是 540~600px，这里要缩到 40px，
   降采样十几倍时最近邻会丢掉大量像素、笔画会断；
   浏览器默认的平滑缩放才是缩小时的正确选择（放大才需要 pixelated）。
   width: auto 让每只按自身比例排（这批图宽高比在 0.9~1.0 之间）。 */
.hero__cat {
  flex: none;
  width: auto;
  height: 40px;
}

.hero__mascot-img {
  /* 弹起高度。跑道留白必须大于 rise + 拉伸增量，否则会被 overflow 裁掉。 */
  --jelly-rise: 22px;
  width: 100%;
  height: 100%;
  object-fit: contain;
  /* 以底边为基准压缩/拉伸，才像软果子砸在地上 */
  transform-origin: bottom center;
}

.hero__mascot-img.is-poking {
  animation: jelly 620ms var(--ease-out);
}

/* 落地压扁 → 弹起拉伸，反复衰减，收回到原状 */
@keyframes jelly {
  0% {
    transform: translateY(0) scale(1, 1);
  }
  16% {
    transform: translateY(0) scale(1.2, 0.8);
  }
  36% {
    transform: translateY(calc(-1 * var(--jelly-rise))) scale(0.88, 1.16);
  }
  56% {
    transform: translateY(0) scale(1.14, 0.86);
  }
  74% {
    transform: translateY(calc(var(--jelly-rise) / -2)) scale(0.95, 1.06);
  }
  88% {
    transform: translateY(0) scale(1.05, 0.95);
  }
  100% {
    transform: translateY(0) scale(1, 1);
  }
}

/* 两栏在中等宽度下会把左栏挤得太窄（大标题本身就是 64px），
   所以 900px 以下就改成单栏堆叠，右列整块落到标题下方。 */
@media (max-width: 900px) {
  .hero__grid {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-5);
  }

  .hero__side {
    /* 单栏时不需要再下沉 */
    margin-top: 0;
    justify-items: center;
  }

  .avatar {
    /* 与桌面右列同宽，居中摆放 */
    width: 100%;
    max-width: 288px;
  }

  .hero__motto {
    text-align: center;
  }
}

@media (max-width: 640px) {
  .hero {
    padding: var(--sp-6) var(--sp-4);
    border-radius: var(--radius-card-sm);
  }

  .avatar__img {
    width: 112px;
    height: 112px;
  }

  .hero__track {
    height: 84px;
    /* 窄屏要放下 6 个角色，间距与猫一整排一起收小 */
    gap: var(--sp-2);
  }

  .hero__mascot {
    width: 56px;
    height: 56px;
  }

  .hero__cat {
    height: 28px;
  }

  .hero__mascot-img {
    /* 跑道变矮，弹起高度同步收小，避免顶到边框被裁 */
    --jelly-rise: 14px;
  }
}
</style>
