import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("../pages/Login.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/register",
      name: "register",
      component: () => import("../pages/Register.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/",
      name: "chat",
      component: () => import("../pages/Chat.vue"),
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  // Only fetch user if we don't have one and we aren't already trying to fetch
  if (!auth.user) {
    await auth.fetchMe();
  }

  if (to.meta.requiresAuth && !auth.user) {
    return { name: "login" };
  }

  if (to.meta.requiresGuest && auth.user) {
    return { name: "chat" };
  }
});

export default router;
