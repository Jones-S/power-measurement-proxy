<template>
  <div class="ds-grid pt-4 md:pt-10">
    <div class="col-span-full md:col-span-10 md:col-start-2">
      <h1 class="m4e-heading-1">Power Measurement Proxy</h1>
      
      <div class="mt-8 md:mt-12">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="url" class="block text-sm font-medium mb-2">
              Website URL
            </label>
            <input
              id="url"
              v-model="url"
              type="text"
              placeholder="https://example.com"
              class="w-full px-4 py-3 border border-gray-500 focus:border-black focus:outline-none transition-colors"
              :class="{ 'border-highlight': errorMessage }"
            />
            <p v-if="errorMessage" class="mt-2 text-sm text-highlight">
              {{ errorMessage }}
            </p>
          </div>
          
          <button
            type="submit"
            :disabled="isLoading"
            class="px-6 py-3 bg-black text-white font-medium text-sm hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {{ isLoading ? 'Measuring...' : 'Run Measurement' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
const url = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

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
    errorMessage.value = 'Please enter a valid URL (must start with http:// or https://)'
    return
  }
  
  isLoading.value = true
  
  try {
    const response = await fetch('http://localhost:3000/run', {
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
