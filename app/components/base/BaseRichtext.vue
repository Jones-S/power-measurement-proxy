<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <span class="block w-5/6" v-html="content" />
</template>

<script lang="ts" setup>
defineProps({
  content: { type: String, required: true },
})
</script>

<style>
@reference "../../assets/css/tailwind.css";

span {
  img {
    @apply mb-8 w-2/5;
  }

  p {
    @apply mb-4;
  }

  a {
    @apply underline;
  }

  ul {
    @apply list-disc pl-10;
  }
}
</style>
