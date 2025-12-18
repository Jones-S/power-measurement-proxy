<template>
  <div class="mx-auto max-w-4xl px-6 pt-4 md:p-10 md:pt-4 lg:pt-10">
    <ContentRenderer v-if="page" :content="page" />
  </div>
</template>

<script setup>
const route = useRoute()

const { data: page } = await useAsyncData(() =>
  queryCollection('pages').path(`/${route.params.slug}`).first(),
)
</script>
