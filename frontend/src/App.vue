<script setup>
import Sticker from './components/Sticker.vue';
import { useMainStore } from './stores/main.store';

const store = useMainStore();
</script>

<template>
  <header>
    <button @click="store.createSticker(1, '', false, 20, 20, 100, 80, 'black', 20)">+</button>
  </header>
  <main>
    <div class="board">
      <Sticker v-for="sticker in store.stickers" :sticker="sticker" :key="sticker.id"/>
    </div>
  </main>
  <footer>

  </footer>
</template>

<style lang="sass" scoped>

.board
    position: relative

</style>
