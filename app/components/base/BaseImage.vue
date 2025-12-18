<template>
  <div
    :class="[
      'base-image h-full w-full opacity-0 transition-all duration-300',
      { 'opacity-100': imageLoaded },
    ]"
  >
    <img
      v-if="image && image.mimeType === 'image/svg+xml'"
      :class="['h-full w-full max-w-none object-cover']"
      :alt="image.alt || image.title"
      :src="image.url"
      :width="image.width"
      :height="image.height"
      :loading="lazy ? 'lazy' : 'eager'"
      :onload="onLoad()"
    />
    <img
      v-else-if="image"
      :class="['h-full w-full max-w-none object-cover']"
      :alt="image.alt || image.title"
      :src="image.large"
      :srcset="`
        ${image.large} 1920w,
        ${image.medium} 1440w,
        ${image.small} 768w
        `"
      sizes="(min-width: 1440px) 100vw, (min-width: 768px) 60vw, 100vw"
      :style="`object-position:${focalPointPercentage}`"
      :width="image.width"
      :height="image.height"
      :loading="lazy ? 'lazy' : 'eager'"
      :onload="onLoad()"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  image: { type: Object, required: true },
  lazy: { type: Boolean, default: true },
})

const imageLoaded = ref(false)
const onLoad = () => {
  imageLoaded.value = true
}

const focalPointPercentage = computed(() => {
  if (props.image?.focalPoint?.length > 0) {
    return `${props.image.focalPoint[0] * 100}% ${props.image.focalPoint[1] * 100}%`
  } else {
    return '50% 50%'
  }
})
</script>
