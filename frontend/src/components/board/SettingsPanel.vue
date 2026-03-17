<script setup>
import { useMainStore } from '@/stores/main.store';

defineProps({
    active: Boolean
})

const store = useMainStore()

</script>

<template>
    <div v-show="active" class="general-settings-panel">
        <h3>Настройки по-умолчанию</h3>
        <label>Основная тема стикеров:</label>
        <select v-model="store.settings.backgroundColor">
            <option value="color">Случайный цвет</option>
            <option value="#2B2B2B">Темная</option>
            <option value="snow">Светлая</option>
        </select>
        <label>Размер шрифта:</label>
        <input type="number" v-model.number="store.settings.fontSize" min="1">
        <label>Высота:</label>
        <input type="number" v-model.number="store.settings.height" min="50">
        <label>Ширина:</label>
        <input type="number" v-model.number="store.settings.width" min="100">
    </div>
</template>

<style lang="sass" scoped>

.general-settings-panel
    position: absolute
    display: flex
    flex-direction: column
    padding: 15px
    right: 0
    top: 10vh
    width: 300px
    height: 80%
    background-color: #F5F8FC
    box-shadow: 0 4px 14px rgba(0,0,0,0.12)
    border: 1px solid rgba(0,0,0,0.06)
    border-radius: 15px 0 0 15px
    transition: .3s
    z-index: 9999
    &:hover
        transition: .3s
        background-color: #EDF3FA

</style>