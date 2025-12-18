<template>
  <div class="flex flex-col gap-[84px]">
    <BlogItem v-for="post in posts" :key="post._path" :post="post" />
  </div>
</template>

<script setup>
defineProps({
  posts: { type: Array, required: true },
})
</script>
