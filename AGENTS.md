# Stycky Board — Контекст проекта

## Что это
Онлайн-доска стикеров (sticky notes) — приложение для создания, перемещения и организации заметок на виртуальной доске. Аналог Miro/Figma sticky notes в упрощённом виде.

## Стек
- **Frontend**: Vue 3 (Composition API), Pinia, Vue Router, Vite, SASS
- **Backend**: Laravel 12 (пока минимально задействован)
- **Хранение**: localStorage (синк с API — по мере внедрения)

## Тесты
- **Frontend** (`frontend/`): **`npm test`** — Vitest; **`npm run test:watch`** — watch. Покрытие: **`mergeGuestBoardLww`**, **`stickersOutbox`**, **`stickersRemoteSync`** (в т.ч. **`initStickersSyncLifecycle`**: интервал **`STICKER.REMOTE_PULL_INTERVAL_MS`**), **`sticker.constants`** (значение интервала pull), **`stickersPersistenceContext`**. Полный сценарий «офлайн → вход → выход» в браузере автоматически не гоняется — для этого нужен E2E (Playwright и т.д.).
- **Backend** (`backend/`): **`php artisan test`** — PHPUnit: `AuthTest`, `StickerTest` (CRUD, soft delete, `removed?since=`, восстановление по POST), **`HealthTest`** (`GET /api/health`).

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
│   │   ├── screens/       # WelcomeScreen, BoardApp, PrivacyPolicy, LoginScreen, RegisterScreen, DevAuthScreen (только dev)
│   │   ├── services/      # laravelApi.js, stickersApi.js, stickersRemoteSync.js, stickersOutbox.js (+ *.test.js), authSession.js
│   │   ├── utils/         # stickerIdentity.js, mergeGuestBoardLww.js, stickersPersistenceContext.js (+ *.test.js)
│   │   ├── stores/        # main.store.js, auth.store.js, sync.store.js (статус сети / синка)
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
- **Stickers (JSON, только `auth:sanctum`):** модель **`Sticker`**, миграция `stickers` — `user_id`, **`uuid`** (уникальный публичный id), поля как на фронте (`text`, `folded`, `x`, `y`, `w`, `h`, `bc`, `font`, `fs`, `tc`, `z`), timestamps. Доступ только к строкам **`user_id = auth()->id()`**; чужой `uuid` → **404**.
  - `GET /api/stickers` → `{ stickers: [...] }`; опционально **`?since=`** (дата/ISO8601) — только записи с **`updated_at` > since** (инкрементальный pull).
  - `POST /api/stickers` — тело с полями стикера; опционально **`uuid`** (клиентский), иначе сервер генерирует. Ответ **`{ sticker }`**, 201.
  - `PATCH /api/stickers/{uuid}` — частичное обновление; тело **без** `uuid`. Ответ **`{ sticker }`** с актуальным **`updated_at`**.
  - `DELETE /api/stickers/{uuid}` — **soft delete** (Eloquent `SoftDeletes`), **204** без тела; запись остаётся в БД с **`deleted_at`**.
  - `GET /api/stickers/removed?since=` — tombstone для pull: **`{ removed: [{ uuid, deleted_at }] }`** из корзины пользователя (только удаления после `since`). Гость не вызывает.
  - `POST /api/stickers` с **`uuid`**, совпадающим с софт-удалённой записью этого пользователя — **восстановление** и обновление полей.
  - Каждый элемент: **`uuid`**, **`updated_at`** (ISO8601) + поля стикера (короткие ключи как во фронте).
- **Офлайн-синк (позже):** `POST /api/sync` (батч + LWW) — не реализовано.

## Маршруты (frontend)
| Путь | Экран | Описание |
|------|-------|----------|
| `/` | WelcomeScreen | Приветствие, кнопка «Начать работу» |
| `/board` | BoardApp | Основная доска со стикерами |
| `/privacy` | PrivacyPolicy | Политика конфиденциальности |
| `/login` | LoginScreen | Вход (`apiLogin`), ссылка на регистрацию, **«Продолжить как гость»** (флаг welcome + `/board`) |
| `/register` | RegisterScreen | Регистрация (`apiRegister`), то же для гостя |
| `/dev-auth` | DevAuthScreen | Только **`npm run dev`**: проверка login/register и `GET /api/user` (`VITE_API_URL` в `frontend/.env`) |

**Логика навигации**: Пользователь должен один раз увидеть WelcomeScreen. После нажатия «Начать» флаг `welcome-shown` в localStorage. При заходе на `/` — редирект на `/board`. При заходе на `/board` без флага — редирект на `/`. Маршруты **`/login`** и **`/register`** доступны без флага welcome.

**Part E (продукт / UX):** на Welcome — ссылки «Войти» / «Регистрация». В **Toolbar** — бейдж **`sync.store`**: офлайн / синхронизация / ошибка / «Синхронизировано» (аккаунт) или «Локально» (гость); для гостя — ссылка «Войти»; для аккаунта — краткий email, **«Выйти»** (`authSession.performLogout`: при непустом outbox — `confirm`, затем **`clearOutbox`** + flush, **`apiLogout`**, **`setGuest`**).

**Удаления на нескольких устройствах:** сервер хранит tombstone (`deleted_at`); инкрементальный pull подмешивает **`GET /stickers/removed`** и удаляет локальные стикеры по `uuid`, чтобы pull не «воскрешал» удалённые на другом устройстве.

## Store (Pinia)
### main (`main.store.js`)
- **stickers** — массив стикеров
- **deletedStickers** — массив удалённых (для restore toast)
- **settings** — дефолт: ширина, высота, тема цвета, шрифт, размер
- **cookiesConfirmed**, **confirmClearBoard**

### auth (`auth.store.js`)
- **`authMode`**: `AUTH_MODE_GUEST` | `AUTH_MODE_AUTHENTICATED` (`auth.constants.js`)
- **`isGuest`**: нет сессии Laravel → доска в ключе **`stickers-store-guest`**; при входе — **`stickers-store-user-{id}`** (отдельные ключи). После входа **`mergeGuestBoardLwwIntoUserStore()`**: гостевой ключ уже содержит снимок памяти с правками гостя; после **`hydrate`** снимка пользователя — **LWW по `token` + `updated_at`**, плюс стикеры только у гостя (чтобы не терять правки при непустом ключе пользователя). Затем **`runAuthenticatedBoardSync`**. При **выходе** актуальное состояние пишется в **`stickers-store-guest`** без **`hydrate`** со старого гостевого снимка. См. `storage.constants.js`, миграция **`stickers-store`** → гостевой ключ.
- **`refreshSession()`**: при старте приложения `GET /api/user` с credentials; при ошибке/401 → `setGuest()`

Структура стикера: `{ id, token, updated_at, text, folded, x, y, w, h, bc, font, fs, tc, z }` — **`token`** (UUID) и **`updated_at`** (ISO8601) для синка; при создании задаются в `createSticker`; при загрузке из localStorage без них — одноразовая доработка в **`ensurePersistedStickersIdentity`** (`utils/stickerIdentity.js`). **`bumpStickerUpdatedAt`** — контент/свёртка + при залогине **debounced PATCH** (`STICKER.REMOTE_PATCH_DEBOUNCE_MS`). Геометрия при **`SYNC_INCLUDE_LAYOUT === false`** не двигает `updated_at` и не уходит в PATCH. **`STICKER.SYNC_INCLUDE_LAYOUT`**: `false` = вариант A (layout не в API-теле; merge с сервера не перезаписывает локальные x/y/w/h/z).

**Синк (залогинен):** `stickersRemoteSync.js` + **`sync.store.js`** (`syncStatus`: `synced` | `offline` | `syncing` | `error`, `networkOnline`). **`navigator.onLine`** + события **`online`/`offline`**. После гидратации и при входе в аккаунт — **`runAuthenticatedBoardSync`**; при **`online`** — **`drainRemoteQueueAndResync`**: outbox → полный merge → **`runIncrementalPull`**.

**Офлайн (outbox):** `stickersOutbox.js` + ключи **`getOutboxStorageKey`** / **`getPullWatermarkStorageKey`** в `storage.constants.js`. Операции `{ id, type: create|update|delete, token, payload?, clientMutationId, createdAt }` в **localStorage** (дебаунс записи + **`flushOutboxPersistence`** на **`pagehide`**). В офлайне мутации пишутся в outbox; при сети очередь сливается **последовательными POST/PATCH/DELETE** (без отдельного `POST /api/sync`). Конфликты MVP: 422 на create — снять операцию; 404 на update/delete — снять; 5xx — **`syncStatus` = error**. Инкрементальный pull: **`GET ?since=`** + **`GET /stickers/removed?since=`**; водяной знак по **`updated_at` и `deleted_at`**; merge по **token + updated_at** (LWW); таймер инкрементального pull **`STICKER.REMOTE_PULL_INTERVAL_MS`** (по умолчанию **10 с**), только при видимой вкладке; плюс **`visibilitychange`/`focus`**. После полного merge — **prune** локальных «лишних» стикеров относительно сервера/outbox. При смене гостя ↔ пользователя — **`invalidateOutboxCache`**.

**Полный merge (онлайн):** `GET /api/stickers`, LWW по контенту; «сироты» — POST; локальное новее — PATCH; подмешивание стикеров, появившихся во время запроса. Создание/удаление/восстановление — как раньше + outbox при офлайне. **`laravelApi.apiRequest`** — CSRF перед мутациями.

Персистенция: ключ зависит от auth (`getStickersStoreLocalStorageKey`); при смене гость ↔ пользователь — сброс в старый ключ + `hydrateFromLocalStorageKey` для нового. `$subscribe` → debounce 200ms; `pagehide` — flush. Текст стикера: debounce при вводе (`STICKER.TEXT_SAVE_DEBOUNCE_MS`) + **blur** textarea. В списках Vue **`:key`** — `sticker.token ?? sticker.id`.

## Основные возможности
1. **Стикеры**: создание (клик + на тулбаре, двойной клик по доске), перетаскивание, ресайз (углы lt, lb, rb — невидимые), свёртывание
2. **Тулбар**: перетаскиваемый, индикатор синка / вход / выход, создание стикера, настройки по умолчанию, очистка доски
3. **Удаление**: мгновенное удаление + toast «Восстановить» на 7 сек. При нескольких удалениях — несколько toasts, стекирующихся
4. **Настройки стикера**: popover над стикером (цвет, шрифт, размер) с мгновенным превью
5. **CollapsedPanel**: свёрнутые стикеры сбоку, клик — развернуть

## Технические детали
- SPA fallback: `_redirects` (Netlify), `.htaccess` (Apache)
- Drag: requestAnimationFrame для transform, translateZ(0) для compositor layer
- Тулбар на мобильных: touch-action: none, различие тап/перетаскивание по порогу 10px
- Тулбар: ограничение границами экрана через offsetWidth, EDGE_MARGIN 4px

## Язык интерфейса
Русский.

## Авторы
Трепачёв Дмитрий & Серенко Роман
