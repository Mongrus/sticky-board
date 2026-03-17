<script setup>
import { STICKER } from '../../constants/sticker.constants'
import { useMainStore } from '@/stores/main.store';
defineProps({
    activeGeneralSettings: Boolean
})

const emit = defineEmits(['toggleSettings'])

const store = useMainStore();

</script>

<template>
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
            store.getDefaultColor(), // Цвет фона
            STICKER.DEFAULT_FONT, // Шрифт
            store.settings.fontSize, // Размер шрифта
            store.getTextColor(store.getDefaultColor()), // Цвет текста
            Math.max(...store.stickers.map(s => s.z), 0) // z-index
            )">Создать +</button>
        <button class="toolbar__btn-clear" @click="store.confirmClearBoard = true">Очистить</button>
        <button
            class="toolbar__btn-settings"
            :class="{ active: activeGeneralSettings }"
            @click="emit('toggleSettings')"
        >
        Настройки
        </button>
    </div>
</template>

<style lang="sass" scoped>

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
    transition: .3s
    z-index: 9999
    &:hover
        transition: .3s
        background-color: #EDF3FA
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

</style>