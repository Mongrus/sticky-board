<script setup>
import Footer from './components/layout/Footer.vue'
</script>

<template>
  <div class="app-router-shell">
    <RouterView />
  </div>
  <Footer />
</template>

<style scoped lang="sass">
.app-router-shell
  flex: 1
  min-height: 0
  display: flex
  flex-direction: column
</style>
