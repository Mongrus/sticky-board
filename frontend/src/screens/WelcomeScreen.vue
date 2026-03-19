<script setup>
import { useMainStore } from '@/stores/main.store'
import { useRouter } from 'vue-router'
import { WELCOME_STORAGE_KEY } from '@/constants/app.constants'
import CookieModal from '@/components/modals/CookieModal.vue'

const store = useMainStore()
const router = useRouter()

function startWork() {
  localStorage.setItem(WELCOME_STORAGE_KEY, 'true')
  router.push('/board')
}
</script>

<template>
    <div class="welcome">
        <div class="welcome__content">
            <h1>Онлайн Стикеры</h1>
            <p>
            Простая онлайн-доска для заметок и идей.
            Создавайте стикеры, перемещайте их по рабочему пространству
            и организуйте мысли в удобном визуальном формате.
            </p>
            <RouterLink
            class="welcome__btn"
            to="/board"
            @click.prevent="startWork()"
            >
            Начать работу
            </RouterLink>
        </div>
        <CookieModal v-if="!store.cookiesConfirmed"/>
    </div>
</template>

<style scoped lang="sass">

.welcome
    position: relative
    display: flex
    align-items: center
    justify-content: center
    height: 100%

    background: radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)
    background-size: 20px 20px


.welcome__content
    text-align: center
    max-width: 520px
    padding: 20px


h1
    font-size: 45px
    margin-bottom: 12px
    font-weight: 600


p
    font-size: 17px
    color: #555
    line-height: 1.6
    margin-bottom: 30px


.welcome__btn
    display: inline-block
    padding: 8px 28px
    border-radius: 10px

    background: #DCEAFB
    color: #333
    text-decoration: none
    font-weight: 500

    box-shadow: 0 2px 6px rgba(0,0,0,0.08)

    transition: all .15s ease


.welcome__btn:hover
    background: #5C9CFF
    color: white
    box-shadow: 0 4px 12px rgba(0,0,0,0.12)
    transform: translateY(-1px)


.welcome__btn:active
    transform: translateY(1px)

</style>