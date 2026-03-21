import { createRouter, createWebHistory } from 'vue-router'
import { WELCOME_STORAGE_KEY } from '@/constants/app.constants'
import WelcomeScreen from '@/screens/WelcomeScreen.vue'

const baseTitle = 'Онлайн Стикеры'
import BoardApp from '../screens/BoardApp.vue'
import PrivacyPolicy from '../screens/PrivacyPolicy.vue'

const routes = [
  { path: '/', component: WelcomeScreen, meta: { title: 'Добро пожаловать' } },
  { path: '/board', component: BoardApp, meta: { title: 'Доска стикеров' } },
  { path: '/privacy', component: PrivacyPolicy, meta: { title: 'Политика конфиденциальности' } }
]

if (import.meta.env.DEV) {
  routes.push({
    path: '/dev-auth',
    component: () => import('@/screens/DevAuthScreen.vue'),
    meta: { title: 'Dev: API auth' }
  })
}

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const visited = localStorage.getItem(WELCOME_STORAGE_KEY)
  if (to.path === '/' && visited) {
    next('/board')
  } else if (to.path === '/board' && !visited) {
    next('/')
  } else {
    next()
  }
})

router.afterEach((to) => {

  document.title = to.meta.title
    ? `${to.meta.title} | Онлайн Стикеры`
    : baseTitle
})

export default router