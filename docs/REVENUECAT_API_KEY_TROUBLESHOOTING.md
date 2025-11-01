# 🔑 Устранение ошибки "Invalid API Key"

## ❌ Ошибка

```
PurchasesError(code=InvalidCredentialsError, 
underlyingErrorMessage=Invalid API Key.)
```

## 🔍 Возможные причины

### 1. Неправильный формат ключа

**Android ключи должны начинаться с:**
- Тестовый: `goog_test_...` (для разработки)
- Продакшн: `goog_...` (для release)

**iOS ключи должны начинаться с:**
- Тестовый: `appl_test_...`
- Продакшн: `appl_...`

### 2. Ключ не соответствует проекту/приложению

- Убедитесь, что ключ взят из правильного проекта RevenueCat
- Проверьте, что ключ для правильной платформы (Android/iOS)
- Убедитесь, что Package Name в RevenueCat совпадает с вашим приложением

### 3. Использован неправильный тип ключа

- ❌ НЕ используйте **Secret API Keys**
- ✅ Используйте **Public SDK Keys**

### 4. Ключ устарел или был изменен

- Проверьте в Dashboard, не изменился ли ключ
- Возможно, нужно скопировать ключ заново

---

## ✅ Пошаговое исправление

### Шаг 1: Проверить ключ в RevenueCat Dashboard

1. Зайдите на [https://app.revenuecat.com/](https://app.revenuecat.com/)
2. Выберите ваш проект
3. Перейдите в **Project Settings** → **API Keys**
4. Найдите раздел **"Public SDK Keys"**
5. Убедитесь, что вы смотрите на **правильное приложение**:
   - Android приложение с Package `com.aidkit`
6. Скопируйте ключ заново:
   - **Android Public SDK Key** (для Android)

### Шаг 2: Проверить формат ключа

Android ключ должен выглядеть так:
- Тестовый: `goog_test_XXXXXXXXXXXXXXXXXXXXXX`
- Продакшн: `goog_XXXXXXXXXXXXXXXXXXXXXX`

⚠️ **Если ключ не начинается с `goog_`** — это не правильный ключ!

### Шаг 3: Проверить Package Name

1. В RevenueCat Dashboard → выберите ваше Android приложение
2. Проверьте **Package Name**: должно быть `com.aidkit`
3. В файле `android/app/build.gradle` проверьте:
   ```gradle
   applicationId "com.aidkit"
   ```
4. Убедитесь, что они совпадают!

### Шаг 4: Обновить ключ в коде

1. Откройте `src/shared/lib/subscriptionConfig.ts`
2. Убедитесь, что ключ правильного формата:

```typescript
export const REVENUECAT_API_KEY_ANDROID = __DEV__
  ? 'goog_test_XXXXXXXXXXXXXXXXXXXXXX' // Test key (начинается с goog_test_)
  : 'goog_XXXXXXXXXXXXXXXXXXXXXX'       // Production key (начинается с goog_)
```

3. Сохраните файл
4. Перезапустите Metro bundler: `yarn start --reset-cache`
5. Перезапустите приложение

---

## 🧪 Диагностика

### Проверка 1: Выводим используемый ключ

Добавьте временный лог в `subscription.ts`:

```typescript
async initialize(userId?: string): Promise<void> {
  // ...
  const apiKey = getRevenueCatApiKey()
  console.log('🔑 Using RevenueCat API Key:', apiKey.substring(0, 20) + '...')
  console.log('📱 Platform:', Platform.OS)
  console.log('🔧 Dev mode:', __DEV__)
  // ...
}
```

Запустите приложение и проверьте в консоли:
- Правильный ли ключ используется?
- Правильная ли платформа?
- Правильный ли режим (dev/prod)?

### Проверка 2: Сравнение ключей

1. Скопируйте ключ из RevenueCat Dashboard
2. Скопируйте ключ из `subscriptionConfig.ts`
3. Убедитесь, что они **полностью идентичны** (без лишних пробелов, символов)

---

## 🔄 Типичные ошибки

### Ошибка 1: Ключ без префикса `goog_`

❌ **Неправильно:**
```typescript
'test_IDMKsubhImwaDGeDtPsuIZguwUb'
```

✅ **Правильно:**
```typescript
'goog_test_IDMKsubhImwaDGeDtPsuIZguwUb'
```

### Ошибка 2: Использование Secret Key вместо Public Key

❌ **Неправильно:** Использовать Secret API Key (начинается с `sk_`)

✅ **Правильно:** Использовать Public SDK Key (начинается с `goog_` или `appl_`)

### Ошибка 3: Ключ от другого проекта

Убедитесь, что ключ взят из **правильного проекта** RevenueCat.

---

## 📋 Чек-лист исправления

- [ ] Зашел в RevenueCat Dashboard → Project Settings → API Keys
- [ ] Нашел раздел **Public SDK Keys** (НЕ Secret Keys)
- [ ] Выбрал правильное Android приложение с Package `com.aidkit`
- [ ] Скопировал **Android Public SDK Key**
- [ ] Проверил формат: начинается с `goog_test_` или `goog_`
- [ ] Проверил Package Name в RevenueCat: `com.aidkit`
- [ ] Проверил `applicationId` в `android/app/build.gradle`: `com.aidkit`
- [ ] Обновил ключ в `subscriptionConfig.ts`
- [ ] Сохранил файл
- [ ] Очистил кеш Metro: `yarn start --reset-cache`
- [ ] Полностью перезапустил приложение

---

## 🚀 Если ничего не помогает

1. **Удалите и пересоздайте приложение в RevenueCat:**
   - Удалите Android приложение из проекта
   - Создайте заново с Package `com.aidkit`
   - Скопируйте новый Public SDK Key

2. **Проверьте подключение к интернету:**
   - RevenueCat требует интернет для проверки ключа

3. **Проверьте версию react-native-purchases:**
   ```bash
   yarn list react-native-purchases
   ```
   Должна быть версия 7.0.0 или выше

4. **Очистите полностью:**
   ```bash
   # Очистка кеша Metro
   yarn start --reset-cache
   
   # Очистка Android build
   cd android && ./gradlew clean && cd ..
   
   # Пересборка
   yarn android
   ```

---

**После исправления** ошибка должна исчезнуть, и RevenueCat инициализируется успешно! ✅

