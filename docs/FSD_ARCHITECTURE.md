# Feature-Sliced Design (FSD) Architecture

Проект переписан на архитектуру Feature-Sliced Design для лучшей организации кода.

## Структура проекта

```
src/
├── app/                    # Инициализация приложения
│   ├── navigation/         # Настройка роутинга (Stack + Bottom Tabs)
│   └── providers/          # Провайдеры (Database, Theme, KitList, RouteParams)
├── screens/               # Экраны приложения (23 экрана)
│   ├── Home/              # Главный экран с поиском и предупреждениями
│   ├── Splash/            # Экран загрузки
│   ├── Intake/            # Центр управления приемом
│   ├── More/              # Настройки и дополнительные функции
│   ├── kit/               # Создание/редактирование аптечки
│   ├── KitDetails/        # Детали аптечки
│   ├── Medicine/          # Создание/редактирование лекарства
│   ├── Today/             # Приемы на сегодня
│   ├── QuickIntake/       # Быстрый прием
│   ├── History/           # История приема
│   ├── Statistics/        # Статистика приема
│   ├── Reminders/         # Список напоминаний
│   ├── AddReminder/       # Добавление напоминания
│   ├── ExpiringMedicines/ # Истекающие лекарства
│   ├── LowStockMedicines/ # Низкий запас
│   ├── NotificationSettings/ # Настройки уведомлений
│   ├── FamilyMembers/ # Управление членами семьи
│   ├── FamilyAccess/ # Доступ семьи
│   ├── BarcodeScanner/ # Сканирование штрих-кодов
│   ├── Backup/ # Резервное копирование
│   ├── ShoppingList/ # Список покупок
│   ├── AddShoppingItem/ # Добавление в список покупок
│   └── Onboarding/ # Первый запуск
├── widgets/               # Крупные UI блоки
│   └── kit-form/          # Форма аптечки
├── features/              # Бизнес-функции
│   ├── home/              # Главный экран с аптечками
│   ├── kit-list/          # Управление списком аптечек
│   ├── kit-form/          # Форма создания/редактирования аптечек
│   ├── create-kit/        # Создание аптечки
│   ├── edit-kit/          # Редактирование аптечки
│   ├── medicine-form/     # Форма лекарства
│   ├── quick-create/      # Быстрое создание
│   └── more/              # Функции экрана "Еще"
├── entities/              # Бизнес-сущности
│   ├── kit/               # Аптечка
│   │   ├── model/         # Типы, хуки
│   │   └── api/           # API слой
│   └── medicine/          # Лекарство
│       ├── model/         # Типы, хуки
│       └── api/           # API слой
└── shared/                # Переиспользуемый код
    ├── ui/                # 20+ UI компонентов
    ├── lib/               # Database, Notifications, Helpers, Validation
    ├── hooks/             # 10+ кастомных хуков
    ├── config/            # Константы, настройки, база данных
    └── assets/            # Шрифты, SVG
```

## Слои архитектуры

### 1. **App** - Инициализация приложения ✅
- Настройка роутинга (Stack + Bottom Tabs)
- Провайдеры: DatabaseProvider, ThemeProvider, KitListProvider, RouteParams
- Глобальная конфигурация и навигация

### 2. **Screens** - Экраны приложения ✅
- 23 полнофункциональных экрана
- Композиция features и UI компонентов
- Обработка навигации и состояния
- Единообразный дизайн

### 3. **Widgets** - Крупные UI блоки ✅
- kit-form - форма для создания/редактирования аптечки
- Композиция из нескольких features

### 4. **Features** - Бизнес-функции ✅
- home - главный экран с аптечками
- kit-list, kit-form, create-kit, edit-kit - управление аптечками
- medicine-form - управление лекарствами
- quick-create - быстрое создание
- more - дополнительные функции

### 5. **Entities** - Бизнес-сущности ✅
- **kit** - аптечки (типы, API)
- **medicine** - лекарства (типы, API)
- Слой работы с данными

### 6. **Shared** - Переиспользуемый код ✅
- **ui/** - 20+ UI компонентов (Button, TextInput, KitCard, etc.)
- **lib/** - Database, Notifications, Helpers, Validation
- **hooks/** - useEvent, useBottomSheet, useNotifications и др.
- **config/** - Константы, настройки БД, Android конфиг
- **assets/** - Шрифты Roboto, SVG иконки

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
