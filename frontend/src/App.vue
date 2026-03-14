<script setup>
import { ref } from 'vue';
import Sticker from './components/Sticker.vue';
import { STICKER_COLORS, STICKER } from './constants/sticker.constants';
import { useMainStore } from './stores/main.store';

const store = useMainStore();
const activeGeneralSettings = ref(false);

</script>

<template>
  <main>
        <div class="board">
          <Sticker v-for="sticker in store.stickers.filter(s => !s.folded)" :sticker="sticker" :key="sticker.id"/>
        </div>
        <div v-show="activeGeneralSettings" class="general-settings-panel">
        </div>
        <div class="collapsed-panel" v-if="store.stickers.some(s => s.folded)">
            <button 
            class="collapsed-panel__sticker" 
            v-for="sticker in store.stickers.filter(s => s.folded)" 
            :style="{ backgroundColor: sticker.bc }"
            @click="store.setFoldedSticker(sticker.id)"
            ><p>№{{ sticker.id }}</p></button>
        </div>
        <div class="toolbar">
            <button 
                class="toolbar__btn-create"
                @click="store.createSticker(
                store.nextId, 
                '', // Текст
                false, // Свернут ?
                !store.stickers.length ? 100 : store.stickers.length * 10 + 100, // по X
                !store.stickers.length ? 100 : store.stickers.length * 10 + 100, // по Y
                store.settings.width, // Ширина
                store.settings.height, // Высота
                STICKER_COLORS[Math.floor(Math.random() * STICKER_COLORS.length)].value, // Цвет фона
                STICKER.DEFAULT_FONT, // Шрифт
                store.settings.fontSize, // Размер шрифта
                Math.max(...store.stickers.map(s => s.z), 0) // z-index
                )">Создать +</button>
            <button class="toolbar__btn-clear" @click="store.clearBoard()">Очистить</button>
            <button class="toolbar__btn-settings" :class="{ active: activeGeneralSettings }" @click="activeGeneralSettings = !activeGeneralSettings">Настройки</button>
        </div>
    </main>
  <footer>
    <p>Авторы - Трепачев Дмитрий и Серенко Роман</p>
    <p>2026 г.</p>
  </footer>
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

.toolbar
    position: absolute
    display: flex
    gap: 4px
    left: 10vw
    top: 10px
    padding: 10px 20px
    border-radius: 12px
    background-color: #F5F8FC
    box-shadow: 0 4px 14px rgba(0,0,0,0.12)
    border: 1px solid rgba(0,0,0,0.06)
    z-index: 9999
    button
        padding: 5px 14px
        border-radius: 10px
        border: none
        background: white
        box-shadow: 0 2px 6px rgba(0,0,0,0.08)
        font-weight: 500
        color: #333
        cursor: pointer
        transition: all .15s ease
        &:hover
            box-shadow: 0 4px 12px rgba(0,0,0,0.12)
            transform: translateY(-1px)
        &:active
            transform: translateY(1px)
    &__btn-create
        &:hover
            transition: .3s
            background-color: #5C9CFF
            color: white
    &__btn-clear
        &:hover
            transition: .3s
            background-color: #E06A6A
            color: white
    &__btn-settings
        &:hover
            transition: .3s
            background-color: #7A8798
            color: white
        &.active
            background-color: #7A8798
            color: white
    

.general-settings-panel
    position: absolute
    right: 0
    top: 10vh
    width: 300px
    height: 80%
    background-color: #F5F8FC
    box-shadow: 0 4px 14px rgba(0,0,0,0.12)
    border: 1px solid rgba(0,0,0,0.06)
    border-radius: 15px 0 0 15px
    z-index: 9999

.collapsed-panel
    position: absolute
    display: flex
    flex-direction: column
    justify-content: center
    align-items: center
    padding: 30px 0
    left: 10px
    top: 10vh
    width: 55px
    min-height: 50%
    border-radius: 12px
    background-color: #F5F8FC
    box-shadow: 0 4px 14px rgba(0,0,0,0.12)
    border: 1px solid rgba(0,0,0,0.06)
    z-index: 9999
    &:hover
        background-color: #EDF3FA
    &__sticker
        width: 40px
        height: 40px
        transition: .3s
        &:hover
            transition: .3s
            transform: translateY(-5px)




footer
    text-align: center


</style>
