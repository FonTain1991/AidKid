# Feature-Sliced Design (FSD) Architecture

Проект переписан на архитектуру Feature-Sliced Design для лучшей организации кода.

## Структура проекта

```
src/
├── app/                    # Инициализация приложения
│   ├── navigation/         # Настройка роутинга
│   └── providers/          # Провайдеры (контексты, темы)
├── screens/               # Экраны приложения
│   ├── home/              # Главный экран
│   ├── add-kit/           # Экран создания аптечки
│   └── edit-kit/          # Экран редактирования аптечки
├── widgets/               # Крупные UI блоки (пока не используются)
├── features/              # Бизнес-функции
│   ├── create-kit/        # Создание аптечки
│   └── edit-kit/          # Редактирование аптечки
├── entities/              # Бизнес-сущности
│   └── kit/               # Аптечка
│       ├── model/         # Типы, стор, хуки
│       └── api/           # API слой
└── shared/                # Переиспользуемый код
    ├── ui/                # UI компоненты
    ├── lib/               # Утилиты, хуки, валидация
    └── config/            # Конфигурация
```

## Слои архитектуры

### 1. **App** - Инициализация приложения
- Настройка роутинга
- Провайдеры (контексты, темы)
- Глобальная конфигурация

### 2. **Screens** - Экраны приложения
- Композиция features и widgets
- Обработка навигации
- Управление состоянием экрана

### 3. **Widgets** - Крупные UI блоки
- Сложные компоненты из нескольких features
- Пока не используются в проекте

### 4. **Features** - Бизнес-функции
- Отдельные пользовательские сценарии
- Содержат UI и логику
- Могут использовать entities

### 5. **Entities** - Бизнес-сущности
- Основные бизнес-объекты
- API слой
- Управление состоянием сущности

### 6. **Shared** - Переиспользуемый код
- UI компоненты
- Утилиты
- Конфигурация
- Хуки

## Правила импортов

- **Слои могут импортировать только из слоев ниже себя**
- **Используются алиасы для удобства**: `@/shared`, `@/entities`, `@/features`, `@/screens`, `@/app`

### Примеры разрешенных импортов:

```typescript
// ✅ Pages могут импортировать из features, entities, shared
import { CreateKitForm } from '@/features/create-kit'
import { useKitStore } from '@/entities/kit/model/store'
import { Button } from '@/shared/ui'

// ✅ Features могут импортировать из entities, shared
import { MedicineKit } from '@/entities/kit/model/types'
import { validateKitName } from '@/shared/lib/validation'

// ✅ Entities могут импортировать только из shared
import { databaseService } from '@/shared/lib/database'
```

### Запрещенные импорты:

```typescript
// ❌ Shared не может импортировать из других слоев
import { MedicineKit } from '@/entities/kit/model/types'

// ❌ Entities не может импортировать из features
import { CreateKitForm } from '@/features/create-kit'

// ❌ Features не может импортировать из pages
import { HomePage } from '@/pages/home'
```

## Преимущества FSD

1. **Масштабируемость** - Легко добавлять новые фичи
2. **Переиспользование** - Компоненты и логика легко переиспользуются
3. **Тестируемость** - Каждый слой можно тестировать изолированно
4. **Читаемость** - Четкая структура и правила импортов
5. **Командная работа** - Разные разработчики могут работать над разными слоями

## Миграция

Старая структура была полностью переписана:
- `components/` → `shared/ui/`
- `screens/` → `pages/`
- `stores/` → `entities/*/model/store`
- `database/` → `shared/lib/database`
- `types/` → `entities/*/model/types` и `shared/lib/`

Все импорты обновлены для использования алиасов.
