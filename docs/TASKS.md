# Задачи (по MVP_SPEC.md)

## Контекст и требования
- Навигация между основными страницами должна быть связана: главная консоль ↔ Applications UI.

## Сделано
- Auth + базовая структура проекта.
- StudentProfile CRUD.
- Applications CRUD (только из My Universities) + deadline.
- Tasks CRUD + генерация задач из шаблонов.
- Documents + Versions.
- AI endpoints (stub).
- UI страницы для структуры: Dashboard, Onboarding, Universities, Tasks, Documents, Common App Draft.
- Минимальный UI для проверок: `/app/` и `/applications-ui/` (с навигацией).
- Публичный лендинг Enroll AI + страницы входа/регистрации.
- Лендинг обновлён по `docs/ENROLL_UI_REFERENCE.md` (новая навигация, каталожные карточки, сториблок, FAQ, тариф, футер).
- Обновлён визуал внутренних UI страниц (Dashboard, Onboarding, Universities, Tasks, Documents, Common App) под единый стиль.
- Добавлены настройки профиля: Settings страница, смена пароля, выход из аккаунта.

## Дальше по MVP (из MVP_SPEC.md)
- Финализация Applications workflow (последний этап).
