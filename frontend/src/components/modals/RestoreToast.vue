<script setup>
import { useMainStore } from '@/stores/main.store'

const store = useMainStore()
</script>

<template>
    <div v-if="store.deletedStickers.length" class="restore-toasts">
        <TransitionGroup name="toast">
            <div
                v-for="item in store.deletedStickers"
                :key="item.sticker.id"
                class="restore-toast"
            >
                <span class="restore-toast__text">Стикер №{{ item.sticker.id }} удалён</span>
                <button class="restore-toast__btn" @click="store.restoreSticker(item.sticker.id)">
                    Восстановить
                </button>
            </div>
        </TransitionGroup>
    </div>
</template>

<style lang="sass" scoped>
.restore-toasts
    position: fixed
    bottom: 90px
    left: 50%
    transform: translateX(-50%)
    display: flex
    flex-direction: column
    gap: 8px
    align-items: center
    z-index: 10001

.restore-toast
    display: flex
    align-items: center
    gap: 16px
    padding: 12px 20px
    background: #F5F8FC
    border-radius: 12px
    border: 1px solid rgba(0,0,0,0.06)
    box-shadow: 0 4px 14px rgba(0,0,0,0.12)

.restore-toast__text
    font-size: 14px
    color: #555

.restore-toast__btn
    padding: 10px 20px
    border-radius: 50px
    border: none
    background: white
    box-shadow: 0 2px 6px rgba(0,0,0,0.08)
    font-weight: 500
    color: #333
    font-size: 14px
    cursor: pointer
    transition: all .15s ease
    &:hover
        box-shadow: 0 4px 12px rgba(0,0,0,0.12)
        transform: translateY(-2px) scale(1.05)
        background-color: #5C9CFF
        color: white
    &:active
        transform: translateY(0) scale(0.95)

.toast-enter-active,
.toast-leave-active,
.toast-move
    transition: all 0.25s ease

.toast-enter-from,
.toast-leave-to
    opacity: 0
    transform: translateY(16px)
</style>
