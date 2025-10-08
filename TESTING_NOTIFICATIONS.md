# 🧪 Тестирование уведомлений

Несколько способов протестировать систему уведомлений в приложении.

## Способ 1: Использование тестовых функций в консоли

### Подготовка
1. Откройте React Native Debugger или Metro Bundler
2. Откройте консоль разработчика

### Базовые тесты

```javascript
// Импортируем тестовые функции (в консоли или коде)
import * as TestHelpers from '@/shared/lib/notificationTestHelpers'

// 1. Проверка разрешений
await TestHelpers.checkNotificationPermission()

// 2. Мгновенное уведомление (придёт сразу)
await TestHelpers.sendInstantNotification()

// 3. Тестовое уведомление через 5 секунд
// Замените 'your-kit-id' на реальный ID аптечки
await TestHelpers.sendTestNotification('your-kit-id', 5)

// 4. Критическое уведомление через 10 секунд
await TestHelpers.sendTestExpiredNotification('your-kit-id', 10)

// 5. Посмотреть все запланированные уведомления
await TestHelpers.listScheduledNotifications()

// 6. Отменить все тестовые уведомления
await TestHelpers.cancelAllTestNotifications()
```

## Способ 2: Создать лекарство с коротким сроком годности

### Через приложение:

1. **Создайте тестовую аптечку** (если нет)
   - Название: "Тест 🧪"
   - Цвет: любой

2. **Создайте тестовое лекарство**
   - Название: "Тестовый аспирин"
   - Количество: 10 шт
   - Срок годности: **установите на завтра или послезавтра**

3. **Результат:**
   - Сразу запланируются уведомления за 1 день, 2 дня и т.д.
   - Проверьте через несколько минут - должно прийти уведомление

### Через код (для быстрого теста):

```typescript
import { scheduleMedicineExpiryNotifications } from '@/shared/lib'

// Создать тестовые данные (истекает через 2 дня)
const testData = TestHelpers.createTestMedicineData(
  'Тестовое лекарство',
  'your-kit-id',
  2  // истекает через 2 дня
)

// Запланировать уведомления
await scheduleMedicineExpiryNotifications(
  testData.medicine as Medicine,
  testData.stock as MedicineStock
)
```

## Способ 3: Проверка в настройках системы

### Android:
1. Откройте **Настройки** → **Приложения** → **AidKit** → **Уведомления**
2. Вы должны увидеть:
   - "Общие уведомления"
   - Каналы для каждой аптечки (например, "Домашняя", "Автомобильная")
3. Проверьте настройки каждого канала

### iOS:
1. Откройте **Настройки** → **Уведомления** → **AidKit**
2. Убедитесь, что уведомления разрешены
3. Проверьте настройки звука и оповещений

## Способ 4: Быстрый тест с помощью временной кнопки

Добавьте временную кнопку в любой экран (например, HomeScreen):

```typescript
import { sendTestNotification, checkNotificationPermission } from '@/shared/lib'
import { Button } from '@/shared/ui'

// В компоненте:
const handleTestNotification = async () => {
  // Проверяем разрешение
  const hasPermission = await checkNotificationPermission()
  
  if (!hasPermission) {
    const granted = await notificationService.requestPermission()
    if (!granted) {
      Alert.alert('Ошибка', 'Разрешение на уведомления не получено')
      return
    }
  }
  
  // Отправляем тест (замените на реальный kitId)
  const kitId = 'your-first-kit-id'
  await sendTestNotification(kitId, 5)
  
  Alert.alert('✅ Успех', 'Уведомление придёт через 5 секунд')
}

// В JSX:
<Button
  title="🧪 Тест уведомлений"
  onPress={handleTestNotification}
/>
```

## Проверка работы каналов

### Тест 1: Разные аптечки
1. Создайте две аптечки: "Дом" и "Машина"
2. Создайте лекарства в обеих (с коротким сроком)
3. В настройках Android отключите канал "Машина"
4. Результат: уведомления от "Дом" придут, от "Машина" - нет

### Тест 2: Разные звуки
1. Создайте аптечку "Важная"
2. В настройках Android установите громкий звук для этого канала
3. Создайте лекарство с коротким сроком
4. Результат: уведомление придёт с выбранным звуком

## Отладка проблем

### Уведомления не приходят?

```javascript
// 1. Проверьте разрешения
await checkNotificationPermission()

// 2. Проверьте список запланированных уведомлений
await listScheduledNotifications()

// 3. Проверьте каналы (Android only)
// В настройках системы должны быть видны все аптечки

// 4. Проверьте логи
// В консоли должны быть сообщения о создании уведомлений
```

### Очистка всех уведомлений

```javascript
import { notificationService } from '@/shared/lib'

// Отменить все уведомления
await notificationService.cancelAllNotifications()

// Или только тестовые
await cancelAllTestNotifications()
```

## Примеры команд для тестирования

```javascript
// Полный тестовый сценарий
const kitId = 'ваш-kit-id' // Замените на реальный

// 1. Проверка
await checkNotificationPermission()

// 2. Мгновенное
await sendInstantNotification('Тест 1', 'Мгновенное уведомление работает!')

// 3. Через 10 секунд
await sendTestNotification(kitId, 10)

// 4. Критическое через 15 секунд
await sendTestExpiredNotification(kitId, 15)

// 5. Список
await listScheduledNotifications()

// 6. Через минуту проверьте - должно прийти 2 уведомления
```

## Советы

1. **Начните с мгновенного уведомления** - так вы сразу поймёте, работают ли уведомления вообще
2. **Используйте короткие задержки** (5-10 секунд) для быстрого тестирования
3. **Проверяйте консоль** - все действия логируются
4. **Тестируйте на реальном устройстве** - эмулятор может работать по-другому
5. **Используйте разные аптечки** - чтобы проверить работу каналов

## Примечания

- На iOS критические уведомления требуют специальных разрешений
- На Android 13+ нужно явное разрешение на уведомления
- Уведомления в прошлом автоматически пропускаются
- Все тестовые функции работают асинхронно (используйте `await`)

