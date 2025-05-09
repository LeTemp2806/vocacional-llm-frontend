import { createRouter, createWebHistory } from 'vue-router';
import LoginRegister from '../views/LoginRegister.vue';
import ChatInterface from '../views/ChatInterface.vue';

const routes = [
  { path: '/', name: 'Home', component: LoginRegister },
  { path: '/chat', name: 'Chat', component: ChatInterface, meta: { requiresAuth: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Protección de rutas
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (to.meta.requiresAuth && !token) return next({ name: 'Home' });
  next();
});

export default router;