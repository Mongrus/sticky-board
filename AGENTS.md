# Stycky Board — Контекст проекта

## Что это
Онлайн-доска стикеров (sticky notes) — приложение для создания, перемещения и организации заметок на виртуальной доске. Аналог Miro/Figma sticky notes в упрощённом виде.

## Стек
- **Frontend**: Vue 3 (Composition API), Pinia, Vue Router, Vite, SASS
- **Backend**: Laravel 12 (пока минимально задействован)
- **Хранение**: localStorage (синк с API — по мере внедрения)

## Структура проекта
```
stycky-board-prod/
├── frontend/          # Vue SPA — основное приложение
│   ├── src/
│   │   ├── components/
│   │   │   ├── board/     # Sticker, Toolbar, SettingsPanel, CollapsedPanel
│   │   │   ├── layout/    # Footer
│   │   │   └── modals/    # CookieModal, ConfirmModal, RestoreToast
│   │   ├── constants/     # sticker, app, auth, storage.constants.js (ключи localStorage доски)
│   │   ├── screens/       # WelcomeScreen, BoardApp, PrivacyPolicy, DevAuthScreen (только dev)
│   │   ├── services/      # laravelApi.js — Sanctum + fetch с credentials
│   │   ├── stores/        # main.store.js, auth.store.js (гость / сессия)
│   │   └── router/
│   └── public/            # _redirects, .htaccess для SPA fallback
└── backend/            # Laravel API (`routes/api.php`, префикс `/api`)
```

## Backend API (Laravel)
- Маршруты: `backend/routes/api.php`, префикс **`/api`**, middleware-группа **`api`** (см. `bootstrap/app.php`).
- Проверка: `GET http://localhost:8000/api/health` → JSON `{ ok, service }`.
- **Laravel Sanctum (SPA)**: cookie + CSRF для первого лица (Vue на `FRONTEND_URL`). В `bootstrap/app.php` включён **`statefulApi()`**; модель **`User`** использует **`HasApiTokens`**. Миграция **`personal_access_tokens`** (Bearer-токены при необходимости).
- **CORS**: `config/cors.php` — **`supports_credentials: true`** (через **`CORS_SUPPORTS_CREDENTIALS`**), **`FRONTEND_URL`**, пути `api/*` и `sanctum/csrf-cookie`.
- **Stateful-домены**: `config/sanctum.php` + опционально **`SANCTUM_STATEFUL_DOMAINS`** в `.env` (по умолчанию включены `localhost:5173`, `127.0.0.1:5173` и хост из **`APP_URL`**).
- Со стороны фронта перед логином: `GET /sanctum/csrf-cookie`, затем запросы с **`credentials: 'include'`** и заголовком **`X-XSRF-TOKEN`** (из cookie `XSRF-TOKEN`).
- **Auth (JSON):** `POST /api/register` (name, email, password, password_confirmation), `POST /api/login` (email, password, опционально remember), `POST /api/logout` (только авторизованный), `GET /api/user` — успех: `{ user: { id, name, email, email_verified_at } }`.

## Маршруты (frontend)
| Путь | Экран | Описание |
|------|-------|----------|
| `/` | WelcomeScreen | Приветствие, кнопка «Начать работу» |
| `/board` | BoardApp | Основная доска со стикерами |
| `/privacy` | PrivacyPolicy | Политика конфиденциальности |
| `/dev-auth` | DevAuthScreen | Только **`npm run dev`**: проверка login/register и `GET /api/user` (`VITE_API_URL` в `frontend/.env`) |

**Логика навигации**: Пользователь должен один раз увидеть WelcomeScreen. После нажатия «Начать» флаг `welcome-shown` в localStorage. При заходе на `/` — редирект на `/board`. При заходе на `/board` без флага — редирект на `/`.

## Store (Pinia)
### main (`main.store.js`)
- **stickers** — массив стикеров
- **deletedStickers** — массив удалённых (для restore toast)
- **settings** — дефолт: ширина, высота, тема цвета, шрифт, размер
- **cookiesConfirmed**, **confirmClearBoard**

### auth (`auth.store.js`)
- **`authMode`**: `AUTH_MODE_GUEST` | `AUTH_MODE_AUTHENTICATED` (`auth.constants.js`)
- **`isGuest`**: нет сессии Laravel → доска в ключе **`stickers-store-guest`**; при входе — **`stickers-store-user-{id}`** (гость и аккаунт не смешиваются). См. `storage.constants.js`, миграция из старого **`stickers-store`** → гостевой ключ при первом запуске.
- **`refreshSession()`**: при старте приложения `GET /api/user` с credentials; при ошибке/401 → `setGuest()`

Структура стикера: `{ id, text, folded, x, y, w, h, bc, font, fs, tc, z }`

Персистенция: ключ зависит от auth (`getStickersStoreLocalStorageKey`); при смене гость ↔ пользователь — сброс в старый ключ + `hydrateFromLocalStorageKey` для нового. `$subscribe` → debounce 200ms; `pagehide` — flush. Текст стикера: debounce при вводе (`STICKER.TEXT_SAVE_DEBOUNCE_MS`) + **blur** textarea.

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
