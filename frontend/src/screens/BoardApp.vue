<script setup>
import { ref } from 'vue';
import Sticker from '../components/board/Sticker.vue';
import CollapsedPanel from '@/components/board/CollapsedPanel.vue';
import SettingsPanel from '@/components/board/SettingsPanel.vue';
import Toolbar from '@/components/board/Toolbar.vue';
import { useMainStore } from '../stores/main.store';

const store = useMainStore();
const activeGeneralSettings = ref(false);

</script>

<template>
  <main>
            <div class="board">
              <Sticker v-for="sticker in store.stickers.filter(s => !s.folded)" :sticker="sticker" :key="sticker.id"/>
            </div>
            
            <CollapsedPanel />

            <SettingsPanel :active="activeGeneralSettings" />

            <Toolbar
                :activeGeneralSettings="activeGeneralSettings"
                @toggleSettings="activeGeneralSettings = !activeGeneralSettings"
            />
    </main>
</template>

<style lang="sass">

#app
    display: flex
    flex-direction: column
    height: 100%

main
    position: relative
    flex: 1
    overflow: hidden

.board
    background: radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)
    background-size: 20px 20px
    position: relative
    min-height: 100%

</style>
