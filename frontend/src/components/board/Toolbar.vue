<script setup>
import { useMainStore } from '@/stores/main.store'
import { useAuthStore } from '@/stores/auth.store'
import { useSyncStore } from '@/stores/sync.store'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { performLogout } from '@/services/authSession'
import { BOARD_MOBILE_LAYOUT_MAX_WIDTH_PX } from '@/constants/board.constants'

defineProps({
    activeGeneralSettings: Boolean
})

const emit = defineEmits(['toggleSettings'])

const store = useMainStore()
const authStore = useAuthStore()
const syncStore = useSyncStore()

function toolbarCompactMql() {
    return typeof window !== 'undefined'
        ? window.matchMedia(`(max-width: ${BOARD_MOBILE_LAYOUT_MAX_WIDTH_PX}px)`)
        : null
}

const compactSyncUi = ref(
    typeof window !== 'undefined' ? toolbarCompactMql()?.matches === true : false
)

function syncCompactUiFlag() {
    const mql = toolbarCompactMql()
    compactSyncUi.value = mql ? mql.matches : false
}

let compactMqlListener = null

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

/** Узкий экран — яркая лампа статуса (синхронизация = акцент приложения #5C9CFF). */
const syncLampClass = computed(() => {
    switch (syncStore.syncStatus) {
        case 'error':
            return 'toolbar__sync-lamp--error'
        case 'offline':
            return 'toolbar__sync-lamp--offline'
        case 'syncing':
            return 'toolbar__sync-lamp--syncing toolbar__sync-lamp--pulse'
        default:
            return 'toolbar__sync-lamp--ok'
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

const STORAGE_TOOLBAR_WIDE = 'toolbar-position-wide'
const STORAGE_TOOLBAR_COMPACT = 'toolbar-position-compact'
const STORAGE_TOOLBAR_LEGACY = 'toolbar-position'

const EDGE_MARGIN = 4

const toolbarRef = ref(null)

function getToolbarWidth() {
    return toolbarRef.value?.offsetWidth ?? 180
}

function clampPosition(pos) {
    const width = getToolbarWidth()
    const maxX = Math.max(0, window.innerWidth - width - EDGE_MARGIN)
    return {
        x: Math.max(EDGE_MARGIN, Math.min(maxX, pos.x)),
        y: pos.y
    }
}

function defaultCenteredToolbarX() {
    if (typeof window === 'undefined') return EDGE_MARGIN
    const guessW = 280
    return Math.max(EDGE_MARGIN, (window.innerWidth - guessW) / 2)
}

function initialToolbarPosition() {
    if (typeof window === 'undefined') return { x: 0, y: 10 }
    if (toolbarCompactMql()?.matches) {
        return { x: defaultCenteredToolbarX(), y: 10 }
    }
    return { x: Math.max(EDGE_MARGIN, window.innerWidth - 200), y: 10 }
}

const toolbarPosition = ref(initialToolbarPosition())

function toolbarStorageKey() {
    return compactSyncUi.value ? STORAGE_TOOLBAR_COMPACT : STORAGE_TOOLBAR_WIDE
}

function applyToolbarPositionFromStorage() {
    const key = toolbarStorageKey()
    let raw = localStorage.getItem(key)
    if (!raw && !compactSyncUi.value) {
        raw = localStorage.getItem(STORAGE_TOOLBAR_LEGACY)
        if (raw && !localStorage.getItem(STORAGE_TOOLBAR_WIDE)) {
            try {
                localStorage.setItem(STORAGE_TOOLBAR_WIDE, raw)
            } catch {
                /* ignore quota */
            }
        }
    }
    const run = () => {
        const width = getToolbarWidth()
        if (raw) {
            try {
                const parsed = JSON.parse(raw)
                if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
                    toolbarPosition.value = clampPosition(parsed)
                    return
                }
            } catch {
                /* ignore */
            }
        }
        toolbarPosition.value = {
            x: Math.max(EDGE_MARGIN, (window.innerWidth - width) / 2),
            y: 10
        }
    }
    requestAnimationFrame(() => requestAnimationFrame(run))
}

function handleResize() {
    toolbarPosition.value = clampPosition(toolbarPosition.value)
}

onMounted(() => {
    syncCompactUiFlag()
    compactMqlListener = toolbarCompactMql()
    compactMqlListener?.addEventListener('change', syncCompactUiFlag)

    applyToolbarPositionFromStorage()
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    compactMqlListener?.removeEventListener('change', syncCompactUiFlag)
    window.removeEventListener('resize', handleResize)
})

watch(compactSyncUi, () => {
    applyToolbarPositionFromStorage()
})

watch(toolbarPosition, (newPos) => {
    const clamped = clampPosition(newPos)
    try {
        localStorage.setItem(toolbarStorageKey(), JSON.stringify(clamped))
    } catch {
        /* ignore quota */
    }
}, { deep: true })

const DRAG_THRESHOLD = 10;

function startDrag(e) {
    const el = e.currentTarget;
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
    <div ref="toolbarRef" class="toolbar" :class="{ 'toolbar--compact': compactSyncUi }" @pointerdown="startDrag" :style="{ left: '0px', top: '0px', transform: `translate(${toolbarPosition.x}px, ${toolbarPosition.y}px)` }">
        <div class="toolbar__account" @pointerdown.stop>
            <span
                v-if="compactSyncUi"
                class="toolbar__sync-lamp"
                :class="syncLampClass"
                role="status"
                :aria-label="syncLabel"
                :title="syncLabel"
            />
            <span
                v-else
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
            @pointerdown.stop
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
            @pointerdown.stop
            @click="emit('toggleSettings')"
            aria-label="Настройки"
        >&#9881;</button>
        <div class="toolbar__divider" aria-hidden="true"></div>
        <button class="toolbar__btn-clear" @pointerdown.stop @click="store.confirmClearBoard = true" aria-label="Очистить доску">&#8855;</button>
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

.toolbar__sync-lamp
    flex-shrink: 0
    position: relative
    z-index: 1
    width: 14px
    height: 14px
    border-radius: 50%
    border: 1px solid rgba(255, 255, 255, 0.4)
    // «Тление»: внешнее свечение (box-shadow) — не для офлайна
    &--ok
        background: linear-gradient(160deg, #2ee59d 0%, #0eb87a 100%)
        animation: toolbar-sync-lamp-breathe 3.2s ease-in-out infinite, toolbar-sync-lamp-ember-ok 2.5s ease-in-out infinite
    &--offline
        background: linear-gradient(160deg, #ffc53d 0%, #f59e0b 100%)
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18)
        animation: none
    &--syncing
        background: linear-gradient(160deg, #7eb6ff 0%, #5c9cff 100%)
    &--syncing.toolbar__sync-lamp--pulse
        animation: toolbar-sync-lamp-syncing 1.25s ease-in-out infinite, toolbar-sync-lamp-ember-syncing 1.65s ease-in-out infinite
    &--error
        background: linear-gradient(160deg, #ff6b86 0%, #e91e4d 100%)
        animation: toolbar-sync-lamp-breathe 3.2s ease-in-out infinite, toolbar-sync-lamp-ember-error 2.35s ease-in-out infinite

// Мягкое ореол-свечение вокруг лампы (только не офлайн)
.toolbar__sync-lamp:not(.toolbar__sync-lamp--offline)::before
    content: ''
    position: absolute
    inset: -7px
    border-radius: 50%
    z-index: -1
    pointer-events: none
    background: radial-gradient(circle, rgba(255, 255, 255, 0.14) 0%, transparent 65%)
    animation: toolbar-sync-lamp-halo 3s ease-in-out infinite

@keyframes toolbar-sync-lamp-breathe
    0%, 100%
        opacity: 1
        transform: scale(1)
    50%
        opacity: 0.9
        transform: scale(0.97)

@keyframes toolbar-sync-lamp-syncing
    0%, 100%
        opacity: 1
        transform: scale(1)
    50%
        opacity: 0.78
        transform: scale(0.94)

@keyframes toolbar-sync-lamp-halo
    0%, 100%
        opacity: 0.55
        transform: scale(1)
    50%
        opacity: 0.9
        transform: scale(1.08)

@keyframes toolbar-sync-lamp-ember-ok
    0%, 100%
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 0 10px 2px rgba(46, 230, 157, 0.55), 0 0 24px 6px rgba(14, 184, 122, 0.3), 0 0 2px 1px rgba(255, 248, 220, 0.5) inset
    35%
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 0 16px 4px rgba(255, 230, 150, 0.5), 0 0 28px 8px rgba(46, 230, 157, 0.42), 0 0 3px 1px rgba(255, 255, 255, 0.45) inset
    65%
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 0 8px 2px rgba(180, 255, 210, 0.45), 0 0 20px 5px rgba(14, 184, 122, 0.35), 0 0 2px 1px rgba(255, 220, 120, 0.4) inset

@keyframes toolbar-sync-lamp-ember-syncing
    0%, 100%
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 0 12px 3px rgba(126, 182, 255, 0.65), 0 0 26px 7px rgba(92, 156, 255, 0.38), 0 0 2px 1px rgba(220, 240, 255, 0.55) inset
    40%
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 0 18px 5px rgba(200, 230, 255, 0.55), 0 0 32px 9px rgba(92, 156, 255, 0.48), 0 0 3px 2px rgba(255, 255, 255, 0.5) inset
    70%
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 0 9px 2px rgba(150, 200, 255, 0.5), 0 0 22px 6px rgba(60, 140, 255, 0.32), 0 0 2px 1px rgba(180, 220, 255, 0.45) inset

@keyframes toolbar-sync-lamp-ember-error
    0%, 100%
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 0 11px 3px rgba(255, 107, 134, 0.58), 0 0 24px 6px rgba(233, 30, 77, 0.32), 0 0 2px 1px rgba(255, 220, 200, 0.45) inset
    30%
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 0 16px 4px rgba(255, 180, 100, 0.42), 0 0 30px 8px rgba(255, 80, 100, 0.4), 0 0 3px 1px rgba(255, 240, 220, 0.55) inset
    60%
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 0 9px 2px rgba(255, 150, 160, 0.55), 0 0 22px 5px rgba(233, 30, 77, 0.38), 0 0 2px 1px rgba(255, 200, 180, 0.4) inset

@media (prefers-reduced-motion: reduce)
    .toolbar__sync-lamp
        animation: none !important
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18) !important
    .toolbar__sync-lamp::before
        animation: none !important
        opacity: 0.5

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
    &--compact
        gap: 3px
        padding: 8px
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