# ✅ MVP → Production Roadmap для AI-чат-платформы

---

## 🟩 1. ФУНКЦИОНАЛ (Core Features)

| Что                        | MVP                  | Прод                              |
| -------------------------- | -------------------- | --------------------------------- |
| 📥 Получение сообщений     | ✅                   | ✅                                |
| 📤 Отправка AI / оператора | ✅                   | ✅                                |
| 🔁 Переключение режимов    | ✅                   | ✅                                |
| 🧠 AI-интеграция           | ✅                   | ✅                                |
| 🛡 Guardrails               | ✅ простые           | 🔧 Расширить (цензура, fallback)  |
| 💬 История сообщений       | ✅ в памяти / сессии | 🗃 Вынести в базу (Redis/Postgres) |
| 📚 KB-интеграция (RAG)     | ⚙️ начато            | 📌 Централизовать и кэшировать    |

---

## 🟨 2. UX / UI / FE (Удобство и интерфейс)

| Что                       | MVP        | Прод                       |
| ------------------------- | ---------- | -------------------------- |
| 🧭 Выбор чата             | ✅         | ✅                         |
| 💬 Просмотр сообщений     | ✅         | ✅                         |
| 🔔 Уведомления о новых    | 🔴 нет     | ✅ (звук, таб, UI-значок)  |
| ⏳ Loader при подключении | 🔴 нет     | ✅ добавить                |
| 🕐 Таймстемпы и статусы   | 🔴 базовые | ✅ "прочитано", сортировка |
| 👀 Поддержка тем          | ❌         | 💅 Nice-to-have            |

---

## 🟨 3. Архитектура и кодовая база

| Что                            | MVP                          | Прод                     |
| ------------------------------ | ---------------------------- | ------------------------ |
| 📦 Централизация логики        | ✅ `handleIncomingMessage()` | ✅                       |
| 🌐 Унифицированные WebSocket’ы | ✅                           | ✅                       |
| 🧩 Model Context (MCP)         | ❌ вручную                   | ✅ `buildModelContext()` |
| 🔄 Очистка стейтов             | ⚠️ частично                  | ✅ middleware/hooks      |
| ✨ Типизация (TS)              | ✅                           | ✅ (any check, lint)     |

---

## 🟥 4. Надёжность / Безопасность / Инфра

| Что                         | MVP            | Прод                         |
| --------------------------- | -------------- | ---------------------------- |
| 🔐 Auth операторов          | ❌             | ✅ JWT / session cookies     |
| 💾 База данных              | ❌ / минимум   | ✅ messages, users, chatMeta |
| 🚥 Rate limiting            | ❌             | ✅ Защита от спама           |
| 🧪 Логирование и трекинг    | ⚠️ console.log | ✅ Winston / Sentry          |
| 🔧 Healthcheck / monitoring | ❌             | ✅ `/health`, Prometheus     |
| 📤 Отправка ошибок в логи   | ❌             | ✅ Sentry / Logtail          |

---

## 🟦 5. Масштабирование / DevOps

| Что                             | MVP         | Прод                        |
| ------------------------------- | ----------- | --------------------------- |
| 🔄 Авто-reconnect WebSocket     | ❌          | ✅                          |
| 📦 Docker                       | ❌          | ✅ фронт + бэк              |
| 🌍 CI/CD                        | ❌          | ✅ GitHub Actions / Railway |
| 🔃 Перезапуск при краше         | ❌          | ✅ pm2 / Docker restart     |
| 🧰 Dev / Prod `.env` separation | ⚠️ частично | ✅ `.env.dev` / `.env.prod` |

---

## 🟨 6. AI-интеграция (умнее и безопаснее)

| Что                          | MVP | Прод                                 |
| ---------------------------- | --- | ------------------------------------ |
| 🔌 Один промпт               | ✅  | ✅                                   |
| 🧱 Модельный контекст (MCP)  | ❌  | ✅ `buildModelContext()`             |
| 🧠 RAG-пайплайн              | ⚙️  | ✅ поиск → injection → fallback      |
| 🧩 Function calling          | ❌  | ✅ для триггеров типа "узнай статус" |
| 🧠 Промпт-блоки из базы / UI | ❌  | ✅ редактируемые сценарии            |

---

2025-07-03
