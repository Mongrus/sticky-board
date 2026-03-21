<script setup>
import { useMainStore } from '@/stores/main.store';
import { ref, onMounted, onUnmounted, watch } from 'vue';

defineProps({
    activeGeneralSettings: Boolean
})

const emit = defineEmits(['toggleSettings'])

const store = useMainStore();

const toolbarPosition = ref({ x: window.innerWidth - 200, y: 10 });
const toolbarRef = ref(null);

function getToolbarWidth() {
    return toolbarRef.value?.offsetWidth ?? 180;
}

const EDGE_MARGIN = 4;

function clampPosition(pos) {
    const width = getToolbarWidth();
    const maxX = Math.max(0, window.innerWidth - width - EDGE_MARGIN);
    return {
        x: Math.max(EDGE_MARGIN, Math.min(maxX, pos.x)),
        y: pos.y
    };
}

function handleResize() {
    toolbarPosition.value = clampPosition(toolbarPosition.value);
}

onMounted(() => {
    const saved = localStorage.getItem('toolbar-position');
    const applyPosition = () => {
        if (saved) {
            toolbarPosition.value = clampPosition(JSON.parse(saved));
        } else {
            const width = getToolbarWidth();
            toolbarPosition.value = { x: Math.max(0, (window.innerWidth - width) / 2), y: 10 };
        }
    };
    requestAnimationFrame(applyPosition);
    window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
});

watch(toolbarPosition, (newPos) => {
    const clamped = clampPosition(newPos);
    localStorage.setItem('toolbar-position', JSON.stringify(clamped));
}, { deep: true });

const DRAG_THRESHOLD = 10;

function startDrag(e) {
    const el = e.currentTarget;
    const initialTarget = e.target;
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = toolbarPosition.value.x;
    let dx = 0;
    let moved = false;

    el.setPointerCapture(e.pointerId);
    if (typeof document.body.style.cursor !== 'undefined') {
        document.body.style.cursor = 'grabbing';
    }

    const move = (ev) => {
        dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
            moved = true;
        }
        const maxX = Math.max(0, window.innerWidth - getToolbarWidth() - EDGE_MARGIN);
        const newX = Math.max(EDGE_MARGIN, Math.min(maxX, initialX + dx));
        el.style.transform = `translate(${newX}px, ${toolbarPosition.value.y}px)`;
    };

    const stop = (ev) => {
        if (el.hasPointerCapture(ev.pointerId)) {
            el.releasePointerCapture(ev.pointerId);
        }
        if (typeof document.body.style.cursor !== 'undefined') {
            document.body.style.cursor = '';
        }
        if (moved) {
            toolbarPosition.value = clampPosition({ ...toolbarPosition.value, x: initialX + dx });
        } else {
            const btn = initialTarget.closest('button');
            if (btn) btn.click();
        }
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
    <div ref="toolbarRef" class="toolbar" @pointerdown="startDrag" :style="{ left: '0px', top: '0px', transform: `translate(${toolbarPosition.x}px, ${toolbarPosition.y}px)` }">
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
            store.settings.font, // Шрифт
            store.settings.fontSize, // Размер шрифта
            store.getTextColor(store.getDefaultColor()), // Цвет текста
            Math.max(...store.stickers.map(s => s.z), 0) // z-index
            )">+</button>
        <button
            class="toolbar__btn-settings"
            :class="{ active: activeGeneralSettings }"
            @click="emit('toggleSettings')"
            aria-label="Настройки"
        >&#9881;</button>
        <div class="toolbar__divider" aria-hidden="true"></div>
        <button class="toolbar__btn-clear" @click="store.confirmClearBoard = true" aria-label="Очистить доску">&#8855;</button>
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
    touch-action: none
    &:hover
        background-color: #EDF3FA
    &:active
        cursor: grabbing
    button
        padding: 0
        border-radius: 50%
        border: none
        background: white
        box-shadow: 0 2px 6px rgba(0,0,0,0.08)
        font-weight: 500
        color: #333
        cursor: pointer
        transition: all .15s ease
        font-size: 21px
        line-height: 1
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