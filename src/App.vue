<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()

// Check if user has a valid session on app start                                                                      
onMounted(() => {
  if (localStorage.getItem('token')) {
    auth.fetchMe()
  }
})
</script>

<template>
  <RouterView />
</template>