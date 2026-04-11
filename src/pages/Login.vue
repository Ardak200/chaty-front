<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();

const email = ref("");
const password = ref("");

function handleSubmit() {
  auth.login(email.value, password.value);
}
</script>

<template>
  <div class="auth-page">
    <form class="auth-card" @submit.prevent="handleSubmit">
      <h1>Log in to Chaty</h1>

      <label>
        Email
        <input v-model="email" type="email" required />
      </label>

      <label>
        Password
        <input v-model="password" type="password" required />
      </label>

      <p v-if="auth.error" class="error">{{ auth.error }}</p>

      <button type="submit" :disabled="auth.loading">
        {{ auth.loading ? "Logging in..." : "Log in" }}
      </button>

      <p class="switch">
        No account?
        <RouterLink to="/register">Register</RouterLink>
      </p>
    </form>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 32px;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--shadow);
}

.auth-card h1 {
  font-size: 28px;
  margin: 0 0 8px;
  text-align: center;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: var(--text);
}

input {
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text-h);
  font: inherit;
  font-size: 16px;
}

input:focus {
  outline: 2px solid var(--accent);
  outline-offset: -1px;
  border-color: transparent;
}

button {
  padding: 12px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  font: inherit;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

button:hover:not(:disabled) {
  opacity: 0.9;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #e53e3e;
  font-size: 14px;
  text-align: center;
}

.switch {
  text-align: center;
  font-size: 14px;
}

.switch a {
  color: var(--accent);
  text-decoration: none;
}
</style>
