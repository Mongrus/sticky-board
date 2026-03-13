<script setup>
import { useMainStore } from '@/stores/main.store';

const store = useMainStore();

const {sticker} = defineProps({
    sticker: Object
})

let resizing = false

function moveSticker(e, id) {

    if (resizing) return

    store.bringToFront(id)

    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)

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

        el.style.width = w + 'px'
        el.style.height = h + 'px'
        el.style.left = x + 'px'
        el.style.top = y + 'px'
    }

    const stop = (ev) => {

        resizing = false

        if (el.hasPointerCapture(ev.pointerId)) {
            el.releasePointerCapture(ev.pointerId)
        }

        store.setSizeSticker(id, dx, dy, corner)

        window.removeEventListener('pointermove', resize)
        window.removeEventListener('pointerup', stop)
        window.removeEventListener('pointercancel', stop)
    }

    window.addEventListener('pointermove', resize)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
}

</script>

<template>
        <div
        class="sticker"
        :style="{
            width: sticker.w + 'px',
            height: sticker.h + 'px',
            left: sticker.x + 'px',
            top: sticker.y + 'px',
            zIndex: sticker.z
        }"
        @pointerdown="moveSticker($event, sticker.id)"
        >
            <textarea
            class="content"
            :style="{
                backgroundColor: sticker.bc,
                fontSize: sticker.fs + 'px'
            }"
            >{{ sticker.text }}</textarea>
        <div class="resize resize__resize-lt"@pointerdown.stop="resizeSticker($event, sticker.id, 'lt')"></div>
        <div class="resize resize__resize-lb"@pointerdown.stop="resizeSticker($event, sticker.id, 'lb')"></div>
        <div class="resize resize__resize-rb"@pointerdown.stop="resizeSticker($event, sticker.id, 'rb')"></div>
        <div class="sticker-menu">
            <button @click="">⚙︎</button>
            <button @click="">-</button>
            <button @click="">X</button>
        </div>
    </div>
</template>

<style lang="sass" scoped>

.sticker
    position: absolute
    will-change: transform
    transform: translateZ(0)
    touch-action: none
    user-select: none
    
.content
    width: 100%
    height: 100%
    padding: 10px
    touch-action: none
    color: white
    cursor: grab
    resize: none
    border: none
    box-sizing: border-box
    &:active
        cursor: grabbing

.sticker-menu
    position: absolute
    top: -22px
    right: 0

.resize
    position: absolute
    width: 14px
    height: 14px
    border: 1px solid black
    background-color: white
    opacity: 0.5
    &:hover
        opacity: 1
        cursor: pointer
    &__resize-lt
        left: -2px
        top: -2px
        cursor: nwse-resize
    &__resize-rb
        right: -2px
        bottom: -2px
        cursor: nwse-resize
    &__resize-lb
        left: -2px
        bottom: -2px
        cursor: nwse-resize

</style>