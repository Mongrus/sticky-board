<script setup>
import { useMainStore } from '@/stores/main.store';

const store = useMainStore();

</script>

<template>
    <div class="collapsed-panel" v-if="store.stickers.some(s => s.folded)">
        <button 
            class="collapsed-panel__sticker" 
            v-for="sticker in store.stickers.filter(s => s.folded)" 
            :style="{ backgroundColor: sticker.bc, color: store.getTextColor(sticker.bc) }"
            @click="store.setFoldedSticker(sticker.id)"
            >
            <p>№{{ sticker.id }}</p>
        </button>
    </div>
</template>

<style lang="sass" scoped>

.collapsed-panel
    position: absolute
    display: flex
    flex-direction: column
    justify-content: flex-start
    align-items: center
    scroll-behavior: smooth
    padding: 30px 0
    left: 10px
    top: 13vh
    width: 55px
    min-height: 50vh
    max-height: 70vh
    overflow: auto
    border-radius: 12px
    background-color: #F5F8FC
    box-shadow: 0 4px 14px rgba(0,0,0,0.12)
    border: 1px solid rgba(0,0,0,0.06)
    transition: .3s
    z-index: 9999
    &:hover
        transition: .3s
        background-color: #EDF3FA
    &::-webkit-scrollbar
        width: 6px
    &::-webkit-scrollbar-thumb
        background: rgba(0,0,0,0.2)
        border-radius: 10px
    &__sticker
        width: 40px
        height: 40px
        font-weight: bold
        cursor: pointer
        flex-shrink: 0
        transition: .3s
        &:hover
            transition: .3s
            transform: translateY(-5px)

</style>