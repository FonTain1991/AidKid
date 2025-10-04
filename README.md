# AidKit 🏥

Мобильное приложение для управления домашними аптечками, построенное на React Native с использованием архитектуры Feature-Sliced Design (FSD).

## 📱 О приложении

AidKit - это удобное приложение для организации и отслеживания лекарств в домашних аптечках. Позволяет создавать аптечки, добавлять лекарства, отслеживать запасы и сроки годности.

### ✨ Основные возможности

- **Управление аптечками** - создание, редактирование и удаление аптечек
- **Управление лекарствами** - добавление лекарств с подробной информацией
- **Отслеживание запасов** - контроль количества и сроков годности
- **История использования** - ведение журнала приема лекарств
- **Темная/светлая тема** - переключение между темами
- **Офлайн работа** - все данные хранятся локально в SQLite

## 🏗️ Архитектура

Проект построен с использованием **Feature-Sliced Design (FSD)**:

```
src/
├── app/           # Инициализация приложения, провайдеры, роутинг
├── pages/         # Страницы приложения (Home, Kit, More, Splash)
├── widgets/       # Крупные UI блоки
├── features/      # Бизнес-логика приложения
│   ├── home/      # Главный экран с аптечками
│   ├── kit-list/  # Управление списком аптечек
│   ├── kit-form/  # Форма создания/редактирования аптечек
│   ├── quick-create/ # Быстрое создание
│   └── medicine/  # Управление лекарствами
├── entities/      # Бизнес-сущности
│   ├── kit/       # Аптечки
│   └── medicine/  # Лекарства
└── shared/        # Переиспользуемые модули
    ├── ui/        # UI компоненты
    ├── lib/       # Утилиты
    ├── hooks/     # Кастомные хуки
    └── config/    # Конфигурация
```

## 🗄️ База данных

Используется **SQLite** с следующими таблицами:

### Аптечки (`medicine_kits`)
- `id`, `name`, `description`, `color`, `parent_id`
- Поддержка иерархии через `parent_id`

### Лекарства (`medicines`)
- `id`, `name`, `description`, `manufacturer`, `dosage`
- `form`, `prescription_required`, `kit_id`

### Запасы (`medicine_stock`)
- `id`, `medicine_id`, `quantity`, `unit`
- `expiry_date`, `batch_number`, `purchase_date`, `purchase_price`

### Использование (`medicine_usage`)
- `id`, `medicine_id`, `quantity_used`, `usage_date`, `notes`

### Справочники
- `medicine_forms` - формы выпуска (таблетки, капли и т.д.)
- `measurement_units` - единицы измерения (шт, мл, г и т.д.)

## 🚀 Быстрый старт

### Установка зависимостей

```sh
# Используя Yarn (рекомендуется)
yarn install

# Или используя npm
npm install
```

### Запуск Metro

```sh
# Используя Yarn
yarn start

# Или используя npm
npm start
```

### Запуск приложения

#### Android

```sh
yarn android
# или
npm run android
```

#### iOS

Сначала установите CocoaPods зависимости:

```sh
cd ios && pod install && cd ..
```

Затем запустите:

```sh
yarn ios
# или
npm run ios
```

## 🛠️ Технологии

- **React Native** - мобильная разработка
- **TypeScript** - типизация
- **React Navigation** - навигация
- **SQLite** - локальная база данных
- **React Native Bottom Sheet** - модальные окна
- **React Native Safe Area Context** - безопасные зоны
- **Feature-Sliced Design** - архитектура

## 📦 Основные зависимости

```json
{
  "@react-navigation/native": "^6.x",
  "@react-navigation/bottom-tabs": "^6.x",
  "@react-navigation/native-stack": "^6.x",
  "@gorhom/bottom-sheet": "^4.x",
  "react-native-sqlite-storage": "^6.x",
  "react-native-safe-area-context": "^4.x"
}
```

## 🎨 UI Компоненты

### Переиспользуемые компоненты
- **Button** - кнопки
- **TextInput** - поля ввода с анимацией лейблов
- **List** - списки с BottomSheet
- **KitCard** - карточки аптечек
- **FormItemWrapper** - обертка для элементов форм
- **BottomSheet** - модальные окна
- **FAB** - плавающая кнопка действий

### Стилизация
- Использование темы с поддержкой светлой/темной темы
- Кастомные хуки для стилей (`useListStyles`, `useTextInputStyles` и т.д.)
- Консистентные отступы, размеры шрифтов и радиусы

## 🔧 Разработка

### Структура компонентов

Каждый UI компонент имеет следующую структуру:
```
ComponentName/
├── ComponentName.tsx     # Основной компонент
├── useComponentStyles.ts # Хуки для стилей
└── index.ts             # Экспорты
```

### Работа с базой данных

```typescript
import { databaseService } from '@/shared/lib/database'
import { medicineService } from '@/entities/medicine'

// Создание аптечки
const kit = await databaseService.createKit(kitData)

// Создание лекарства
const medicine = await medicineService.createMedicine(medicineData)

// Использование лекарства
await medicineService.useMedicine(medicineId, quantity)
```

## 📱 Экраны

1. **Splash** - экран загрузки
2. **Home** - главный экран со списком аптечек
3. **Kit** - создание/редактирование аптечек
4. **More** - дополнительные настройки и тема

## 🎯 Планы развития

- [ ] Уведомления о сроке годности
- [ ] Сканирование штрих-кодов лекарств
- [ ] Экспорт/импорт данных
- [ ] Статистика использования
- [ ] Резервное копирование в облако
- [ ] Множественные аптечки с иерархией

## 📄 Лицензия

MIT License

## 🤝 Вклад в проект

Приветствуются любые предложения и улучшения! Создавайте issues и pull requests.

---

**AidKit** - сделайте управление домашней аптечкой простым и удобным! 🏥✨