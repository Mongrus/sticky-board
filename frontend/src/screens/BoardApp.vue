<script setup>
import { ref } from 'vue';
import { useMainStore } from '../stores/main.store';
import Sticker from '../components/board/Sticker.vue';
import CollapsedPanel from '@/components/board/CollapsedPanel.vue';
import SettingsPanel from '@/components/board/SettingsPanel.vue';
import Toolbar from '@/components/board/Toolbar.vue';
import CookieModal from '@/components/modals/CookieModal.vue';
import ConfirmModal from '@/components/modals/ConfirmModal.vue';
import RestoreToast from '@/components/modals/RestoreToast.vue';

const store = useMainStore();
const activeGeneralSettings = ref(false);

function createStickerOnDoubleClick(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  store.createSticker(
    store.nextId,
    '',
    false,
    x,
    y,
    store.settings.width,
    store.settings.height,
    store.getDefaultColor(),
    store.settings.font,
    store.settings.fontSize,
    store.getTextColor(store.getDefaultColor()),
    Math.max(...store.stickers.map(s => s.z), 0)
  );
}
</script>

<template>
    <main>
            <div class="board" @dblclick="createStickerOnDoubleClick">
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

        <RestoreToast />

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
