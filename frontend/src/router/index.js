import { createRouter, createWebHistory } from 'vue-router'

import WelcomeScreen from '@/screens/WelcomeScreen.vue'
import BoardApp from '../screens/BoardApp.vue'
import PrivacyPolicy from '../screens/PrivacyPolicy.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: WelcomeScreen
    },
    {
        path: '/board',
        component: BoardApp
    },
    {
      path: '/privacy',
      component: PrivacyPolicy
    }
  ]
})

export default router