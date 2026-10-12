<script setup>
// 布局由 LayoutDefault 承载，这里渲染路由出口 + 静态版的功能提示弹层。
// 弹层放在最外层，保证它在任何路由下都存在，且只会有一个实例。
import StaticNotice from '@/components/StaticNotice.vue'
</script>

<template>
  <router-view />
  <StaticNotice />
</template>
