import { defineStore } from 'pinia'
import { ref } from 'vue'
import { STICKER_COLORS } from '@/constants/sticker.constants';

export const useMainStore = defineStore('stickers', () => {
    
    const stage = ref('welcome');
    const stickers = ref([]);
    const nextId = ref(1);
    const settings = ref({
        width: 200,
        height: 120,
        backgroundColor: 'color',
        font: 'Roboto, sans-serif',
        textColor: 'black',
        fontSize: 14
    });

    function getDefaultColor() {

    if (settings.value.backgroundColor === 'color') {
        return STICKER_COLORS[
            Math.floor(Math.random() * STICKER_COLORS.length)
        ].value
    }
        return settings.value.backgroundColor
    }

    function getTextColor(bg) {
        return bg === '#2B2B2B' ? 'white' : '#2B2B2B'
    }

    function createSticker(id, text, folded, x, y, w, h, bc, font, fs, tc, z) {
        nextId.value++;
        stickers.value.push({id, text, folded, x, y, w, h, bc, font, fs, tc, z});
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

    function setFoldedSticker(id) {
        const sticker = stickers.value.find((sticker) => sticker.id === id)

        sticker.folded = !sticker.folded;
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
        stage,
        stickers,
        settings,
        nextId,
        getTextColor,
        getDefaultColor,
        createSticker,
        setPositionSticker,
        setSizeSticker,
        setFoldedSticker,
        bringToFront,
        destroySticker,
        clearBoard
    }

})
