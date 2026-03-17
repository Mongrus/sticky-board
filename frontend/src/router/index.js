import { createRouter, createWebHistory } from 'vue-router'

import WelcomeScreen from '@/screens/WelcomeScreen.vue'
import BoardApp from '../screens/BoardApp.vue'
import PrivacyPolicy from '../screens/PrivacyPolicy.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: WelcomeScreen, meta: { title: 'Добро пожаловать' } },
    { path: '/board', component: BoardApp, meta: { title: 'Доска стикеров' } },
    { path: '/privacy', component: PrivacyPolicy, meta: { title: 'Политика конфиденциальности' } }
  ]
})

router.afterEach((to) => {

  document.title = to.meta.title
    ? `${to.meta.title} | Онлайн Стикеры`
    : baseTitle
})

export default router