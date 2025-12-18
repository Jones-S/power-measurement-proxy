<template>
  <article class="flex flex-col gap-[42px]">
    <!-- Title and Date -->
    <div class="flex flex-col gap-3">
      <h2 class="text-[32px] font-bold leading-none font-sans text-black">
        {{ post.title }}
      </h2>
      <time class="text-smfont-sans text-black">
        {{ formattedDate }}
      </time>
    </div>

    <!-- Media and Content -->
    <div class="flex flex-col gap-[31px]">
      <!-- Image or Vimeo Embed -->
      <div class="flex flex-col gap-3 sd-subgrid md:col-span-10">
        <!-- Image -->
        <div v-if="post.image" class="w-full md:col-span-10">
          <img
            :src="post.image.src"
            :alt="post.image.alt"
            class="w-full h-auto object-cover"
          />
        </div>

        <!-- Vimeo Embed -->
        <div v-else-if="post.vimeo" class="aspect-video w-full md:col-span-10">
          <iframe
            :src="`https://player.vimeo.com/video/${post.vimeo.videoId}`"
            class="w-full h-full"
            frameborder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowfullscreen
          />
        </div>

        <!-- Caption -->
        <p
          v-if="post.image?.caption || post.vimeo?.caption"
          class="text-smfont-sans text-black md:col-span-8"
        >
          {{ post.image?.caption || post.vimeo?.caption }}
        </p>
      </div>

      <!-- Teaser and Link -->
      <div class="flex flex-col gap-[31px] md:col-span-8">
        <p class="text-[17px] leading-[22px] font-['Larken'] text-black">
          {{ post.teaser }}
        </p>
        <NuxtLink
          :to="`/blog/${post._path?.split('/').pop()}`"
          class="text-[16px] font-sans text-highlight underline decoration-solid hover:opacity-80"
        >
          Read more
        </NuxtLink>
      </div>
    </div>
  </article>
</template>

<script setup>
const props = defineProps({
  post: { type: Object, required: true },
})

const formattedDate = computed(() => {
  if (!props.post.date) return ''
  const date = new Date(props.post.date)
  return date.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
})
</script>
