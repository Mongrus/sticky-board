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

    function createSticker(id, text, folded, x, y, w, h, bc, fs) {
        stickers.value.push({id, text, folded, x, y, w, h, bc, fs});
    }

    function setPositionSticker(id, x, y) {
        const sticker = stickers.value.find((sticker) => sticker.id === id)

        sticker.x = x
        sticker.y = y
    }

    return {
        stickers,
        settings,
        createSticker,
        setPositionSticker
    }

})
