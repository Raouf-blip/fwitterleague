import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import { useAuthStore } from "../stores/auth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 };
  },
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/scrims",
      name: "scrims",
      component: () => import("../views/ScrimsView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/scrims/:id",
      name: "scrim-detail",
      component: () => import("../views/ScrimDetailView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
    },
    {
      path: "/forgot-password",
      name: "forgot-password",
      component: () => import("../views/ForgotPasswordView.vue"),
    },
    {
      path: "/reset-password",
      name: "reset-password",
      component: () => import("../views/ResetPasswordView.vue"),
    },
    {
      path: "/agents",
      name: "agents",
      component: () => import("../views/AgentsView.vue"),
    },
    {
      path: "/teams",
      name: "teams",
      component: () => import("../views/TeamsView.vue"),
    },
    {
      path: "/teams/:id",
      name: "team-detail",
      component: () => import("../views/TeamDetailView.vue"),
    },
    {
      path: "/tournaments",
      name: "tournaments",
      component: () => import("../views/TournamentsView.vue"),
    },
    {
      path: "/tournaments/:id",
      name: "tournament-detail",
      component: () => import("../views/TournamentDetailView.vue"),
    },
    {
      path: "/profile",
      name: "profile",
      component: () => import("../views/ProfileView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/profile/:id",
      name: "profile-detail",
      component: () => import("../views/ProfileDetailView.vue"),
    },
    {
      path: "/notifications",
      name: "notifications",
      component: () => import("../views/NotificationsView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/admin",
      name: "admin",
      component: () => import("../views/AdminDashboardView.vue"),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/admin/tournaments",
      name: "admin-tournaments",
      component: () => import("../views/TournamentManageView.vue"),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/contact",
      name: "contact",
      component: () => import("../views/ContactView.vue"),
    },
    {
      path: "/rules",
      name: "rules",
      component: () => import("../views/RulesView.vue"),
    },
    {
      path: "/patchnotes",
      name: "patchnotes",
      component: () => import("../views/PatchNotesView.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("../views/NotFoundView.vue"),
    },
  ],
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();
  if (authStore.loading) {
    await authStore.initialize();
  }

  if (to.meta.requiresAuth && !authStore.user) {
    next("/login");
  } else if (
    to.meta.requiresAdmin &&
    authStore.profile?.role !== "admin" &&
    authStore.profile?.role !== "superadmin"
  ) {
    next("/");
  } else {
    next();
  }
});

export default router;
