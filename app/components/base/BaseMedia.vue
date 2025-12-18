<template>
  <div class="h-full w-full">
    <BaseVideo v-if="media && mediaIsVideo" :video="media.url" />
    <BaseImage
      v-else-if="media"
      class="h-full w-full object-cover"
      :image="media"
      :lazy="lazy"
    />
  </div>
</template>

<script setup>
const videoMimeType = ['video/mp4', 'video/quicktime']
const props = defineProps({
  media: { type: Object, required: true },
  lazy: { type: Boolean, default: true },
})

const mediaIsVideo = computed(() => {
  return videoMimeType.includes(props.media.mimeType)
})
</script>
