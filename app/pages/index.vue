<template>
  <div class="ds-grid pt-16 md:pt-32">
    <div class="col-span-full flex flex-col gap-6 md:col-span-8 md:col-start-3">
      <h1 class="font-sans text-xl leading-normal font-normal text-black">
        Measuring a Website's Power Usage
      </h1>

      <div class="flex flex-col gap-2 font-sans font-light text-black">
        <p class="text-base leading-normal">
          Enter a URL to receive the power usage needed to load and display this
          page on a M2 Mac Mini.
        </p>
        <p class="text-xs leading-normal">
          Internally a firefox instance is initiated, opens the given URL, uses
          the internal
          <a
            href="https://profiler.firefox.com/docs/#/"
            class="cursor-pointer underline decoration-solid"
            target="_blank"
            rel="noopener noreferrer"
            >profiler</a
          >
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

      <div v-if="isLoading">
        <div v-if="queuePosition !== null && queuePosition > 0">
          Position in queue: {{ queuePosition }}
        </div>
        <div v-else-if="queuePosition === 0">Running measurement...</div>
      </div>

      <p v-if="errorMessage" class="text-highlight font-sans text-sm">
        {{ errorMessage }}
      </p>

      <div v-if="results" class="mt-8 border-t border-gray-500 pt-8">
        <h2 class="mb-4 font-sans text-lg font-medium text-black">
          Results for: {{ results.url }}
        </h2>

        <div class="flex flex-col gap-4 font-sans text-black">
          <div class="flex flex-col gap-1">
            <p class="text-sm font-light text-gray-700">Power Consumption</p>
            <p class="text-2xl font-semibold">
              {{ results.powerConsumption.value.toFixed(6)
              }}{{ results.powerConsumption.unit }}
            </p>
          </div>

          <div class="flex flex-col gap-1">
            <p class="text-sm font-light text-gray-700">Execution Time</p>
            <p class="text-2xl font-semibold">{{ results.executionTime }}</p>
          </div>

          <div class="flex flex-col gap-1">
            <p class="text-sm font-light text-gray-700">
              First Contentful Paint
            </p>
            <p class="text-2xl font-semibold">
              {{ results.firstContentfulPaint }}ms
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const url = ref('')
const errorMessage = ref('')
const isLoading = ref(false)
const results = ref(null)
const queuePosition = ref(null)
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
  results.value = null

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
    // const port = config.public.browsertimePort
    const powerProxyUrl = config.public.powerProxyUrl

    const response = await fetch(`${powerProxyUrl}/measure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: url.value }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const { jobId, position } = await response.json()
    console.log(`Job queued with ID: ${jobId}, position: ${position}`)

    // Update queue position
    queuePosition.value = position

    // Poll for status every 10 seconds
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await fetch(`${powerProxyUrl}/status/${jobId}`)

        if (!statusResponse.ok) {
          throw new Error('Failed to fetch status')
        }

        const statusData = await statusResponse.json()
        console.log('Job status:', statusData.status)

        if (statusData.status === 'queued') {
          queuePosition.value = statusData.position
        } else if (statusData.status === 'running') {
          queuePosition.value = 0 // Or show "Running..." in UI
        } else if (statusData.status === 'complete') {
          // Job completed - stop polling and display results
          clearInterval(pollInterval)
          isLoading.value = false
          queuePosition.value = null

          results.value = {
            url: url.value,
            powerConsumption: statusData.result.powerConsumption,
            executionTime: statusData.result.executionTime,
            firstContentfulPaint:
              statusData.result.googleWebVitals.firstContentfulPaint,
          }

          console.log('Measurement completed:', statusData.result)
        } else if (statusData.status === 'failed') {
          // Job failed - stop polling and show error
          clearInterval(pollInterval)
          isLoading.value = false
          queuePosition.value = null

          throw new Error(statusData.error?.error || 'Measurement failed')
        }
      } catch (pollError) {
        console.error('Error polling status:', pollError)
        clearInterval(pollInterval)
        isLoading.value = false
        queuePosition.value = null
        errorMessage.value =
          'Failed to get measurement status. Please try again.'
      }
    }, 10000) // Poll every 10 seconds

    // Optional: Set a maximum timeout (e.g., 5 minutes)
    setTimeout(
      () => {
        clearInterval(pollInterval)
        if (isLoading.value) {
          isLoading.value = false
          queuePosition.value = null
          errorMessage.value = 'Measurement timed out. Please try again.'
        }
      },
      5 * 60 * 1000,
    ) // 5 minutes timeout
  } catch (error) {
    console.error('Error starting measurement:', error)
    errorMessage.value = 'Failed to start measurement. Please try again.'
    isLoading.value = false
    queuePosition.value = null
  }
}
</script>
