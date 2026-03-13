import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMainStore = defineStore('stickers', () => {
    
    const stickers = ref([]);
    const settings = ref({
        width: 300,
        height: 140,
        backgroundColor: 'black',
        fontSize: 14
    });

    function createSticker(id, text, folded, x, y, w, h, bc, fs, z) {
        stickers.value.push({id, text, folded, x, y, w, h, bc, fs, z});
    }

    function setPositionSticker(id, x, y) {
        const sticker = stickers.value.find((sticker) => sticker.id === id)

        sticker.x = x
        sticker.y = y
    }

    function setSizeSticker(id, deltaX, deltaY, corner) {
        const sticker = stickers.value.find(s => s.id === id)

        if (corner === 'rb') {
            sticker.w += deltaX
            sticker.h += deltaY
        }

        if (corner === 'lb') {
            sticker.w -= deltaX
            sticker.h += deltaY
            sticker.x += deltaX
        }

        if (corner === 'lt') {
            sticker.w -= deltaX
            sticker.h -= deltaY
            sticker.x += deltaX
            sticker.y += deltaY
        }
    }

    function bringToFront(id) {

    const sticker = stickers.value.find(s => s.id === id)

    const maxZ = Math.max(...stickers.value.map(s => s.z), 0)

    sticker.z = maxZ + 1
    }

    return {
        stickers,
        settings,
        createSticker,
        setPositionSticker,
        setSizeSticker,
        bringToFront
    }

})
