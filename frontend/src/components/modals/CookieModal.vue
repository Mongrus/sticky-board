<script setup>
import { useMainStore } from '@/stores/main.store'

const store = useMainStore()
</script>

<template>
    <div class="cookie">
        <p>
            Мы используем файлы cookie для сохранения пользовательских
            настроек и обеспечения корректной работы приложения.
            Подробнее в
            <RouterLink to="/privacy">политике конфиденциальности</RouterLink>.
        </p>

        <div class="cookie__buttons accept">
            <button class="accept" @click="store.cookiesConfirmed = true">
                Принять
            </button>

            <button class="reject" @click="store.cookiesConfirmed = true">
                Только необходимые
            </button>
        </div>
    </div>
</template>

<style lang="sass" scoped>

.cookie
    position: fixed
    bottom: 80px
    left: 50%
    transform: translateX(-50%)
    max-width: 520px
    padding: 18px 22px
    background: #F5F8FC
    border-radius: 12px
    border: 1px solid rgba(0,0,0,0.06)
    box-shadow: 0 4px 14px rgba(0,0,0,0.12)
    &__buttons
        display: flex
        gap: 10px
        margin-top: 10px
    a
        color: #5C9CFF
        text-decoration: none
        font-weight: 500
        &:hover
            text-decoration: underline

button
    padding: 6px 14px
    border-radius: 10px
    border: none
    background: white
    box-shadow: 0 2px 6px rgba(0,0,0,0.08)
    cursor: pointer
    &:hover
        background: #5C9CFF
        color: white
    
.reject
    &:hover
        background-color: #7A8798



</style>