<script setup>
import { useMainStore } from '@/stores/main.store';
import { ref, watch } from 'vue';

defineProps({
    active: Boolean
})

const store = useMainStore();

const localFontSize = ref(store.settings.fontSize);
const localHeight = ref(store.settings.height);
const localWidth = ref(store.settings.width);
const localBackgroundColor = ref(store.settings.backgroundColor);

watch(() => store.settings.fontSize, (newVal) => {
    localFontSize.value = newVal;
});

watch(() => store.settings.height, (newVal) => {
    localHeight.value = newVal;
});

watch(() => store.settings.width, (newVal) => {
    localWidth.value = newVal;
});

watch(() => store.settings.backgroundColor, (newVal) => {
    localBackgroundColor.value = newVal;
});

function updateFontSize() {
    store.settings.fontSize = localFontSize.value;
}

function updateHeight() {
    store.settings.height = localHeight.value;
}

function updateBackgroundColor() {
    store.settings.backgroundColor = localBackgroundColor.value;
}

function updateWidth() {
    store.settings.width = localWidth.value;
}</script>

<template>
    <Transition name="slide-in-right">
        <div v-show="active" class="general-settings-panel">
            <h3>Настройки по-умолчанию</h3>
            <label>Основная тема стикеров:</label>
            <select v-model="localBackgroundColor" @change="updateBackgroundColor">
                <option value="color">Случайный цвет</option>
                <option value="#2B2B2B">Темная</option>
                <option value="snow">Светлая</option>
            </select>
            <label>Размер шрифта:</label>
            <input type="number" v-model="localFontSize" @blur="updateFontSize" min="1">
            <label>Высота:</label>
            <input type="number" v-model="localHeight" @blur="updateHeight" min="50">
            <label>Ширина:</label>
            <input type="number" v-model="localWidth" @blur="updateWidth" min="100">
        </div>
    </Transition>
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

.slide-in-right-enter-active,
.slide-in-right-leave-active
    transition: all 0.3s ease

.slide-in-right-enter-from,
.slide-in-right-leave-to
    opacity: 0
    transform: translateX(100%)

</style>