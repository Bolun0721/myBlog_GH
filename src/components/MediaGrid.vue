<script setup>
/**
 * 响应式媒体网格，首页画集栏 / 音乐盒栏与画集子页面共用。
 *
 * 用 auto-fill + minmax 让列数随容器自适应，
 * min(var(--col-min), 100%) 保证极窄屏也不会横向溢出，因此网格本身不需要 media query。
 *
 * variant 决定小卡片的造型：
 *   plain   直角方卡
 *   tilt    3D 斜侧卡片，悬停转回正面并放大（画集用，做法见 css-3d-card-tutorial）
 *   circle  圆形（音乐盒用）
 *
 * 每张卡片下方都挂一张固定高度的简介卡，内容留空时显示占位文字。
 */
defineProps({
  /** [{ id, src, alt, note }] */
  items: { type: Array, required: true },
  /** 单列最小宽度，决定断点节奏 */
  colMin: { type: String, default: '200px' },
  /** 卡片宽高比 */
  ratio: { type: String, default: '1' },
  /** 卡片造型：plain | tilt | circle */
  variant: { type: String, default: 'plain' },
  /** 是否在卡片下方挂简介卡（画集子页面不需要） */
  showNote: { type: Boolean, default: true },
  /** 首屏可见的图片用 eager，其余交给懒加载 */
  eager: { type: Boolean, default: false }
})

/**
 * 入场错峰上限。不封顶的话，条目一多（比如 30 个）最后几个要等近 2 秒才出现，
 * 滚动到那里会看到一片空白。封顶后所有卡片大约 1 秒内全部就位。
 */
const MAX_STAGGER = 8
</script>

<template>
  <ul
    class="media-grid"
    :class="`media-grid--${variant}`"
    :style="{ '--col-min': colMin, '--ratio': ratio }"
  >
    <li
      v-for="(item, index) in items"
      :key="item.id ?? item.src"
      class="media-grid__cell rise-in"
      :style="{ '--stagger': Math.min(index, MAX_STAGGER) }"
    >
      <div class="media-grid__card">
        <img
          class="media-grid__img"
          :src="item.src"
          :alt="item.alt"
          :loading="eager ? 'eager' : 'lazy'"
          :fetchpriority="eager ? 'high' : 'auto'"
          decoding="async"
        />
      </div>

      <p
        v-if="showNote"
        class="media-grid__note"
        :class="{ 'media-grid__note--empty': !item.note }"
      >
        {{ item.note || '简介待补充' }}
      </p>
    </li>
  </ul>
</template>

<style scoped>
.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(var(--col-min), 100%), 1fr));
  /* 行距比列距大一档：每张卡片下面挂着简介卡，行与行之间要留出分界 */
  gap: var(--sp-6) var(--sp-5);
}

.media-grid__cell {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  min-width: 0;
}

/* 卡片本体。overflow: hidden 让圆角与 hover 放大都只作用于卡片自身。
   它同时是 3D 变换的目标（tilt 变体）—— 教程第 7 节提醒 overflow 会把
   transform-style: preserve-3d 压平，但那影响的是「子元素」的 3D 空间；
   卡片内部没有用 translateZ 分层，而卡片自身的旋转由父级的 perspective 决定，
   所以这里可以安全地让同一个元素既裁剪又旋转。 */
.media-grid__card {
  overflow: hidden;
  aspect-ratio: var(--ratio);
  border: 1px solid var(--glass-line-soft);
  border-radius: var(--radius-card-sm);
  /* 刻意不加 backdrop-filter：格子数量多，每个都会单独合成一层，
     滚动时明显掉帧。它们本来就压在栏位卡片的毛玻璃上，半透明底已经够看了。 */
  background-color: var(--glass-soft);
  transition:
    transform var(--dur-slow) var(--ease-spring),
    border-color var(--dur-base) var(--ease-out);
}

.media-grid__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ---------- 变体：3D 斜侧卡片 ---------- */

/* perspective 放在舞台（li）上而不是卡片自身：放在卡片上则透视只作用于它自己，
   也无法和相邻卡片共享同一景深。 */
.media-grid--tilt .media-grid__cell {
  perspective: 900px;
}

.media-grid--tilt .media-grid__card {
  /* 初始斜侧姿态：绕 Y 轴偏转为主，再俯仰一点增加立体感 */
  transform: rotateY(-32deg) rotateX(9deg);
}

/* 悬停转回正面并放大。放大倍率控制在 1.06：
   教程示例用的 1.12 在网格里会让卡片压到相邻卡片上（列间距只有 24px）。 */
.media-grid--tilt .media-grid__cell:hover .media-grid__card,
.media-grid--tilt .media-grid__cell:focus-within .media-grid__card {
  transform: rotateY(0deg) rotateX(0deg) scale(1.06);
  border-color: var(--glass-line);
}

/* ---------- 变体：圆形 ---------- */

.media-grid--circle .media-grid__card {
  border-radius: 50%;
}

/* ---------- 悬停：图片轻微推近（tilt 变体不用，它靠卡片整体转正来表现） ---------- */

.media-grid--plain .media-grid__cell:hover .media-grid__img,
.media-grid--circle .media-grid__cell:hover .media-grid__img {
  transform: scale(1.06);
}

.media-grid--plain .media-grid__img,
.media-grid--circle .media-grid__img {
  transition: transform var(--dur-base) var(--ease-out);
}

/* ---------- 简介卡 ---------- */

/* 固定高度而不是由内容撑开：文案长短不一时，同一行卡片的底边仍然齐平。
   高度 = 内边距 + 3 行小字，约等于原来单行时高度的两倍。 */
.media-grid__note {
  height: var(--note-height);
  padding: var(--sp-2) var(--sp-3);
  border: 1px solid var(--glass-line-soft);
  border-radius: var(--radius-sm);
  background-color: var(--glass-strong);
  font-size: var(--fs-sm);
  line-height: var(--lh-snug);
  color: var(--c-ink-soft);
  /* 超出部分截断，保证上面的固定高度不会被撑破 */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.media-grid__note--empty {
  color: var(--c-ink-muted);
}

/* 入场动画（上浮逐个出现）来自全局 .rise-in，--stagger 由行内样式给出 */

@media (prefers-reduced-motion: reduce) {
  .media-grid--tilt .media-grid__card {
    /* 关掉动效时不再斜侧，直接正面摆放，免得是一排难读的斜卡 */
    transform: none;
  }

  .media-grid--plain .media-grid__cell:hover .media-grid__img,
  .media-grid--circle .media-grid__cell:hover .media-grid__img {
    transform: none;
  }
}
</style>
