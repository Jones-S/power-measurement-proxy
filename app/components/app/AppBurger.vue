<template>
  <button
    :class="[
      'h-8 w-8 cursor-pointer transition-transform',
      { '!rotate-90': navIsOpen },
    ]"
    @click="$emit('burgerClicked')"
  >
    <span
      :class="[
        'absolute block h-0.5 w-full origin-center transition-transform',
        navIsOpen ? '-rotate-45 bg-white' : '-translate-y-1 bg-black',
      ]"
    ></span>
    <span
      :class="[
        'absolute block h-0.5 w-full origin-center bg-black transition-transform',
        navIsOpen ? 'rotate-45 bg-white' : 'translate-y-1 bg-black',
      ]"
    ></span>
  </button>
</template>

<script setup>
defineEmits(['burgerClicked'])
defineProps({
  navIsOpen: { type: Boolean, default: false },
})
</script>
