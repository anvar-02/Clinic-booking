# VitBite — сайт стоматологии

Сайт клиники VitBite с онлайн-записью на приём. В проект входят публичная главная страница, личный кабинет пациента и серверная часть для авторизации и бронирования времени у врача.

## Возможности

- Главная страница с информацией о клинике, услугах, врачах и контактах
- Адаптивная навигация для мобильных устройств
- Регистрация и вход пациента
- Личный кабинет: список врачей, запись на приём и отмена своих записей
- Расписание приёмов для авторизованного врача
- Роли `patient`, `doctor` и `admin`; доступ проверяется на сервере
- Защита от двойного бронирования одного времени у врача на уровне PostgreSQL

## Технологии

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express, TypeScript
- **База данных:** PostgreSQL
- **Авторизация:** JWT; пароли хранятся в виде bcrypt-хешей

## Запуск для разработки

Нужен Node.js 20.19+ или 22.12+, а также PostgreSQL.

1. Создай базу `clinic_booking` и выполни схему:

   ```sh
   createdb -U postgres clinic_booking
   psql -U postgres -d clinic_booking -f backend/sql/schema.sql
   ```

2. Создай `backend/.env` и укажи параметры подключения:

   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=твой_пароль
   DB_NAME=clinic_booking
   JWT_SECRET=длинная_случайная_строка
   ```

3. В первом терминале запусти backend:

   ```sh
   cd backend
   npm ci
   npm run dev
   ```

   API будет доступно на `http://localhost:3000`.

4. Во втором терминале запусти frontend:

   ```sh
   cd frontend
   npm ci
   npm run dev
   ```

   Открой `http://localhost:5173`. Vite проксирует запросы `/api` на backend.

Для входа и записи должны быть запущены backend и PostgreSQL. Если открыть `frontend/index.html` напрямую как файл, приложение не запустится — используй Vite.

## Добавление врача

Регистрация через сайт создаёт аккаунт пациента. Чтобы добавить врача, зарегистрируй аккаунт, затем выполни в базе, подставив его email:

```sql
UPDATE users SET role = 'doctor' WHERE email = 'doctor@example.com';

INSERT INTO doctors (user_id, speciality)
SELECT id, 'Ортопед' FROM users WHERE email = 'doctor@example.com';
```

## API

| Метод | Путь | Доступ | Назначение |
|---|---|---|---|
| `POST` | `/api/auth/register` | Все | Регистрация пациента |
| `POST` | `/api/auth/login` | Все | Вход и получение JWT |
| `GET` | `/api/auth/me` | Авторизованные | Данные текущего пользователя |
| `GET` | `/api/doctors` | Авторизованные | Список врачей |
| `POST` | `/api/appointments` | Пациент | Создать запись |
| `GET` | `/api/appointments/my` | Пациент | Список своих записей |
| `DELETE` | `/api/appointments/:id` | Пациент | Отменить свою запись |
| `GET` | `/api/appointments/doctor` | Врач | Посмотреть свои приёмы |

## Структура проекта

- `frontend/` — сайт на React и TypeScript
- `frontend/public/images/` — фотографии клиники, врачей и услуг
- `backend/` — API на Express
- `backend/sql/schema.sql` — схема базы данных
- `docs/` — материалы проекта

## Дальнейшая работа

- Отдельные страницы услуг и разделов из шапки сайта
- Доработка личного кабинета пациента и профилей врачей
- Панель администратора
- Автоматические тесты
