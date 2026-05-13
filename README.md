# Frontend — FQW

React-приложение для управления портфолио абитуриентов. Работает с тремя бэкенд-сервисами через Axios. В production раздаётся через Nginx (который также проксирует API-запросы).

## Стек

| Технология | Назначение |
|---|---|
| React 18 | UI-фреймворк |
| MUI v5 (Material UI) | Компонентная библиотека |
| Redux + connected-react-router | Глобальное состояние и маршрутизация |
| Axios | HTTP-клиент с JWT-интерцептором |
| Formik | Управление формами |
| EventSource (SSE) | Live-обновления статуса и потоковая генерация аннотаций |

## Быстрый старт

```bash
# Установка зависимостей
yarn install

# Запуск в режиме разработки (порт 3000)
yarn start

# Сборка для продакшена
yarn build

# Форматирование кода
yarn format
```

##### Примечание: можно использовать npm в качестве пакетного менеджера

## Настройка API

В разработке API-запросы проксируются через `setupProxy.js`. В продакшене — через Nginx.

Пути в `src/config.js` **относительные** (без хоста):

```js
manageApi:  '/api/manage'   // manage-service (8080)
baseURLApi: '/api/auth'     // auth-service (8081)
statsApi:   '/api/stats'    // statistics-service (8083)
```

Для локального запуска без Docker настройки прокси в `setupProxy.js` можно переопределить на `http://localhost:808x`.

## Структура src/

```
src/
├── config.js                        # URL бэкенд-сервисов
├── index.js                         # Точка входа, Redux store, роутер
├── context/
│   ├── UserContext.js               # Аутентификация, текущий пользователь
│   ├── ManagementContext.js         # Состояние управления (программы, пользователи)
│   ├── LayoutContext.js             # Состояние лейаута (sidebar, breadcrumbs)
│   ├── ThemeContext.js              # Переключение темы
│   └── ProductContext.js           # Контекст продукта
├── utils/
│   ├── axiosInterceptor.js          # Авто-подстановка JWT, обработка 401
│   ├── tokenManager.js              # Чтение/запись токена в localStorage
│   ├── roles.js                     # hasRole(), hasAnyRole() — поддержка массива ролей
│   ├── dateUtils.js                 # Утилиты форматирования дат
│   └── hash.js                      # Хэш-утилиты
├── actions/                         # Redux actions
├── reducers/                        # Redux reducers
├── components/                      # Переиспользуемые UI-компоненты
│   ├── App.js / Layout/             # Основной лейаут
│   ├── Sidebar/ / Header/           # Навигация
│   ├── Table/ / Search/             # Таблицы и поиск
│   ├── Widget/ / Notification/      # Виджеты и уведомления
│   ├── FormItems/ / Dialog/         # Элементы форм и диалоги
│   ├── Timeline/ / Dot/             # Таймлайн статусов
│   └── UserAvatar/ / Loader/ ...   # Прочие компоненты
└── pages/
    ├── login/                       # Страница входа
    ├── verify/                      # Подтверждение email по токену
    ├── reset/                       # Сброс пароля
    ├── dashboard/                   # Главный дашборд со статистической панелью
    ├── programs/                    # Управление образовательными программами
    ├── statistics/                  # Агрегированная статистика
    ├── user/                        # Управление пользователями
    │   ├── UserList.js              # Список пользователей
    │   ├── AddUser.js / EditUser.js # Создание и редактирование
    │   └── ExpertSlotsManager.js   # Назначение экспертов на программы
    ├── CRUD/Users/                  # CRUD-страницы пользователей
    └── applicants/
        ├── Applicants.js            # Список абитуриентов
        ├── AddApplicant.js          # Создание абитуриента
        ├── annotation/
        │   └── AnnotationPage.js    # SSE-страница генерации AI-аннотации
        └── details/
            ├── ApplicantDetails.js  # Главная страница деталей
            ├── hooks/
            │   └── useApplicantDetails.js   # Центральный хук (~47 зависимостей)
            └── components/
                ├── DocumentsSection.js      # Загрузка, просмотр, смена категории
                ├── ManualEntryPage.js       # Split-pane: PDF + форма ввода
                ├── PersonalDataSection.js   # Паспортные данные
                ├── EducationSection.js      # Диплом
                ├── AdditionalEducationSection.js  # Дополнительное образование
                ├── AchievementsSection.js   # Достижения
                ├── LanguageSection.js       # Языковые сертификаты
                ├── MotivationSection.js     # Мотивационное письмо
                ├── RecommendationSection.js # Рекомендательное письмо
                ├── VideoSection.js          # Видеопрезентация
                ├── ExpertEvaluationForm.js  # Форма оценки эксперта
                └── ExpertEvaluations.js     # Список оценок
```

## Роли пользователей

Роли хранятся в виде массива (`user.roles: string[]`). Для проверки используйте утилиты из `utils/roles.js`:

```js
import { hasRole, hasAnyRole } from '../../utils/roles';

hasRole(user, 'admin');                        // есть ли роль
hasAnyRole(user, ['admin', 'manager']);        // хотя бы одна из ролей
```

| Роль | Права |
|---|---|
| `admin` | Полный доступ: пользователи, программы, критерии, схемы скоринга |
| `manager` | Управление абитуриентами, документами, программами |
| `operator` | Ручной ввод данных, проверка, просмотр |
| `expert` | Оценивание портфолио по критериям |

## Аутентификация

JWT-токен хранится в `localStorage` через `tokenManager`. При каждом запросе `axiosInterceptor.js` подставляет заголовок `Authorization: Bearer <token>`. При ответе `401` — автоматический выход.

Данные текущего пользователя (`firstName`, `lastName`, `roles`) доступны через `useUserState()` из `UserContext`.

Дополнительные страницы аутентификации:
- `/verify?token=...` — подтверждение email
- `/reset` — сброс пароля

## SSE (Server-Sent Events)

Два места в приложении используют SSE вместо polling:

1. **`useApplicantDetails`** — подписка на `GET /v1/applicants/:id/status/stream` для live-обновления статуса обработки документов
2. **`AnnotationPage`** — подписка на `GET /v1/applicants/:id/annotation/stream` для потоковой генерации AI-аннотации. Поддерживает кнопку «Перегенерировать» (`?regenerate=true`)

## Управление пользователями и экспертами

Раздел `pages/user/`:
- `UserList.js` — таблица всех пользователей с поиском
- `AddUser.js` / `EditUser.js` — форма создания/редактирования
- `ExpertSlotsManager.js` — назначение экспертов на слоты программы (управляет таблицей `expert_slots`)

