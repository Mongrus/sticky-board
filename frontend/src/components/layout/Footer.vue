<script setup>

const startYear = 2026
const currentYear = new Date().getFullYear()

const yearText =
  startYear === currentYear
    ? `${startYear}`
    : `${startYear}–${currentYear}`

</script>

<template>

<footer class="footer">

<div class="footer__inner">

<div class="footer__left">
<span>© {{ yearText }}</span>
<span>Трепачёв Дмитрий & Серенко Роман</span>
</div>

<div class="footer__right">
<RouterLink to="/privacy">
Политика конфиденциальности
</RouterLink>
</div>

</div>

</footer>

</template>

<style scoped lang="sass">

.footer
    flex-shrink: 0
    border-top: 1px solid rgba(0,0,0,0.08)
    background: #F5F8FC
    padding: 10px 20px
    padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px))
    font-size: 14px
    color: #666
    &__inner
        max-width: 1200px
        margin: 0 auto
        display: flex
        justify-content: space-between
        align-items: center
    &__left
        display: flex
        gap: 12px
    &__right a
        color: #6b7a90
        text-decoration: none
        transition: 0.2s
    &__right a:hover
        color: #3b82f6

</style>