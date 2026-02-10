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
import TradeView from '../views/TradeView.vue';
import PriceDatabaseView from '../views/PriceDatabaseView.vue';
import CargoContractsView from '../views/CargoContractsView.vue';
import CrewFinderView from '../views/CrewFinderView.vue';
import AvailabilityView from '../views/AvailabilityView.vue';
import CrewLoadoutsView from '../views/CrewLoadoutsView.vue';
import NotificationsView from '../views/NotificationsView.vue';
import AchievementsView from '../views/AchievementsView.vue';
import MessagesView from '../views/MessagesView.vue';
import RSIAdminView from '../views/RSIAdminView.vue';
import ProfileView from '../views/ProfileView.vue';

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
        {
          path: 'trade-runs',
          name: 'trade-runs',
          component: TradeView,
        },
        {
          path: 'prices',
          name: 'price-database',
          component: PriceDatabaseView,
        },
        {
          path: 'contracts',
          name: 'cargo-contracts',
          component: CargoContractsView,
        },
        {
          path: 'crew-finder',
          name: 'crew-finder',
          component: CrewFinderView,
        },
        {
          path: 'availability',
          name: 'availability',
          component: AvailabilityView,
        },
        {
          path: 'crew-loadouts',
          name: 'crew-loadouts',
          component: CrewLoadoutsView,
        },
        {
          path: 'notifications',
          name: 'notifications',
          component: NotificationsView,
        },
        {
          path: 'achievements',
          name: 'achievements',
          component: AchievementsView,
        },
        {
          path: 'messages',
          name: 'messages',
          component: MessagesView,
        },
        {
          path: 'messages/:id',
          name: 'conversation',
          component: MessagesView,
        },
        {
          path: 'admin/rsi-verification',
          name: 'rsi-admin',
          component: RSIAdminView,
        },
        {
          path: 'profile',
          name: 'profile',
          component: ProfileView,
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
