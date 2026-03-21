import { defineStore } from 'pinia'
import { ref } from 'vue'
import { STICKER_COLORS } from '@/constants/sticker.constants';
import { COOKIE_CONSENT_KEY } from '@/constants/app.constants';

export const useMainStore = defineStore('stickers', () => {
    
    const stickers = ref([]);
    const nextId = ref(1);
    const cookiesConfirmed = ref(
        typeof window !== 'undefined' && localStorage.getItem(COOKIE_CONSENT_KEY) === 'true'
    );
    const deletedStickers = ref([]);
    const confirmClearBoard = ref(false);
    const settings = ref({
        width: 200,
        height: 120,
        backgroundColor: 'color',
        font: 'Andika, sans-serif',
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

    function deleteSticker(id) {
        const sticker = stickers.value.find(s => s.id === id)
        if (!sticker) return
        const stickerCopy = { ...sticker }
        stickers.value = stickers.value.filter(s => s.id !== id)
        const timerId = setTimeout(() => {
            deletedStickers.value = deletedStickers.value.filter(item => item.sticker.id !== id)
        }, 7000)
        deletedStickers.value.push({ sticker: stickerCopy, timerId })
    }

    function restoreSticker(id) {
        const item = deletedStickers.value.find(i => i.sticker.id === id)
        if (!item) return
        clearTimeout(item.timerId)
        stickers.value.push(item.sticker)
        deletedStickers.value = deletedStickers.value.filter(i => i.sticker.id !== id)
    }

    function destroySticker(id) {
        stickers.value = stickers.value.filter(s => s.id !== id)
    }

    function confirmCookies() {
        cookiesConfirmed.value = true
        if (typeof window !== 'undefined') {
            localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
        }
    }

    function clearBoard() {
        nextId.value = 1;
        stickers.value = [];
        confirmClearBoard.value = false
    }

    if (typeof window !== 'undefined') {
    const fromCookieKey = localStorage.getItem(COOKIE_CONSENT_KEY) === 'true'
    const saved = localStorage.getItem('stickers-store')

    if (saved) {
        const data = JSON.parse(saved)
        stickers.value = data.stickers || []
        nextId.value = data.nextId || 1
        settings.value = data.settings || settings.value
        if (data.cookiesConfirmed) {
            cookiesConfirmed.value = true
            if (!fromCookieKey) localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
        }
    }
    if (fromCookieKey) cookiesConfirmed.value = true
    }

    return {
        stickers,
        settings,
        nextId,
        cookiesConfirmed,
        deletedStickers,
        confirmClearBoard,
        getTextColor,
        getDefaultColor,
        createSticker,
        setPositionSticker,
        setSizeSticker,
        setFoldedSticker,
        bringToFront,
        deleteSticker,
        restoreSticker,
        destroySticker,
        confirmCookies,
        clearBoard
    }

})
