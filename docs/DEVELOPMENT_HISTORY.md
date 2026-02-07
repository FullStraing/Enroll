# История разработки Enroll: от старта до текущего состояния

## 1. Исходная цель проекта

Проект строится как MVP-платформа для поступления в университеты США (CIS -> USA), где пользователь проходит управляемый процесс:

- заполняет профиль;
- формирует список университетов и заявок;
- получает roadmap/задачи/дедлайны;
- ведет документы с версиями;
- использует AI-помощник для черновиков и проверок.

Ключевой принцип MVP: **не автоподача**, а структурирование процесса и подготовка данных.

## 2. Этапы развития (что и зачем делалось)

### Этап A. Базовая backend-архитектура

Собран Django backend с модульной структурой `apps/*`:

- `users`
- `universities`
- `tasks`
- `documents`
- `ai`
- `core`

Это обеспечило разделение доменов и возможность параллельно развивать API и UI.

### Этап B. Auth и профиль

Реализованы:

- регистрация;
- JWT вход/refresh;
- endpoint текущего пользователя (`/api/me/`);
- профиль студента (`/api/auth/profile/`).

Отдельно добавлены настройки безопасности:

- смена пароля (`/api/auth/change-password/`);
- длительные JWT lifetime (access/refresh);
- серверный middleware-гейт для защищенных страниц UI.

### Этап C. Admissions-ядро

Собрано ядро процесса:

- Universities (общий список);
- My Universities (персональный список);
- Applications (CRUD в связке с My Universities);
- Tasks + генерация из шаблонов;
- Documents + Document Versions;
- AI endpoints (stub-реализация для следующего шага).

Результат: пользователь может пройти путь от профиля до задач/документов в одном рабочем контуре.

### Этап D. UI на Django Templates

Собраны рабочие страницы:

- landing;
- login/register;
- dashboard;
- onboarding;
- applications;
- tasks;
- documents;
- common-app;
- settings.

Визуально интерфейс унифицирован под темную glass-тему с синими акцентами, добавлены иконки и разделы навигации.

### Этап E. UX и операционные улучшения

Добавлены:

- лоадер (SVG) и стандарты отображения загрузок;
- скелетоны в списках/таблицах;
- loading-state для action-кнопок;
- связка landing <-> dashboard;
- logout и отображение имени/инициала пользователя.

### Этап F. Инкрементальная миграция на Next.js

Принято архитектурное решение: не ломать работающий Django UI, а поднимать Next.js как отдельный frontend-слой.

Сделано:

- создан `frontend/` на Next.js (App Router, TS, Tailwind);
- реализованы страницы `landing/login/register/dashboard`;
- подключен существующий Django API и JWT;
- добавлен auth-protect через middleware и client gate;
- остальные разделы заведены как scaffold-страницы с fallback-ссылкой на текущие Django-экраны.

Таким образом, проект перешел от "только шаблоны" к **двухслойной модели**:

- стабильный production-like слой (Django templates);
- новый фронтенд-слой для постепенного переноса без регрессий.

## 3. Текущее состояние по факту

### Backend (стабильно работает)

Маршруты UI:

- `/`
- `/register`
- `/login`
- `/dashboard/`
- `/onboarding/`
- `/applications/`
- `/tasks/`
- `/documents/`
- `/common-app/`
- `/settings/`
- `/app/`
- `/applications-ui/`

API:

- auth/token/refresh;
- profile;
- me;
- universities/my-universities/applications;
- tasks/generate;
- documents/versions;
- ai/* (stub).

### Frontend Next.js (восстановлен и готов к развитию)

В `frontend/` восстановлены:

- конфиги (`package.json`, `tsconfig`, `next.config`, Tailwind/PostCSS, env example);
- app-router страницы (`/`, `/login`, `/register`, `/dashboard`, placeholders для остальных);
- компоненты (`loader`, `protected-page`, `app-shell`, `workspace-placeholder`);
- утилиты API/auth;
- middleware маршрутов.

## 4. Что уже закрывает MVP

Практически закрыты требования:

- auth/профиль;
- university/application базовый контур;
- tasks/documents;
- AI-стабы;
- связный UI;
- безопасность по пользовательским данным;
- хранение и повторное открытие данных после входа.

## 5. Что остается до полного MVP

Главный открытый блок (из `MVP_SPEC.md` и `docs/TASKS.md`):

- **финализация Applications workflow** как последнего этапа end-to-end.

Что это означает на практике:

- довести UX заявок до полностью линейного сценария;
- донастроить переходы заявки -> задачи -> документы;
- убедиться, что сценарий пользователя за 10-15 минут реально выполняется без ручных обходов.

## 6. Архитектурное направление (к чему идем)

Целевое направление:

- backend остается на Django + DRF + PostgreSQL;
- frontend последовательно переходит в Next.js;
- Django templates остаются как fallback до полного parity.

Почему это правильно:

- не ломаем рабочее приложение;
- миграция идет частями с контролем рисков;
- можно выпускать улучшения без "big bang rewrite".

## 7. Технические решения, которые уже снижают риски

- server-side auth gate для защищенных backend UI роутов;
- единая JWT-модель для Django и Next;
- `.gitignore` для frontend build/artifacts;
- разделение legacy UI и нового frontend слоя.

## 8. Как запускать проект сейчас

### Вариант 1 (текущий рабочий Django UI)

1. Запустить backend:

```bash
python backend/manage.py runserver
```

2. Открыть `http://127.0.0.1:8000`.

### Вариант 2 (параллельно проверять новый Next.js)

1. Запустить backend (`:8000`).
2. Запустить frontend:

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

3. Открыть `http://localhost:3000`.

## 9. Важные замечания по репозиторию

- `node_modules` и `.next` не должны попадать в git.
- Основной рабочий контур для демонстрации MVP сейчас гарантированно есть в Django UI.
- Next.js слой используется для управляемой миграции и дальнейшего ускорения разработки интерфейса.

## 10. Итог

Проект прошел путь от backend-заготовки до почти полного MVP с рабочими пользовательскими сценариями, UI-слоем, безопасностью и подготовленным переходом на современный frontend.

На текущий момент система уже демонстрируема как продукт, а следующий фокус — довести `Applications workflow` до финальной версии и закрыть MVP полностью.
