<script setup>
import { useMainStore } from '@/stores/main.store'
import { useAuthStore } from '@/stores/auth.store'
import { useSyncStore } from '@/stores/sync.store'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { performLogout } from '@/services/authSession'

defineProps({
    activeGeneralSettings: Boolean
})

const emit = defineEmits(['toggleSettings'])

const store = useMainStore()
const authStore = useAuthStore()
const syncStore = useSyncStore()

const syncLabel = computed(() => {
    switch (syncStore.syncStatus) {
        case 'offline':
            return 'Офлайн'
        case 'syncing':
            return 'Синхронизация…'
        case 'error':
            return 'Ошибка синхронизации'
        default:
            return authStore.isAuthenticated ? 'Синхронизировано' : 'Локально'
    }
})

const shortEmail = computed(() => {
    const e = authStore.user?.email || ''
    if (e.length <= 22) return e
    return `${e.slice(0, 10)}…${e.slice(-8)}`
})

async function onLogout() {
    await performLogout()
}

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
            const link = initialTarget.closest('a');
            if (btn) btn.click();
            else if (link) link.click();
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
        <div class="toolbar__account" @pointerdown.stop>
            <span
                class="toolbar__sync-badge"
                :class="{
                    'toolbar__sync-badge--offline': syncStore.syncStatus === 'offline',
                    'toolbar__sync-badge--syncing': syncStore.syncStatus === 'syncing',
                    'toolbar__sync-badge--error': syncStore.syncStatus === 'error'
                }"
                :title="syncLabel"
            >{{ syncLabel }}</span>
            <template v-if="authStore.isGuest">
                <RouterLink
                    class="toolbar__account-icon"
                    to="/login"
                    aria-label="Войти"
                    title="Войти"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0110.5 3h6a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0116.5 21h-6a2.25 2.25 0 01-2.25-2.25V15m-3 0l-3-3m0 0l3-3m-3 3h12.75" />
                    </svg>
                </RouterLink>
            </template>
            <template v-else>
                <span class="toolbar__email" :title="authStore.user?.email">{{ shortEmail }}</span>
                <button
                    type="button"
                    class="toolbar__btn-logout"
                    aria-label="Выйти"
                    title="Выйти"
                    @click="onLogout"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                </button>
            </template>
        </div>
        <div class="toolbar__divider toolbar__divider--wide" aria-hidden="true"></div>
        <button 
            class="toolbar__btn-create"
            @click="store.createSticker(
            store.nextId,
            '',
            false,
            !store.stickers.length ? 100 : store.stickers.length * 10 + 100,
            !store.stickers.length ? 100 : store.stickers.length * 10 + 100,
            store.settings.width,
            store.settings.height,
            store.getDefaultColor(),
            store.settings.font,
            store.settings.fontSize,
            store.getTextColor(store.getDefaultColor()),
            Math.max(...store.stickers.map(s => s.z), 0)
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

.toolbar__account
    display: flex
    align-items: center
    gap: 8px
    flex-wrap: nowrap
    min-width: 0
    padding-right: 4px
    margin-right: 4px

.toolbar__sync-badge
    flex-shrink: 0
    font-size: 11px
    font-weight: 600
    padding: 4px 8px
    border-radius: 8px
    background: #e8f4e8
    color: #2e6b2e
    white-space: nowrap
    &--offline
        background: #f0f0f0
        color: #555
    &--syncing
        background: #e3eefc
        color: #1a4d8f
    &--error
        background: #fde8e8
        color: #a32020

.toolbar__account-icon
    flex-shrink: 0
    width: 40px
    height: 40px
    border-radius: 50%
    display: flex
    align-items: center
    justify-content: center
    background: white
    box-shadow: 0 2px 6px rgba(0,0,0,0.08)
    color: #5C9CFF
    text-decoration: none
    transition: all .15s ease
    svg
        width: 18px
        height: 18px
    &:hover
        box-shadow: 0 4px 12px rgba(0,0,0,0.12)
        transform: translateY(-2px) scale(1.05)
        background-color: #5C9CFF
        color: white
    &:active
        transform: translateY(0) scale(0.95)

.toolbar__email
    min-width: 0
    flex-shrink: 1
    font-size: 12px
    color: #444
    max-width: 120px
    overflow: hidden
    text-overflow: ellipsis
    white-space: nowrap

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
        &--wide
            margin: 4px 6px 4px 2px
    &__btn-clear
        margin-left: 8px
        &:hover
            transition: .3s
            background-color: #E06A6A
            color: white
    &__btn-logout
        flex-shrink: 0
        color: #a32020
        svg
            width: 18px
            height: 18px
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