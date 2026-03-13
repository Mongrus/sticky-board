import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMainStore = defineStore('stickers', () => {
    
    const stickers = ref([]);
    const nextId = ref(1);
    const settings = ref({
        width: 300,
        height: 180,
        backgroundColor: 'black',
        fontSize: 14
    });

    function createSticker(id, text, folded, x, y, w, h, bc, fs, z) {
        nextId.value++;
        stickers.value.push({id, text, folded, x, y, w, h, bc, fs, z});
    }

    function setPositionSticker(id, x, y) {
        const sticker = stickers.value.find((sticker) => sticker.id === id)

        sticker.x = x
        sticker.y = y
    }

    function setSizeSticker(id, w, h, x, y) {

    const sticker = stickers.value.find(s => s.id === id)

    sticker.w = w
    sticker.h = h
    sticker.x = x
    sticker.y = y
    }

    function bringToFront(id) {

    const sticker = stickers.value.find(s => s.id === id)

    const maxZ = Math.max(...stickers.value.map(s => s.z), 0)

    sticker.z = maxZ + 1
    }

    function destroySticker(id) {
        stickers.value = stickers.value.filter(s => s.id !== id)
    }

    function clearBoard() {
        nextId.value = 1;
        stickers.value = [];
    }

    return {
        stickers,
        settings,
        nextId,
        createSticker,
        setPositionSticker,
        setSizeSticker,
        bringToFront,
        destroySticker,
        clearBoard
    }

})
