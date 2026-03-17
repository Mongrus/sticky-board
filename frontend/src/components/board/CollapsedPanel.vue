<script setup>
import { useMainStore } from '@/stores/main.store';

const store = useMainStore();

</script>

<template>
    <div class="collapsed-panel" v-if="store.stickers.some(s => s.folded)">
        <div class="collapsed-panel__container">
            <button 
                class="collapsed-panel__sticker" 
                v-for="sticker in store.stickers.filter(s => s.folded)" 
                :style="{ backgroundColor: sticker.bc, color: store.getTextColor(sticker.bc) }"
                @click="store.setFoldedSticker(sticker.id)"
                >
                <p>№{{ sticker.id }}</p>
            </button>
        </div>
    </div>
</template>

<style lang="sass" scoped>

.collapsed-panel
    position: absolute
    left: 10px
    top: 13vh
    width: 55px
    height: 75vh
    border-radius: 12px
    background-color: #F5F8FC
    box-shadow: 0 4px 14px rgba(0,0,0,0.12)
    border: 1px solid rgba(0,0,0,0.06)
    transition: .3s
    z-index: 9999
    &:hover
        background-color: #EDF3FA
    &__container
        display: flex
        flex-direction: column
        align-items: center
        padding: 5px 0
        margin-top: 30px
        max-height: 65vh
        overflow: auto
        &::-webkit-scrollbar
            width: 4px
        &::-webkit-scrollbar-thumb
            background: rgba(0,0,0,0.25)
            border-radius: 10px
    &__sticker
        width: 40px
        height: 40px
        display: flex
        align-items: center
        justify-content: center
        border: 1px solid #DCEAFB
        font-size: 15px
        font-weight: 600
        background: transparent
        border-radius: 6px
        font-weight: bold
        cursor: pointer
        flex-shrink: 0
        transition: .2s
        &:hover
            transform: translateY(-3px)

</style>