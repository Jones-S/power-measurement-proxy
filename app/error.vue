<template>
  <div class="p-5">
    <AppHeader />
    <div>
      <h1>{{ error.statusCode }} – {{ error.message }}</h1>
      <NuxtLink to="/" @click="handleError">
        <span>Back to Home</span>
      </NuxtLink>
    </div>
    <AppFooter />
  </div>
</template>

<script setup>
defineProps({
  error: {
    type: Object,
    default: () => {},
  },
})
const handleError = () => clearError()
</script>
