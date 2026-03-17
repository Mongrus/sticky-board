<script setup>
defineProps({
    title: String,
    text: String,
    confirmText: {
        type: String,
        default: 'Подтвердить'
    }
})

const emit = defineEmits(['cancel', 'confirm'])
</script>

<template>
<div class="modal-overlay">
    <div class="modal">
        <h3>{{ title }}</h3>
        <p>{{ text }}</p>
        <div class="modal__buttons">
            <button @click="emit('cancel')">
                Отмена
            </button>

            <button class="danger" @click="emit('confirm')">
                {{ confirmText }}
            </button>
        </div>
    </div>
</div>
</template>

<style lang="sass" scoped>
.modal-overlay
    position: fixed
    inset: 0
    background: rgba(0,0,0,0.25)
    display: flex
    align-items: center
    justify-content: center
    z-index: 10000

.modal
    background: #F5F8FC
    padding: 25px
    border-radius: 12px
    border: 1px solid rgba(0,0,0,0.06)
    box-shadow: 0 8px 20px rgba(0,0,0,0.15)
    max-width: 360px
    text-align: center
    &__buttons
        display: flex
        justify-content: center
        gap: 12px
        margin-top: 18px

button
    padding: 6px 16px
    border-radius: 10px
    border: none
    background: white
    box-shadow: 0 2px 6px rgba(0,0,0,0.08)
    cursor: pointer
    &:hover
        background: #5C9CFF
        color: white

.danger
    &:hover
        background: #E06A6A

</style>