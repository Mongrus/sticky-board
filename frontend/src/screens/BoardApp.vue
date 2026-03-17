<script setup>
import { ref } from 'vue';
import Sticker from '../components/board/Sticker.vue';
import CollapsedPanel from '@/components/board/CollapsedPanel.vue';
import SettingsPanel from '@/components/board/SettingsPanel.vue';
import Toolbar from '@/components/board/Toolbar.vue';
import { useMainStore } from '../stores/main.store';
import CookieModal from '@/components/modals/CookieModal.vue';
import ConfirmModal from '@/components/modals/ConfirmModal.vue';

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
        
        <CookieModal v-if="!store.cookiesConfirmed"/>

        <ConfirmModal
            v-if="store.confirmDeleteStickerId"
            title="Удалить стикер?"
            text="Это действие нельзя отменить."
            confirmText="Удалить"
            @cancel="store.confirmDeleteStickerId = false"
            @confirm="store.destroySticker(store.confirmDeleteStickerId)"
        />

        <ConfirmModal
            v-if="store.confirmClearBoard"
            title="Очистить доску?"
            text="Все стикеры будут удалены."
            confirmText="Очистить"
            @cancel="store.confirmClearBoard = false"
            @confirm="store.clearBoard()"
        />
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
