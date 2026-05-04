import { defineStore } from "pinia";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { http } from "../api/http";
import { connectSocket, disconnectSocket } from "../api/socket";

interface User {
  id: string;
  username: string;
  email: string;
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref("");
  const router = useRouter();
  let initPromise: Promise<void> | null = null;

  async function register(username: string, email: string, password: string) {
    loading.value = true;
    error.value = "";

    try {
      const { data } = await http.post("/auth/register", {
        username,
        email,
        password,
      });

      user.value = data.data.user;
      connectSocket();
      router.push("/");
    } catch (err: any) {
      error.value = err.response?.data.error || "Registration failed";
    } finally {
      loading.value = false;
    }
  }

  async function login(email: string, password: string) {
    loading.value = true;
    error.value = "";
    try {
      const { data } = await http.post("/auth/login", { email, password });
      user.value = data.data.user;
      connectSocket();
      router.push("/");
    } catch (err: any) {
      error.value = err.response?.data?.error || "Login failed";
    } finally {
      loading.value = false;
    }
  }

  function fetchMe() {
    if (initPromise) return initPromise;

    initPromise = http
      .get("/auth/me")
      .then(({ data }) => {
        user.value = data.data.user;
        connectSocket();
      })
      .catch(() => {
        user.value = null;
        disconnectSocket();
      })
      .finally(() => {
        initPromise = null;
      });

    return initPromise;
  }

  async function logout() {
    await http.post("/auth/logout").catch(() => {});
    user.value = null;
    disconnectSocket();
    initPromise = null;
    router.push("/login");
  }

  return { user, loading, error, register, login, fetchMe, logout };
});
