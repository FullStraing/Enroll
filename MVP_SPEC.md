MVP: Admission Platform (CIS → USA) — Спецификация для разработки
0) Цель MVP

Сделать веб-платформу на русском, которая превращает поступление в США в управляемый процесс:

пользователь заполняет профиль

выбирает/добавляет вузы (без “идеального” подбора на старте)

получает чеклист задач + дедлайны

хранит документы (эссе/резюме) с версиями

ИИ помогает: объясняет шаги + делает черновики/правки

Common App в MVP: без интеграции, только “черновик ответа + проверка + копипаст”

1) Роли

Student: основной пользователь

Parent (read-only): смотрит прогресс (опционально в MVP — можно отложить)

SchoolAdmin/Coach: управляет группой студентов (в MVP можно отложить)

Admin: управление контентом/шаблонами/вузами

✅ Для MVP достаточно: Student + Admin

2) User Flow (MVP)

Регистрация/логин

Онбординг: цель (США), год поступления, уровень (школа/колледж), бюджет (примерный)

Заполнение Student Profile (оценки/экзамены/активности/интересы)

“Мои университеты”:

добавить вуз из базы (если есть) или вручную (название + ссылки + дедлайн)

Появляется план:

список шагов (Roadmap)

задачи (Tasks) с дедлайнами

“Документы”:

эссе/резюме: создание → версии → комментарии ИИ (и позже людей)

“Common App draft”:

для каждого поля: инструкция + черновик ответа из профиля + чек на несостыковки

пользователь копирует вручную

3) Функционал MVP (must-have)
3.1 Auth + аккаунт

email/password (или OAuth позже)

JWT/Session

профиль пользователя

3.2 Student Profile (ядро)

Поля MVP (минимум):

full_name (можно псевдо)

country

graduation_year

intended_major (строка)

GPA/grades (строка/число)

tests: IELTS/TOEFL/SAT/DET (значение + дата)

activities (список)

honors (список)

budget_range (low/med/high или число)

3.3 Universities + Applications

таблица университетов (можно начать пустой + ручной ввод)

студент может:

добавить вуз в “мой список”

указать deadline (если нет в базе)

статус: planned / in_progress / submitted

3.4 Roadmap + Tasks

шаблонный roadmap (жёсткая структура + прогресс):

Profile

University list

Tests plan

Documents

Common App prep

Submission readiness

задачи генерируются из шаблонов + дедлайнов:

“Draft Common App personal info”

“Write personal statement v1”

“Create resume”

“Request recommendations”

“Finalize university list”

каждая задача:

title, description, due_date, status, priority

зависит от шага (roadmap_stage)

3.5 Documents + Versions

типы: essay, resume, recommendation_notes, other

хранение:

текстовые документы — в БД (для MVP)

файлы (pdf/docx) — позже (или S3)

версии:

version_number

content

created_at

created_by (user/ai)

3.6 AI Assistant (MVP scope)

ИИ умеет:

объяснять следующий шаг на основе прогресса

генерировать черновик эссе/резюме на основе профиля

предлагать улучшения (rewrite, structure, feedback)

генерировать “Common App field drafts” (черновики по полям)
ИИ НЕ делает:

авто-подачу/логин в Common App

“гарантии поступления”

выдумывание фактов (в ответах обязателен режим: “использую только данные профиля/документа”)

4) Common App в MVP (как правильно)

Сделать страницу Common App Draft Center:

список секций/полей (Personal info, Activities, Honors, Education, Writing)

на каждое поле:

“Что требуется” (инструкция)

“Твои данные из профиля” (подставлено)

кнопка “Сгенерировать черновик”

кнопка “Проверить согласованность” (находит противоречия: даты/цифры/названия)

“Copy” (пользователь копирует вручную)

5) Модель данных (минимум)

User(id, email, password_hash, role, created_at)

StudentProfile(user_id, … поля профиля …)

University(id, name, country, state, website_url) — можно минимум

Application(id, user_id, university_id nullable, university_name, deadline_date, status)

RoadmapStage(id, code, title, order)

Task(id, user_id, application_id nullable, roadmap_stage_id, title, description, due_date, status, priority)

Document(id, user_id, application_id nullable, type, title)

DocumentVersion(id, document_id, version_number, content, created_by, created_at)

AIInteraction(id, user_id, context_type, context_id, prompt, response, created_at) — для логов (минимум)

6) API endpoints (пример для MVP)

Auth:

POST /auth/register

POST /auth/login

GET /me

Profile:

GET /profile

PUT /profile

Universities/Applications:

GET /applications

POST /applications (add manual or from university_id)

PUT /applications/:id (deadline/status)

Tasks:

GET /tasks?status=&application_id=

POST /tasks (manual)

POST /tasks/generate (генерация из шаблонов + дедлайнов)

PUT /tasks/:id (status/due_date)

Documents:

GET /documents

POST /documents

GET /documents/:id

POST /documents/:id/versions

GET /documents/:id/versions

AI:

POST /ai/next-step

POST /ai/document-draft (essay/resume)

POST /ai/document-feedback

POST /ai/commonapp-draft

7) Порядок разработки (чтобы Codex не распылялся)

Auth + базовая структура проекта

StudentProfile CRUD

Applications CRUD (manual add) + deadline

Roadmap stages (seed) + Tasks CRUD

Generate tasks from templates (простые правила)

Documents + Versions

AI endpoints (stub → потом подключение провайдера)

UI страницы: Onboarding → Dashboard → Applications → Tasks → Documents → Common App Draft

8) Definition of Done (критерии готовности MVP)

новый пользователь за 10–15 минут:

заполняет профиль

добавляет 3 университета

получает задачи и дедлайны

создаёт эссе и 2 версии

получает AI draft для 1 Common App поля

все данные сохраняются и открываются после перезахода

базовая защита: пользователь не видит чужие данные

логируются AI interactions