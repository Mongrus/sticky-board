<script setup>
import { useMainStore } from '@/stores/main.store';
import { STICKER, STICKER_COLORS, STICKER_FONTS } from '@/constants/sticker.constants';
import { ref, watch, onMounted, onUnmounted } from 'vue';

const store = useMainStore();
const settingsSticker = ref(false);
const stickerRef = ref(null);
const popoverPosition = ref({ top: 0, right: 0 });

const {sticker} = defineProps({
    sticker: Object
})

const localText = ref(sticker.text);
const localFont = ref(sticker.font);
const localFontSize = ref(sticker.fs);

watch(() => sticker.text, (newVal) => {
    localText.value = newVal;
});

watch(() => sticker.font, (newVal) => {
    localFont.value = newVal;
});

watch(() => sticker.fs, (newVal) => {
    localFontSize.value = newVal;
});

function updateText() {
    sticker.text = localText.value;
}

function updateFont() {
    sticker.font = localFont.value;
}

function updateFontSize() {
    sticker.fs = localFontSize.value;
}

function handleClickOutside(e) {
    if (settingsSticker.value && stickerRef.value && !stickerRef.value.contains(e.target)) {
        settingsSticker.value = false;
    }
}

onMounted(() => {
    document.addEventListener('pointerdown', handleClickOutside);
});
onUnmounted(() => {
    document.removeEventListener('pointerdown', handleClickOutside);
});

let resizing = false

function moveSticker(e, id) {

    if (resizing) return

    store.bringToFront(id)

    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)

    document.body.style.cursor = 'grabbing'

    const startX = e.clientX
    const startY = e.clientY

    let dx = 0
    let dy = 0

    const move = (ev) => {

        dx = ev.clientX - startX
        dy = ev.clientY - startY

        el.style.transform = `translate(${dx}px, ${dy}px)`
    }

    const stop = (ev) => {

        document.body.style.cursor = ''

        if (el.hasPointerCapture(ev.pointerId)) {
            el.releasePointerCapture(ev.pointerId)
        }

        store.setPositionSticker(
            id,
            sticker.x + dx,
            sticker.y + dy
        )

        el.style.transform = ''

        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', stop)
        window.removeEventListener('pointercancel', stop)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
}

function resizeSticker(e, id, corner) {

    resizing = true
    store.bringToFront(id)

    const el = e.currentTarget.parentElement
    el.setPointerCapture(e.pointerId)

    const startX = e.clientX
    const startY = e.clientY

    const startW = sticker.w
    const startH = sticker.h
    const startLeft = sticker.x
    const startTop = sticker.y

    let finalW = startW
    let finalH = startH
    let finalX = startLeft
    let finalY = startTop

    let dx = 0
    let dy = 0

    const resize = (ev) => {

        dx = ev.clientX - startX
        dy = ev.clientY - startY

        let w = startW
        let h = startH
        let x = startLeft
        let y = startTop

        if (corner === 'rb') {
            w = startW + dx
            h = startH + dy
        }

        if (corner === 'lb') {
            w = startW - dx
            h = startH + dy
            x = startLeft + dx
        }

        if (corner === 'lt') {
            w = startW - dx
            h = startH - dy
            x = startLeft + dx
            y = startTop + dy
        }

        if (w < STICKER.MIN_WIDTH) {
            w = STICKER.MIN_WIDTH

            if (corner === 'lb' || corner === 'lt') {
                x = startLeft + (startW - STICKER.MIN_WIDTH)
            }
        }

        if (h < STICKER.MIN_HEIGHT) {
            h = STICKER.MIN_HEIGHT

            if (corner === 'lt') {
                y = startTop + (startH - STICKER.MIN_HEIGHT)
            }
        }

        finalW = w
        finalH = h
        finalX = x
        finalY = y

        el.style.transform =
        `translate(${x - startLeft}px, ${y - startTop}px)`

        el.style.width = w + 'px'
        el.style.height = h + 'px'
    }

    const stop = (ev) => {

        resizing = false

        if (el.hasPointerCapture(ev.pointerId)) {
            el.releasePointerCapture(ev.pointerId)
        }

        el.style.transform = ''

        store.setSizeSticker(id, finalW, finalH, finalX, finalY)

        window.removeEventListener('pointermove', resize)
        window.removeEventListener('pointerup', stop)
        window.removeEventListener('pointercancel', stop)
    }

    window.addEventListener('pointermove', resize)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
}

const POPOVER_WIDTH = 312;
const POPOVER_HEIGHT = 270;
const MARGIN = 8;

function changingStickerSettings() {
    if (!settingsSticker.value && stickerRef.value) {
        const rect = stickerRef.value.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let top;
        const hasSpaceAbove = rect.top > POPOVER_HEIGHT + MARGIN;
        if (hasSpaceAbove) {
            top = rect.top - POPOVER_HEIGHT;
        } else {
            top = rect.bottom + MARGIN;
        }
        top = Math.max(MARGIN, Math.min(top, vh - POPOVER_HEIGHT - MARGIN));

        let right = vw - rect.right;
        right = Math.max(MARGIN, Math.min(right, vw - POPOVER_WIDTH - MARGIN));

        popoverPosition.value = { top, right };
    }
    settingsSticker.value = !settingsSticker.value;
}

</script>

<template>
    <div
        ref="stickerRef"
        class="sticker"
        :style="{
            left: sticker.x + 'px',
            top: sticker.y + 'px',
            zIndex: sticker.z,
            width: sticker.w + 'px',
            height: sticker.h + 'px'
        }"
        @pointerdown="moveSticker($event, sticker.id)"
    >
        <textarea
            class="content"
            :style="{
                backgroundColor: sticker.bc,
                fontFamily: sticker.font,
                fontSize: sticker.fs + 'px',
                color: store.getTextColor(sticker.bc)
            }"
            v-model="localText"
            @blur="updateText"
            spellcheck="false"
            autocorrect="off"
            autocomplete="off"
        ></textarea>

        <Teleport to="body">
            <Transition name="popover">
                <div
                    v-show="settingsSticker"
                    class="sticker-settings-popover"
                    :style="{ top: popoverPosition.top + 'px', right: popoverPosition.right + 'px' }"
                    @pointerdown.stop
                >
                <div class="sticker-settings-popover__inner">
                    <label>Цвет фона:</label>
                    <div class="color-palette">
                        <button
                            v-for="color in STICKER_COLORS"
                            :key="color.value"
                            class="color-palette__color"
                            :style="{ backgroundColor: color.value }"
                            :class="{ active: sticker.bc === color.value }"
                            @pointerdown.stop @click="sticker.bc = color.value"
                        ></button>
                        <button
                            class="color-palette__color"
                            :style="{ backgroundColor: '#2B2B2B' }"
                            :class="{ active: sticker.bc === '#2B2B2B' }"
                            @pointerdown.stop @click="sticker.bc = '#2B2B2B'"
                        ></button>
                        <button
                            class="color-palette__color"
                            :style="{ backgroundColor: 'snow' }"
                            :class="{ active: sticker.bc === 'snow' }"
                            @pointerdown.stop @click="sticker.bc = 'snow'"
                        ></button>
                    </div>
                    <label>Шрифт:</label>
                    <select v-model="localFont" @change="updateFont">
                        <option v-for="font in STICKER_FONTS" :value="font.value">{{ font.label }}</option>
                    </select>
                    <label>Размер шрифта:</label>
                    <input type="number" v-model.number="localFontSize" @input="updateFontSize">
                </div>
            </div>
        </Transition>
        </Teleport>
        <div class="resize resize__resize-lt" @pointerdown.stop="resizeSticker($event, sticker.id, 'lt')"></div>
        <div class="resize resize__resize-lb" @pointerdown.stop="resizeSticker($event, sticker.id, 'lb')"></div>
        <div class="resize resize__resize-rb" @pointerdown.stop="resizeSticker($event, sticker.id, 'rb')"></div>
        <div class="sticker__id" :style="{color: store.getTextColor(sticker.bc)}">
            <p>№{{ sticker.id }}</p>
        </div>
        <div class="sticker-menu">
            <button 
            @pointerdown.stop 
            @click="changingStickerSettings()"
            class="sticker-menu__btn-settings"
            :class="{ active: settingsSticker }"
            aria-label="Настройки"
            >&#9881;</button>

            <button
            @pointerdown.stop
            @click="store.setFoldedSticker(sticker.id)"
            class="sticker-menu__btn-collapse"
            aria-label="Свернуть"
            >&#8722;</button>

            <button 
            @pointerdown.stop 
            @click="store.deleteSticker(sticker.id)"
            class="sticker-menu__btn-delete"
            aria-label="Удалить"
            >&#215;</button>
        </div>
    </div>
</template>

<style lang="sass" scoped>

.sticker
    position: absolute
    will-change: transform
    border: 1px unset red
    box-shadow: 0 2px 4px rgba(0,0,0,0.08), 0 6px 12px rgba(0,0,0,0.08)
    transform: translateZ(0)
    touch-action: none
    user-select: none
    min-width: 100px
    min-height: 50px
    &:hover .sticker__id
        opacity: .1
        transition: .3s
    &__id
        position: absolute
        right: 0
        bottom: 0
        font-size: 25px
        padding: 3px
        opacity: .08
        transition: .3s
        pointer-events: none
        opacity: 0
    
.content
    width: 100%
    height: 100%
    padding: 15px
    touch-action: none
    color: black
    cursor: grab
    resize: none
    border: none
    box-sizing: border-box
    &:active
        cursor: grabbing
    &::-webkit-scrollbar
        width: 5px
    &::-webkit-scrollbar-thumb
        background: rgba(0,0,0,0.25)
        border-radius: 10px
    &::-webkit-scrollbar-track
        background: transparent

.sticker-menu
    position: absolute
    display: flex
    flex-direction: row
    justify-content: center
    align-items: center
    top: -22px
    right: 0
    button
        display: flex
        align-items: center
        justify-content: center
        background-color: #f5f5f5
        border: none
        padding: 0
        border-radius: 100%
        font-size: 12px
        width: 18px
        height: 18px
        transition: .3s
    button:active
        transform: scale(.9)
    &__btn-settings
        color: #7A8798
        &:hover
            color: white
            background-color: #7A8798
        &.active
            color: white
            background-color: #7A8798
    &__btn-collapse
        color: #5C9CFF
        &:hover
            color: white
            background-color: #5C9CFF
    &__btn-delete
        color: #E06A6A
        &:hover
            color: white
            background-color: #E06A6A


.resize
    position: absolute
    width: 22px
    height: 22px
    background: transparent
    border: none
    opacity: 0
    cursor: nwse-resize
    &__resize-lt
        left: -4px
        top: -4px
    &__resize-rb
        right: -4px
        bottom: -4px
    &__resize-lb
        left: -4px
        bottom: -4px
        cursor: nesw-resize

.sticker-settings-popover
    position: fixed
    z-index: 10002
    width: 312px
    max-height: 270px

.sticker-settings-popover__inner
    display: flex
    flex-direction: column
    gap: 8px
    padding: 16px
    background: #F5F8FC
    border-radius: 12px
    box-shadow: 0 8px 24px rgba(0,0,0,0.15)
    border: 1px solid rgba(0,0,0,0.06)
    overflow-y: auto
    max-height: 270px
    label
        font-size: 12px
        font-weight: 500
        color: #555
    select, input
        padding: 8px 10px
        border: 1px solid #ddd
        border-radius: 8px
        font-size: 14px

.popover-enter-active,
.popover-leave-active
    transition: opacity 0.15s ease, transform 0.15s ease

.popover-enter-from,
.popover-leave-to
    opacity: 0
    transform: translateY(4px)

.color-palette
    display: flex
    flex-wrap: wrap
    gap: 6px
    width: 280px
    &__color
        width: 20px
        height: 20px
        border-radius: 50%
        border: .3px solid black
        cursor: pointer
        transition: transform .15s ease
        &:hover
            transform: scale(1.15)
        &.active
            border: 3px solid #5C9CFF
</style>