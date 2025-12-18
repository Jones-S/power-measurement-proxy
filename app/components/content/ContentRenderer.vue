<template>
  <div>
    <h1 class="">{{ content.title }}</h1>

    <template v-if="content.sections">
      <div v-for="(section, index) in content.sections" :key="index">
        <div v-if="section.type === 'text'" class="mb-4">
          <h2 v-if="section.title">
            {{ section.title }}
          </h2>

          <!-- eslint-disable-next-line vue/no-v-html -->
          <p v-if="section.content" v-html="section.content" />
        </div>

        <div v-if="section.type === 'list'" class="mt-4 mb-10">
          <h3 v-if="section.title">
            {{ section.title }}
          </h3>
          <ul v-if="section?.list?.items">
            <li v-for="(item, index) in section.list.items" :key="index">
              <!-- eslint-disable-next-line vue/no-v-html -->
              <span v-html="item.text" />
            </li>
          </ul>
        </div>

        <div v-if="section.type === 'image'" class="mt-4 mb-10">
          <img
            class="disable-blur relative w-full cursor-pointer"
            :src="section.ditherSrc"
            :alt="section.alt"
            @click="showHighResImage(section.src, $event.target)"
          />
          <div
            v-show="!imageLoaded(section.src)"
            class="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-white"
          >
            Click to view high-resolution image
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
defineProps({
  content: {
    type: Object,
    required: true,
  },
})

const loadedImages = ref([])

const imageLoaded = (src) => {
  return loadedImages.value.includes(src)
}

const showHighResImage = (src, target) => {
  if (src) {
    target.src = src
    if (!loadedImages.value.includes(src)) {
      loadedImages.value.push(src)
    }
  }
}
</script>

<style scoped>
:deep(a) {
  text-decoration: underline;
}
</style>
