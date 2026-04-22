# Frontend — FQW

React-приложение для управления портфолио абитуриентов. Работает с тремя бэкенд-сервисами через Axios.

## Стек

| Технология | Назначение |
|---|---|
| React 18 | UI-фреймворк |
| MUI v5 (Material UI) | Компонентная библиотека |
| Redux + connected-react-router | Глобальное состояние и маршрутизация |
| Axios | HTTP-клиент с JWT-интерцептором |
| Formik | Управление формами |
| WebSocket (native) | Live-обновления статуса обработки документов |

## Быстрый старт

```bash
# Установка зависимостей
yarn install

# Запуск в режиме разработки (порт 3000)
yarn start

# Сборка для продакшена
yarn build

# Форматирование
yarn format
```

## Настройка API

Адреса сервисов задаются в `src/config.js`:

```js
manageApi:  'http://localhost:8080'   // manage-service
baseURLApi: 'http://localhost:8081'   // auth-service
statsApi:   'http://localhost:8083'   // statistics-service
```

## Структура src/

```
src/
├── config.js                  # URL бэкенд-сервисов
├── context/
│   └── UserContext.js         # Аутентификация, текущий пользователь
├── interceptors/
│   └── axiosInterceptor.js    # Авто-подстановка JWT, обработка 401
├── pages/
│   ├── applicants/
│   │   ├── details/
│   │   │   ├── hooks/
│   │   │   │   └── useApplicantDetails.js   # Центральный хук (~47 зависимостей)
│   │   │   └── components/
│   │   │       ├── DocumentsSection.js      # Загрузка, просмотр, смена категории
│   │   │       ├── ManualEntryPage.js       # Split-pane: PDF + форма ввода
│   │   │       └── ...секции данных
│   │   └── ApplicantsPage.js
│   ├── auth/                  # Логин
│   ├── programs/              # Образовательные программы
│   └── statistics/            # Дашборд статистики
└── store/                     # Redux store
```

## Роли пользователей

| Роль | Права |
|---|---|
| `admin` | Полный доступ, управление пользователями и программами |
| `manager` | Управление абитуриентами, документами |
| `operator` | Ручной ввод данных, просмотр |
| `expert` | Оценивание портфолио |

## Аутентификация

JWT-токен хранится в `localStorage` через `tokenManager`. При каждом запросе `axiosInterceptor` подставляет заголовок `Authorization: Bearer <token>`. При 401 — автоматический выход.

Данные текущего пользователя (`firstName`, `lastName`, `role`) доступны через `useUserState()` из `UserContext`.
