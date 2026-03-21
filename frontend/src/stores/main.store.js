import { defineStore } from 'pinia'
import { ref } from 'vue'
import { STICKER, STICKER_COLORS } from '@/constants/sticker.constants';
import { COOKIE_CONSENT_KEY } from '@/constants/app.constants';
import { generateStickerToken, stickerNowIso } from '@/utils/stickerIdentity'
import { STICKERS_STORE_GUEST_KEY } from '@/constants/storage.constants'
import { mergeGuestBoardLww } from '@/utils/mergeGuestBoardLww'
import { useAuthStore } from '@/stores/auth.store'
import { clearOutbox } from '@/services/stickersOutbox'
import {
  scheduleStickerRemotePatch,
  pushNewStickerToServer,
  deleteStickerOnServer
} from '@/services/stickersRemoteSync';

const DEFAULT_SETTINGS = {
    width: 200,
    height: 120,
    backgroundColor: 'color',
    font: 'Andika, sans-serif',
    textColor: 'black',
    fontSize: 14
}

export const useMainStore = defineStore('stickers', () => {
    
    const stickers = ref([]);
    const nextId = ref(1);
    const cookiesConfirmed = ref(
        typeof window !== 'undefined' && localStorage.getItem(COOKIE_CONSENT_KEY) === 'true'
    );
    const deletedStickers = ref([]);
    const confirmClearBoard = ref(false);
    const settings = ref({ ...DEFAULT_SETTINGS });

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
        const now = stickerNowIso()
        stickers.value.push({
            id,
            token: generateStickerToken(),
            updated_at: now,
            text,
            folded,
            x,
            y,
            w,
            h,
            bc,
            font,
            fs,
            tc,
            z
        });
        const created = stickers.value[stickers.value.length - 1]
        void pushNewStickerToServer(created)
    }

    function bumpStickerUpdatedAt(id) {
        const sticker = stickers.value.find((s) => s.id === id)
        if (!sticker) return
        sticker.updated_at = stickerNowIso()
        scheduleStickerRemotePatch(sticker.token)
    }

    function bumpLayoutTimestampIfSynced(id) {
        if (!STICKER.SYNC_INCLUDE_LAYOUT) return
        const sticker = stickers.value.find((s) => s.id === id)
        if (!sticker) return
        sticker.updated_at = stickerNowIso()
        scheduleStickerRemotePatch(sticker.token)
    }

    function setPositionSticker(id, x, y) {
        const sticker = stickers.value.find((sticker) => sticker.id === id)

        sticker.x = x
        sticker.y = y
        bumpLayoutTimestampIfSynced(id)
    }

    function setSizeSticker(id, w, h, x, y) {

    const sticker = stickers.value.find(s => s.id === id)

    sticker.w = w
    sticker.h = h
    sticker.x = x
    sticker.y = y
    bumpLayoutTimestampIfSynced(id)
    }

    function setFoldedSticker(id) {
        const sticker = stickers.value.find((sticker) => sticker.id === id)

        sticker.folded = !sticker.folded;
        bumpStickerUpdatedAt(id)
    }

    function bringToFront(id) {

    const sticker = stickers.value.find(s => s.id === id)

    const maxZ = Math.max(...stickers.value.map(s => s.z), 0)

    sticker.z = maxZ + 1
    bumpLayoutTimestampIfSynced(id)
    }

    function deleteSticker(id) {
        const sticker = stickers.value.find(s => s.id === id)
        if (!sticker) return
        void deleteStickerOnServer(sticker.token)
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
        void pushNewStickerToServer(item.sticker)
    }

    function confirmCookies() {
        cookiesConfirmed.value = true
        if (typeof window !== 'undefined') {
            localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
        }
    }

    function clearBoard() {
        const auth = useAuthStore()
        if (auth.isAuthenticated) {
            clearOutbox(auth)
            for (const s of [...stickers.value]) {
                if (s.token) void deleteStickerOnServer(s.token)
            }
        }
        nextId.value = 1
        stickers.value = []
        deletedStickers.value = []
        confirmClearBoard.value = false
    }

    function hydrateFromLocalStorageKey(storageKey) {
        if (typeof window === 'undefined') return
        const fromCookieKey = localStorage.getItem(COOKIE_CONSENT_KEY) === 'true'
        const saved = localStorage.getItem(storageKey)

        if (saved) {
            try {
                const data = JSON.parse(saved)
                stickers.value = data.stickers || []
                nextId.value = data.nextId || 1
                settings.value = { ...DEFAULT_SETTINGS, ...(data.settings || {}) }
                if (data.cookiesConfirmed) {
                    cookiesConfirmed.value = true
                    if (!fromCookieKey) localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
                }
            } catch {
                stickers.value = []
                nextId.value = 1
                settings.value = { ...DEFAULT_SETTINGS }
            }
        } else {
            stickers.value = []
            nextId.value = 1
            settings.value = { ...DEFAULT_SETTINGS }
        }
        if (fromCookieKey) cookiesConfirmed.value = true

        ensurePersistedStickersIdentity()
    }

    function mergeGuestBoardLwwIntoUserStore() {
        if (typeof window === 'undefined') return false

        const raw = localStorage.getItem(STICKERS_STORE_GUEST_KEY)
        if (!raw) return false

        let data
        try {
            data = JSON.parse(raw)
        } catch {
            return false
        }

        const guestStickers = data.stickers
        const merged = mergeGuestBoardLww(stickers.value, guestStickers)
        if (!merged) return false

        stickers.value = merged.stickers
        nextId.value = merged.nextId

        ensurePersistedStickersIdentity()
        return true
    }

    function ensurePersistedStickersIdentity() {
        const list = stickers.value
        if (!list.length) return
        const now = stickerNowIso()
        for (const s of list) {
            if (!s.token) {
                s.token = generateStickerToken()
            }
            if (s.updated_at == null || s.updated_at === '') {
                s.updated_at = now
            }
        }
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
        confirmCookies,
        clearBoard,
        hydrateFromLocalStorageKey,
        mergeGuestBoardLwwIntoUserStore,
        bumpStickerUpdatedAt
    }

})
