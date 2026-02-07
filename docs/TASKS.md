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
- Добавлен отдельный `frontend/` на Next.js для безопасной поэтапной миграции без отключения текущего Django UI.
- Реализован полноценный `Calendar` экран в Next.js: Month/Week view, events (`task` + `deadline`), quick input `/task`, фильтры, drag&drop задач по дням, Today/Next7 panel и Timeline 14 дней.
- Обновлён backend serializer задач: в API `/api/tasks/` теперь возвращается связанная `application` для фильтрации по вузу на календаре.
- Маршрут `/tasks` сохранён как совместимый redirect на `/calendar`.
- Django визуальные шаблоны удалены, `backend/config/urls.py` переведён в API/admin режим.

## Дальше по MVP (из MVP_SPEC.md)
- Довести этап C до финального UX-полиша (legend, цветовые правила, статусные badge-паттерны, быстрый inline-edit задач).
- Этап D: Documents + versions polish (финальная версия, удобное копирование/экспорт, явная связь версий с вузами).
- Финализация Applications workflow (последний этап бизнес-логики).
