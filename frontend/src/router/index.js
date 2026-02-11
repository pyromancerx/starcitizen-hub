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
import TreasuryView from '../views/TreasuryView.vue';
import PrivacyView from '../views/PrivacyView.vue';
import AnnouncementAdminView from '../views/AnnouncementAdminView.vue';
import AdminPersonnelView from '../views/AdminPersonnelView.vue';
import AdminThemeView from '../views/AdminThemeView.vue';
import OperationsView from '../views/OperationsView.vue';
import OperationDetailView from '../views/OperationDetailView.vue';
import OperationCreateEditView from '../views/OperationCreateEditView.vue';
import AdminDiscordSettingsView from '../views/AdminDiscordSettingsView.vue';

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
          path: 'operations',
          name: 'operations',
          component: OperationsView,
        },
        {
          path: 'operations/new',
          name: 'operation-create',
          component: OperationCreateEditView,
        },
        {
          path: 'operations/:id',
          name: 'operation-detail',
          component: OperationDetailView,
        },
        {
          path: 'operations/:id/edit',
          name: 'operation-edit',
          component: OperationCreateEditView,
        },
        {
          path: 'federation',
          name: 'federation',
          component: FederationView,
        },
        {
          path: 'admin',
          component: AdminView,
          children: [
            {
              path: '',
              name: 'admin', // Keep the 'admin' name for the parent route if needed for navigation to the parent itself
              redirect: { name: 'admin-personnel' } // Redirect to personnel by default
            },
            {
              path: 'personnel',
              name: 'admin-personnel',
              component: AdminPersonnelView
            },
            {
              path: 'theme',
              name: 'admin-theme',
              component: AdminThemeView
            },
            {
              path: 'rsi-verification',
              name: 'rsi-admin',
              component: RSIAdminView,
            },
            {
              path: 'announcements',
              name: 'admin-announcements',
              component: AnnouncementAdminView,
            },
            {
              path: 'discord-settings',
              name: 'admin-discord-settings',
              component: AdminDiscordSettingsView,
            },
          ]
        },
        {
          path: 'profile',
          name: 'profile',
          component: ProfileView,
        },
        {
          path: 'treasury',
          name: 'treasury',
          component: TreasuryView,
        },
        {
          path: 'privacy',
          name: 'privacy',
          component: PrivacyView,
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
