<script setup>
import Sticker from './components/Sticker.vue';
import { useMainStore } from './stores/main.store';

const store = useMainStore();

</script>

<template>
  <header>
    <button @click="store.createSticker(
        store.stickers.length, 
        '', 
        false, 
        !store.stickers.length ? 20 : store.stickers.length * 10 + 20, 
        !store.stickers.length ? 20 : store.stickers.length * 10 + 20, 
        store.settings.width, 
        store.settings.height, 
        store.settings.backgroundColor, 
        store.settings.fontSize
        )">+</button>
  </header>
  <main>
    <div>

    </div>
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
