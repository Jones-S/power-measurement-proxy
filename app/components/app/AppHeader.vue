<template>
  <header class="sticky top-6 left-0 z-10 mb-12 flex w-full items-center p-6">
    <AppLogo />
    <div class="z-50 flex w-full justify-center md:hidden">
      <AppBurger
        :nav-is-open="mobileNavIsOpen"
        @burger-clicked="handleBurgerClick"
      />
    </div>
    <Transition>
      <div
        v-if="mobileNavIsOpen"
        class="mobile-nav fixed top-0 left-0 z-40 flex h-screen w-screen flex-col items-center justify-center bg-black text-white"
      >
        mobile nav
      </div>
    </Transition>
  </header>
</template>

<script setup>
import { disablePageScroll, enablePageScroll } from '@fluejs/noscroll'

const mobileNavIsOpen = ref(false)

const handleBurgerClick = () => {
  mobileNavIsOpen.value = !mobileNavIsOpen.value

  if (mobileNavIsOpen.value) {
    disablePageScroll()
  } else {
    enablePageScroll()
  }
}

const closeNav = () => {
  mobileNavIsOpen.value = false
  enablePageScroll()
}

const onEscapeKeyUp = (event) => {
  if (event.which === 27) {
    closeNav()
  }
}

onMounted(() => {
  window.addEventListener('keyup', onEscapeKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keyup', onEscapeKeyUp)
})
</script>

<style scoped>
@reference "../../assets/css/tailwind.css";

:deep(.mobile-nav ul) {
  @apply flex-col text-center;
}
</style>
