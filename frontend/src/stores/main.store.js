import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMainStore = defineStore('stickers', () => {
    
    const stickers = ref([]);

    function createSticker(id , text, folded, x, y, w, h, bc, fs) {
        stickers.value.push({id, text, folded, x, y, w, h, bc, fs});
    }

    return {
        stickers,
        createSticker
    }

})
