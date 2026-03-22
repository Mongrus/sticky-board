<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useMainStore } from '../stores/main.store';
import Sticker from '../components/board/Sticker.vue';
import CollapsedPanel from '@/components/board/CollapsedPanel.vue';
import SettingsPanel from '@/components/board/SettingsPanel.vue';
import Toolbar from '@/components/board/Toolbar.vue';
import CookieModal from '@/components/modals/CookieModal.vue';
import ConfirmModal from '@/components/modals/ConfirmModal.vue';
import RestoreToast from '@/components/modals/RestoreToast.vue';
import {
  BOARD_EDGE_PADDING,
  BOARD_MOBILE_CANVAS_WIDTH_PX,
  BOARD_MOBILE_CANVAS_HEIGHT_PX,
  BOARD_MOBILE_LAYOUT_MAX_WIDTH_PX,
  BOARD_MAX_STICKER_RIGHT_MOBILE,
  BOARD_MAX_STICKER_BOTTOM_MOBILE
} from '@/constants/board.constants';
import { clampStickerLayoutToBoardBounds } from '@/utils/boardLayoutClamp';
import { setBoardPlayableClientSize } from '@/utils/boardPlayableSize';

const store = useMainStore();
const activeGeneralSettings = ref(false);

const boardViewportRef = ref(null);
const boardRef = ref(null);
let boardResizeObserver = null;

function mobileBoardMql() {
  return typeof window !== 'undefined'
    ? window.matchMedia(`(max-width: ${BOARD_MOBILE_LAYOUT_MAX_WIDTH_PX}px)`)
    : null;
}

const isMobileBoardLayout = ref(
  typeof window !== 'undefined' ? mobileBoardMql()?.matches === true : false
);

function syncMobileBoardLayoutFlag() {
  const mql = mobileBoardMql();
  isMobileBoardLayout.value = mql ? mql.matches : false;
}

let viewportResizeObserver = null;
let mobileLayoutMql = null;

function onMobileLayoutMqlChange() {
  syncMobileBoardLayoutFlag();
}

function setBoardScreenScrollLock(on) {
  if (typeof document === 'undefined') return;
  const cl = 'board-screen';
  document.documentElement.classList.toggle(cl, on);
  document.body.classList.toggle(cl, on);
}

function clampBoardViewportScroll() {
  const el = boardViewportRef.value;
  if (!el || !isMobileBoardLayout.value) return;
  const maxL = Math.max(0, el.scrollWidth - el.clientWidth);
  const maxT = Math.max(0, el.scrollHeight - el.clientHeight);
  el.scrollLeft = Math.min(maxL, Math.max(0, el.scrollLeft));
  el.scrollTop = Math.min(maxT, Math.max(0, el.scrollTop));
}

/** Старт с центра полотна, а не с левого верхнего угла. */
function centerBoardViewportScroll() {
  const el = boardViewportRef.value;
  if (!el || !isMobileBoardLayout.value) return;
  const maxL = Math.max(0, el.scrollWidth - el.clientWidth);
  const maxT = Math.max(0, el.scrollHeight - el.clientHeight);
  el.scrollLeft = maxL / 2;
  el.scrollTop = maxT / 2;
}

function applyMobileBoardScrollLayout() {
  centerBoardViewportScroll();
  clampBoardViewportScroll();
}

watch(isMobileBoardLayout, (mobile) => {
  const vp = boardViewportRef.value;
  if (!mobile && vp) {
    vp.scrollLeft = 0;
    vp.scrollTop = 0;
  }
  setBoardScreenScrollLock(!!mobile);
  if (mobile) {
    requestAnimationFrame(() => requestAnimationFrame(applyMobileBoardScrollLayout));
  }
});

function onBoardViewportScroll() {
  clampBoardViewportScroll();
}

function onWindowResizeForBoard() {
  requestAnimationFrame(clampBoardViewportScroll);
}

function reclampAllStickersToBoard() {
  for (const s of store.stickers) {
    clampStickerLayoutToBoardBounds(s);
  }
}

/** Десктоп: границы стикеров = видимый .board; мобилка — константы в getBoardStickerMaxExtents. */
function applyBoardPlayableSizeAndClamp() {
  const el = boardRef.value;
  if (!el) return;
  if (!isMobileBoardLayout.value) {
    setBoardPlayableClientSize(el.clientWidth, el.clientHeight);
  }
  reclampAllStickersToBoard();
}

onMounted(() => {
  syncMobileBoardLayoutFlag();
  mobileLayoutMql = mobileBoardMql();
  mobileLayoutMql?.addEventListener('change', onMobileLayoutMqlChange);

  setBoardScreenScrollLock(isMobileBoardLayout.value);

  if (isMobileBoardLayout.value) {
    requestAnimationFrame(() => requestAnimationFrame(applyMobileBoardScrollLayout));
  } else {
    requestAnimationFrame(clampBoardViewportScroll);
  }
  applyBoardPlayableSizeAndClamp();
  const el = boardViewportRef.value;
  if (el && typeof ResizeObserver !== 'undefined') {
    viewportResizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(clampBoardViewportScroll);
    });
    viewportResizeObserver.observe(el);
  }
  const boardEl = boardRef.value;
  if (boardEl && typeof ResizeObserver !== 'undefined') {
    boardResizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(applyBoardPlayableSizeAndClamp);
    });
    boardResizeObserver.observe(boardEl);
  }
  el?.addEventListener('scroll', onBoardViewportScroll, { passive: true });
  window.addEventListener('resize', onWindowResizeForBoard);
});

onUnmounted(() => {
  setBoardScreenScrollLock(false);
  mobileLayoutMql?.removeEventListener('change', onMobileLayoutMqlChange);
  boardViewportRef.value?.removeEventListener('scroll', onBoardViewportScroll);
  window.removeEventListener('resize', onWindowResizeForBoard);
  boardResizeObserver?.disconnect();
  boardResizeObserver = null;
});

const boardSizeStyle = computed(() => {
  if (!isMobileBoardLayout.value) {
    return { width: '100%', flex: '1 1 0', minHeight: 0 };
  }
  return {
    width: `${BOARD_MOBILE_CANVAS_WIDTH_PX}px`,
    height: `${BOARD_MOBILE_CANVAS_HEIGHT_PX}px`
  };
});

/** Рамка зоны стикеров: отступы с четырёх сторон как в getBoardStickerMaxExtents (мобилка). */
const mobileBoundsGuideStyle = computed(() => {
  if (!isMobileBoardLayout.value) return {};
  return {
    '--board-mobile-bounds-left': `${BOARD_EDGE_PADDING}px`,
    '--board-mobile-bounds-top': `${BOARD_EDGE_PADDING}px`,
    '--board-mobile-playable-w': `${BOARD_MAX_STICKER_RIGHT_MOBILE}px`,
    '--board-mobile-playable-h': `${BOARD_MAX_STICKER_BOTTOM_MOBILE}px`
  };
});

function createStickerOnDoubleClick(event) {
  const board = event.currentTarget;
  const viewport = boardViewportRef.value;
  const rect = board.getBoundingClientRect();
  const scrollL = viewport?.scrollLeft ?? 0;
  const scrollT = viewport?.scrollTop ?? 0;
  let x = event.clientX - rect.left + scrollL;
  let y = event.clientY - rect.top + scrollT;
  if (isMobileBoardLayout.value) {
    x -= BOARD_EDGE_PADDING;
    y -= BOARD_EDGE_PADDING;
  }
  store.createSticker(
    store.nextId,
    '',
    false,
    x,
    y,
    store.settings.width,
    store.settings.height,
    store.getDefaultColor(),
    store.settings.font,
    store.settings.fontSize,
    store.getTextColor(store.getDefaultColor()),
    Math.max(...store.stickers.map(s => s.z), 0)
  );
}
</script>

<template>
  <div class="board-app">
    <main>
      <div
        ref="boardViewportRef"
        class="board-viewport"
        :class="{ 'board-viewport--pannable': isMobileBoardLayout }"
      >
        <div
          ref="boardRef"
          class="board"
          :class="{ 'board--mobile-canvas': isMobileBoardLayout }"
          :style="[boardSizeStyle, mobileBoundsGuideStyle]"
          @dblclick="createStickerOnDoubleClick"
        >
          <div
            v-if="isMobileBoardLayout"
            class="board__sticker-bounds"
            aria-hidden="true"
          ></div>
          <div
            class="board__playable"
            :class="{ 'board__playable--mobile': isMobileBoardLayout }"
          >
            <Sticker
              v-for="sticker in store.stickers.filter(s => !s.folded)"
              :key="sticker.token ?? sticker.id"
              :sticker="sticker"
            />
          </div>
        </div>
      </div>

      <CollapsedPanel />

      <SettingsPanel
        :active="activeGeneralSettings"
        @close="activeGeneralSettings = false"
      />

      <Toolbar
        :active-general-settings="activeGeneralSettings"
        @toggle-settings="activeGeneralSettings = !activeGeneralSettings"
      />
    </main>

    <CookieModal v-if="!store.cookiesConfirmed" />

    <RestoreToast />

    <ConfirmModal
      v-if="store.confirmClearBoard"
      title="Очистить доску?"
      text="Все стикеры будут удалены."
      confirm-text="Очистить"
      @cancel="store.confirmClearBoard = false"
      @confirm="store.clearBoard()"
    />
  </div>
</template>

<style lang="sass">
.board-app
  flex: 1
  min-height: 0
  display: flex
  flex-direction: column
  position: relative

main
  position: relative
  flex: 1
  min-height: 0
  overflow: hidden
  display: flex
  flex-direction: column

.board-viewport
  flex: 1
  min-height: 0
  overflow: hidden
  position: relative
  z-index: 0

// Десктоп: узор как на welcome/login — на вьюпорте под прозрачной .board
.board-viewport:not(.board-viewport--pannable)
  display: flex
  flex-direction: column

.board-viewport:not(.board-viewport--pannable)::before
  content: ''
  position: absolute
  inset: 0
  z-index: 0
  pointer-events: none
  background: radial-gradient(circle, rgba(0, 0, 0, 0.06) 1px, transparent 1px)
  background-size: 20px 20px

.board-viewport--pannable
  overflow: scroll
  scrollbar-gutter: stable
  -webkit-overflow-scrolling: touch
  overscroll-behavior: contain

// Мобилка: узор на полотне (скроллится с доской), те же значения, что в welcome / auth-screen
.board-viewport--pannable .board::before
  content: ''
  position: absolute
  inset: 0
  z-index: 0
  pointer-events: none
  background: radial-gradient(circle, rgba(0, 0, 0, 0.06) 1px, transparent 1px)
  background-size: 20px 20px

.board
  position: relative
  z-index: 1
  box-sizing: border-box

.board__playable
  position: relative
  z-index: 1
  width: 100%
  height: 100%
  &:not(.board__playable--mobile)
    min-height: 100%
    min-width: 100%

// На мобилке координаты стикеров как на десктопе (0…); сдвиг только визуальный
.board__playable--mobile
  position: absolute
  left: var(--board-mobile-bounds-left)
  top: var(--board-mobile-bounds-top)
  width: var(--board-mobile-playable-w)
  height: var(--board-mobile-playable-h)

.board--mobile-canvas
  flex-shrink: 0
  // в тон тулбару / кнопке настроек (#7A8798), не «тревожный» красный
  box-shadow: 0 0 0 1px rgba(122, 135, 152, 0.4)

// Одна рамка 0…max × 0…max — все четыре стороны одинаковые (не «теряются» у кромки экрана)
.board__sticker-bounds
  position: absolute
  left: var(--board-mobile-bounds-left)
  top: var(--board-mobile-bounds-top)
  width: var(--board-mobile-playable-w)
  height: var(--board-mobile-playable-h)
  box-sizing: border-box
  border: 2px solid rgba(122, 135, 152, 0.55)
  pointer-events: none
  z-index: 2
</style>
