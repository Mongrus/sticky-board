<script setup>
import { STICKER } from '../../constants/sticker.constants'
import { useMainStore } from '@/stores/main.store';
import { ref, onMounted, watch } from 'vue';

defineProps({
    activeGeneralSettings: Boolean
})

const emit = defineEmits(['toggleSettings'])

const store = useMainStore();

const toolbarPosition = ref({ x: window.innerWidth - 200, y: 10 });
let isDragging = false;

onMounted(() => {
    const saved = localStorage.getItem('toolbar-position');
    if (saved) {
        toolbarPosition.value = JSON.parse(saved);
    } else {
        toolbarPosition.value.x = (window.innerWidth - 160) / 2;
        toolbarPosition.value.y = 10;
    }
});

watch(toolbarPosition, (newPos) => {
    localStorage.setItem('toolbar-position', JSON.stringify(newPos));
}, { deep: true });

function startDrag(e) {
    if (e.target.tagName === 'BUTTON') return;
    isDragging = true;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    document.body.style.cursor = 'grabbing';

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = toolbarPosition.value.x;
    const initialY = toolbarPosition.value.y;

    let dx = 0;

    const move = (ev) => {
        dx = ev.clientX - startX;
        const newX = Math.max(0, Math.min(window.innerWidth - 160, initialX + dx));
        el.style.transform = `translate(${newX}px, ${toolbarPosition.value.y}px)`;
    };

    const stop = (ev) => {
        isDragging = false;
        document.body.style.cursor = '';
        if (el.hasPointerCapture(ev.pointerId)) {
            el.releasePointerCapture(ev.pointerId);
        }
        toolbarPosition.value.x = Math.max(0, Math.min(window.innerWidth - 160, initialX + dx));
        el.style.transform = `translate(${toolbarPosition.value.x}px, ${toolbarPosition.value.y}px)`;
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', stop);
        window.removeEventListener('pointercancel', stop);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
}
</script>

<template>
    <div class="toolbar" @pointerdown="startDrag" :style="{ left: '0px', top: '0px', transform: `translate(${toolbarPosition.x}px, ${toolbarPosition.y}px)` }">
        <button 
            class="toolbar__btn-create"
            @click="store.createSticker(
            store.nextId, 
            '', // Текст
            false, // Свернут ?
            !store.stickers.length ? 100 : store.stickers.length * 10 + 100, // по X
            !store.stickers.length ? 100 : store.stickers.length * 10 + 100, // по Y
            store.settings.width, // Ширина
            store.settings.height, // Высота
            store.getDefaultColor(), // Цвет фона
            STICKER.DEFAULT_FONT, // Шрифт
            store.settings.fontSize, // Размер шрифта
            store.getTextColor(store.getDefaultColor()), // Цвет текста
            Math.max(...store.stickers.map(s => s.z), 0) // z-index
            )">+</button>
        <button
            class="toolbar__btn-settings"
            :class="{ active: activeGeneralSettings }"
            @click="emit('toggleSettings')"
        >
        ⚙
        </button>
        <div class="toolbar__divider" aria-hidden="true"></div>
        <button class="toolbar__btn-clear" @click="store.confirmClearBoard = true">♻</button>
    </div>
</template>

<style lang="sass" scoped>

.toolbar
    position: absolute
    display: flex
    gap: 4px
    padding: 10px
    border-radius: 12px
    background-color: #F5F8FC
    box-shadow: 0 4px 14px rgba(0,0,0,0.12)
    border: 1px solid rgba(0,0,0,0.06)
    transition: background-color .3s
    z-index: 9999
    cursor: grab
    will-change: transform
    user-select: none
    &:hover
        background-color: #EDF3FA
    &:active
        cursor: grabbing
    button
        padding: 10px
        border-radius: 50%
        border: none
        background: white
        box-shadow: 0 2px 6px rgba(0,0,0,0.08)
        font-weight: 500
        color: #333
        cursor: pointer
        transition: all .15s ease
        font-size: 18px
        width: 40px
        height: 40px
        display: flex
        align-items: center
        justify-content: center
        &:hover
            box-shadow: 0 4px 12px rgba(0,0,0,0.12)
            transform: translateY(-2px) scale(1.05)
        &:active
            transform: translateY(0) scale(0.95)
    &__btn-create
        &:hover
            transition: .3s
            background-color: #5C9CFF
            color: white
    &__divider
        width: 1px
        align-self: stretch
        background: rgba(0, 0, 0, 0.08)
        margin: 4px 0
        border-radius: 1px
    &__btn-clear
        margin-left: 8px
        &:hover
            transition: .3s
            background-color: #E06A6A
            color: white
    &__btn-settings
        position: relative
        border-right: 1px solid rgba(0, 0, 0, 0.1)
        margin-right: 8px
        padding-right: 16px
        &:hover
            transition: .3s
            background-color: #7A8798
            color: white
        &.active
            background-color: #7A8798
            color: white

</style>