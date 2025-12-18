<template>
  <div class="ds-grid pt-16 md:pt-32">
    <div class="col-span-full flex flex-col gap-6 md:col-span-8 md:col-start-3">
      <h1 class="font-sans text-xl leading-normal font-normal text-black">
        Measuring a Website's Power Usage
      </h1>

      <div class="flex flex-col gap-2 font-sans font-light text-black">
        <p class="text-base leading-normal">
          Enter a URL to receive the power usage needed to load and display this
          page on an M1 Macbook Pro.
        </p>
        <p class="text-xs leading-normal">
          Internally a firefox instance is initiated, opens the given URL, uses
          the internal
          <a
            href="https://profiler.firefox.com/docs/#/"
            class="cursor-pointer underline decoration-solid"
            target="_blank"
            rel="noopener noreferrer"
          >
            profiler
          </a>
          to measure the power consumption.
        </p>
      </div>

      <form class="flex gap-3" @submit.prevent="handleSubmit">
        <div
          class="flex-1 border border-solid border-gray-500 bg-gray-100 px-4 py-2"
        >
          <input
            id="url"
            v-model="url"
            type="text"
            placeholder="URL"
            class="w-full bg-transparent font-sans text-base leading-normal font-light text-black outline-none"
          />
        </div>
        <button
          type="submit"
          :disabled="isLoading"
          class="bg-[#cdedbe] px-3 py-2 text-center font-sans text-base font-semibold whitespace-nowrap text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ isLoading ? 'Measuring...' : 'Measure' }}
        </button>
      </form>

      <p v-if="errorMessage" class="text-highlight font-sans text-sm">
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>

<script setup>
const url = ref('')
const errorMessage = ref('')
const isLoading = ref(false)
const config = useRuntimeConfig()

const validateUrl = (urlString) => {
  try {
    const urlObj = new URL(urlString)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch (e) {
    return false
  }
}

const handleSubmit = async () => {
  errorMessage.value = ''

  if (!url.value.trim()) {
    errorMessage.value = 'Please enter a URL'
    return
  }

  if (!validateUrl(url.value)) {
    errorMessage.value =
      'Please enter a valid URL (must start with http:// or https://)'
    return
  }

  isLoading.value = true

  try {
    const port = config.public.browsertimePort
    const response = await fetch(`http://localhost:${port}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: url.value }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('Measurement started:', data)

    // TODO: Handle successful response - show results or status
  } catch (error) {
    console.error('Error running measurement:', error)
    errorMessage.value = 'Failed to start measurement. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
