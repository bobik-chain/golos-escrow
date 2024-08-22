import { createRouter, createWebHistory } from 'vue-router'
import EscrowGet from '../components/EscrowGet.vue'
import Nav from '../components/Nav.vue'

const baseLayout = {
  Nav
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      components: {
        ...baseLayout,
        default: EscrowGet
      }
    },
    {
      path: '/transfer',
      name: 'transfer',
      components: {
        ...baseLayout,
        default: () => import('../components/EscrowTransfer.vue')
      }
    }
  ]
})

export default router
