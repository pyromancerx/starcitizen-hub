import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import LoginView from '../views/LoginView.vue';
import AppLayout from '../components/AppLayout.vue';
import DashboardView from '../views/DashboardView.vue';
import FleetView from '../views/FleetView.vue';
import InventoryView from '../views/InventoryView.vue';
import WalletView from '../views/WalletView.vue';
import StockpileView from '../views/StockpileView.vue';
import EventsView from '../views/EventsView.vue';
import EventDetailView from '../views/EventDetailView.vue';
import ForumView from '../views/ForumView.vue';
import ForumCategoryView from '../views/ForumCategoryView.vue';
import ForumThreadView from '../views/ForumThreadView.vue';
import ProjectsView from '../views/ProjectsView.vue';
import ProjectDetailView from '../views/ProjectDetailView.vue';
import MembersView from '../views/MembersView.vue';
import FederationView from '../views/FederationView.vue';
import AdminView from '../views/AdminView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guestOnly: true }
    },
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: DashboardView,
        },
        {
          path: 'fleet',
          name: 'fleet',
          component: FleetView,
        },
        {
          path: 'inventory',
          name: 'inventory',
          component: InventoryView,
        },
        {
          path: 'wallet',
          name: 'wallet',
          component: WalletView,
        },
        {
          path: 'stockpiles',
          name: 'stockpiles',
          component: StockpileView,
        },
        {
          path: 'events',
          name: 'events',
          component: EventsView,
        },
        {
          path: 'events/:id',
          name: 'event-detail',
          component: EventDetailView,
        },
        {
          path: 'forum',
          name: 'forum',
          component: ForumView,
        },
        {
          path: 'forum/categories/:id',
          name: 'forum-category',
          component: ForumCategoryView,
        },
        {
          path: 'forum/threads/:id',
          name: 'forum-thread',
          component: ForumThreadView,
        },
        {
          path: 'projects',
          name: 'projects',
          component: ProjectsView,
        },
        {
          path: 'projects/:id',
          name: 'project-detail',
          component: ProjectDetailView,
        },
        {
          path: 'members',
          name: 'members',
          component: MembersView,
        },
        {
          path: 'federation',
          name: 'federation',
          component: FederationView,
        },
        {
          path: 'admin',
          name: 'admin',
          component: AdminView,
        },
      ]
    },
  ],
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' });
  } else if (to.meta.guestOnly && authStore.isAuthenticated) {
    next({ name: 'dashboard' });
  } else {
    next();
  }
});

export default router;
