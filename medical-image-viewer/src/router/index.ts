import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: {
      title: '首页'
    }
  },
  {
    path: '/viewer',
    name: 'viewer',
    component: () => import('@/views/ViewerView.vue'),
    meta: {
      title: '影像查看器'
    }
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: {
      title: '关于'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 医学影像查看器`
  }
  next()
})

export default router
