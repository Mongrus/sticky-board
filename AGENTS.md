# Stycky Board — Контекст проекта

## Что это
Онлайн-доска стикеров (sticky notes) — приложение для создания, перемещения и организации заметок на виртуальной доске. Аналог Miro/Figma sticky notes в упрощённом виде.

## Стек
- **Frontend**: Vue 3 (Composition API), Pinia, Vue Router, Vite, SASS
- **Backend**: Laravel 12 (пока минимально задействован)
- **Хранение**: localStorage (без бэкенда на данный момент)

## Структура проекта
```
stycky-board-prod/
├── frontend/          # Vue SPA — основное приложение
│   ├── src/
│   │   ├── components/
│   │   │   ├── board/     # Sticker, Toolbar, SettingsPanel, CollapsedPanel
│   │   │   ├── layout/    # Footer
│   │   │   └── modals/    # CookieModal, ConfirmModal, RestoreToast
│   │   ├── constants/     # sticker.constants.js, app.constants.js
│   │   ├── screens/       # WelcomeScreen, BoardApp, PrivacyPolicy
│   │   ├── stores/        # main.store.js
│   │   └── router/
│   └── public/            # _redirects, .htaccess для SPA fallback
└── backend/            # Laravel (готовность к будущему API)
```

## Маршруты
| Путь | Экран | Описание |
|------|-------|----------|
| `/` | WelcomeScreen | Приветствие, кнопка «Начать работу» |
| `/board` | BoardApp | Основная доска со стикерами |
| `/privacy` | PrivacyPolicy | Политика конфиденциальности |

**Логика навигации**: Пользователь должен один раз увидеть WelcomeScreen. После нажатия «Начать» флаг `welcome-shown` в localStorage. При заходе на `/` — редирект на `/board`. При заходе на `/board` без флага — редирект на `/`.

## Store (Pinia)
- **stickers** — массив стикеров
- **deletedStickers** — массив удалённых (для restore toast)
- **settings** — дефолт: ширина, высота, тема цвета, шрифт, размер
- **cookiesConfirmed**, **confirmClearBoard**

Структура стикера: `{ id, text, folded, x, y, w, h, bc, font, fs, tc, z }`

Персистенция: `$subscribe` → localStorage с debounce 200ms. При `pagehide` — немедленное сохранение.

## Основные возможности
1. **Стикеры**: создание (клик + на тулбаре, двойной клик по доске), перетаскивание, ресайз (углы lt, lb, rb — невидимые), свёртывание
2. **Тулбар**: перетаскиваемый, создание стикера, настройки по умолчанию, очистка доски
3. **Удаление**: мгновенное удаление + toast «Восстановить» на 7 сек. При нескольких удалениях — несколько toasts, стекирующихся
4. **Настройки стикера**: popover над стикером (цвет, шрифт, размер) с мгновенным превью
5. **CollapsedPanel**: свёрнутые стикеры сбоку, клик — развернуть

## Технические детали
- SPA fallback: `_redirects` (Netlify), `.htaccess` (Apache), `vercel.json`
- Drag: requestAnimationFrame для transform, translateZ(0) для compositor layer
- Тулбар на мобильных: touch-action: none, различие тап/перетаскивание по порогу 10px
- Тулбар: ограничение границами экрана через offsetWidth, EDGE_MARGIN 4px

## Язык интерфейса
Русский.

## Авторы
Трепачёв Дмитрий & Серенко Роман
