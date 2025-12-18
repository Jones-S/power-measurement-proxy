<template>
  <div>
    <ul>
      <li>
        <a ref="mainSkipLink" href="#" @click="jumpTo($event, 'main')">
          Jump to Main Content
        </a>
      </li>
      <li>
        <a href="#" @click="jumpTo($event, 'footer')"> Jump to Footer </a>
      </li>
    </ul>
  </div>
</template>

<script setup>
const jumpTo = (e, target) => {
  if (e) e.preventDefault()
  const targetElement = document.getElementById(target)

  if (targetElement) {
    if (target === 'footer') window.scrollTo(0, document.body.scrollHeight)
    if (target === 'main') window.scrollTo(0, targetElement)
    targetElement.focus()
  }
}
</script>

<style scoped>
@reference "../../assets/css/tailwind.css";

a {
  @apply fixed top-0 left-2/4 -z-10 mx-auto my-1 -translate-x-2/4 opacity-0;

  &:focus {
    @apply z-50 opacity-100;
  }
}
</style>
