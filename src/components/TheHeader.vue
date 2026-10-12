<script setup>
import FillLink from './FillLink.vue'
import DigitalClock from './DigitalClock.vue'
import AccountButton from './AccountButton.vue'

/**
 * 站点头部。
 * 原站把导航写成 .Fast_search，用 absolute + top:40px + right:120px 定位，
 * 窗口一窄就压到标题上；这里改为 sticky 流式布局。
 */
const navItems = [
  { to: '/', label: '首页' },
  { to: '/draw', label: '画集' },
  { to: '/music', label: '音乐盒' },
  { to: '/projects', label: '个人项目' },
  { to: '/articles', label: '文章' }
]
</script>

<template>
  <header class="header glass">
    <div class="header__inner">
      <router-link to="/" class="header__brand">
        <span class="header__brand-latin display">TIME CAT</span>
        <span class="header__brand-cn">时之猫</span>
      </router-link>

      <DigitalClock class="header__clock" />

      <div class="header__right">
        <nav class="header__nav" aria-label="主导航">
          <FillLink v-for="item in navItems" :key="item.to" :to="item.to" size="sm">
            {{ item.label }}
          </FillLink>
        </nav>

        <!-- 圆形账号入口，固定在导航条右侧 -->
        <AccountButton class="header__account" />
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  min-height: var(--header-h);
  /* 通栏元素：只要「玻璃材质」，把 .glass 的圆角去掉、描边收成一条底边。
     sticky + backdrop-filter 会让滚动到下面的内容在页头里被糊掉，正是要的效果。 */
  border-bottom: 1px solid var(--glass-line);
  border-radius: 0;
  box-shadow: var(--glass-shadow-sm);
}

.header__inner {
  display: grid;
  /* 三列且两侧均为 1fr：时钟才会真正落在视口正中，
     若用 flex + space-between，左右两块的宽度差会把时钟挤偏。 */
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--sp-4);
  width: 100%;
  max-width: var(--container);
  min-height: var(--header-h);
  margin-inline: auto;
  padding-inline: var(--gutter);
}

.header__brand {
  justify-self: start;
  display: flex;
  align-items: baseline;
  gap: var(--sp-2);
  min-width: 0;
}

.header__clock {
  justify-self: center;
}

.header__brand-latin {
  font-size: var(--fs-lg);
  letter-spacing: var(--ls-wide);
  color: var(--c-ink);
}

.header__brand-cn {
  font-size: var(--fs-xs);
  color: var(--c-ink-muted);
  letter-spacing: var(--ls-tight);
}

/* 导航条 + 圆形账号入口同处第三列。
   窄屏时导航条变成可横向滑动的条带，账号入口留在外面所以始终可见。 */
.header__right {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  min-width: 0;
}

.header__nav {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

/* 窄屏：第一行「品牌 + 时钟」，第二行导航变成可横向滑动的条带，
   无需汉堡菜单与额外 JS。 */
@media (max-width: 640px) {
  .header__inner {
    grid-template-columns: 1fr auto;
    gap: var(--sp-3);
    padding-block: var(--sp-3);
  }

  .header__clock {
    justify-self: end;
  }

  .header__right {
    grid-column: 1 / -1;
    justify-self: stretch;
    gap: var(--sp-2);
  }

  .header__nav {
    flex: 1;
    min-width: 0;
    justify-content: flex-start;
    overflow-x: auto;
    scrollbar-width: none;
    /* 滑动时首尾留出安全内边距，第一个按钮不会被裁掉 */
    padding-inline: 2px;
  }

  .header__account {
    flex: none;
  }

  .header__nav::-webkit-scrollbar {
    display: none;
  }
}
</style>
