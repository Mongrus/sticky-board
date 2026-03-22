<script setup>
import { useMainStore } from '@/stores/main.store';
import { ref, watch, onUnmounted } from 'vue';

const props = defineProps({
    active: Boolean
})

const emit = defineEmits(['close'])

const store = useMainStore();
const panelRef = ref(null);

function onDocumentPointerDown(e) {
    if (!props.active || !panelRef.value) return;
    if (panelRef.value.contains(e.target)) return;
    // Иначе клик по кнопке настроек в тулбаре: сначала close, потом toggle — панель снова откроется
    if (e.target.closest('.toolbar')) return;
    emit('close');
}

watch(
    () => props.active,
    (isActive) => {
        if (isActive) {
            requestAnimationFrame(() => {
                document.addEventListener('pointerdown', onDocumentPointerDown);
            });
        } else {
            document.removeEventListener('pointerdown', onDocumentPointerDown);
        }
    }
);

onUnmounted(() => {
    document.removeEventListener('pointerdown', onDocumentPointerDown);
});

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
}

function resetToDefaults() {
    store.resetGeneralSettingsToDefaults();
}
</script>

<template>
    <Transition name="slide-in-right">
        <div ref="panelRef" v-show="active" class="general-settings-panel">
            <h3>Настройки по-умолчанию</h3>
            <div class="setting-item">
                <label>🎨 Основная тема стикеров:</label>
                <select v-model="localBackgroundColor" @change="updateBackgroundColor">
                    <option value="color">Случайный цвет</option>
                    <option value="#2B2B2B">Темная</option>
                    <option value="snow">Светлая</option>
                </select>
            </div>
            <div class="setting-item">
                <label>🔤 Размер шрифта:</label>
                <input type="number" v-model="localFontSize" @blur="updateFontSize" min="1">
            </div>
            <div class="setting-item">
                <label>📏 Высота:</label>
                <input type="number" v-model="localHeight" @blur="updateHeight" min="50">
            </div>
            <div class="setting-item">
                <label>📐 Ширина:</label>
                <input type="number" v-model="localWidth" @blur="updateWidth" min="100">
            </div>
            <button type="button" class="settings-reset-btn" @click="resetToDefaults">
                По умолчанию
            </button>
        </div>
    </Transition>
</template>

<style lang="sass" scoped>

.general-settings-panel
    position: absolute
    display: flex
    flex-direction: column
    padding: 20px
    right: 0
    top: 10vh
    width: 320px
    height: 80%
    background: linear-gradient(135deg, #F5F8FC 0%, #EDF3FA 100%)
    box-shadow: 0 8px 24px rgba(0,0,0,0.15)
    border: 1px solid rgba(0,0,0,0.08)
    border-radius: 20px 0 0 20px
    transition: .3s
    z-index: 9999
    overflow-y: auto
    h3
        margin: 0 0 20px 0
        font-size: 18px
        font-weight: 600
        color: #333
        text-align: center
    .settings-reset-btn
        margin-top: 8px
        padding: 10px 12px
        font-size: 14px
        font-weight: 500
        color: #333
        border: 1px solid #ddd
        border-radius: 8px
        background: white
        cursor: pointer
        transition: all 0.2s ease
        &:hover
            transition: 0.3s
            border-color: #5C9CFF
            background-color: #5C9CFF
            color: white
            box-shadow: 0 2px 8px rgba(92, 156, 255, 0.35)
        &:focus-visible
            outline: none
            border-color: #5C9CFF
            box-shadow: 0 0 0 3px rgba(92, 156, 255, 0.35)
    .setting-item
        display: flex
        flex-direction: column
        gap: 8px
        margin-bottom: 16px
        label
            font-weight: 500
            color: #555
            font-size: 14px
        select, input
            padding: 10px 12px
            border: 1px solid #ddd
            border-radius: 8px
            background: white
            font-size: 14px
            transition: all 0.2s ease
            &:hover
                border-color: #2196F3
                box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1)
            &:focus
                outline: none
                border-color: #2196F3
                box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.2)
    &:hover
        transition: .3s
        background: linear-gradient(135deg, #EDF3FA 0%, #E3F2FD 100%)

.slide-in-right-enter-active,
.slide-in-right-leave-active
    transition: all 0.3s ease

.slide-in-right-enter-from,
.slide-in-right-leave-to
    opacity: 0
    transform: translateX(100%)

</style>