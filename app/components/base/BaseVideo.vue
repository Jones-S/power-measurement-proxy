<template>
  <div class="h-full w-full">
    <video
      :class="['h-full w-full object-cover']"
      autoplay
      loop
      muted
      playsinline
      disablepictureinpicture
      disableremoteplayback
      preload="metadata"
    >
      <source :src="video" type="video/mp4" />
    </video>
  </div>
</template>

<script setup>
defineProps({
  video: { type: String, required: true },
})
</script>
