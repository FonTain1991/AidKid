# 🔑 Формат тестового API ключа RevenueCat

## ❓ Проблема

В Dashboard в разделе **"Test configuration"** показывается ключ в формате:
```
test_IDMKsubhImwaDGeDtPsuIZguwUb
```

Но при использовании в коде возникает ошибка:
```
Invalid API Key
```

## ✅ Решение

### Для Android SDK нужен ключ с префиксом `goog_test_`

RevenueCat Dashboard показывает в разделе "Test configuration" только **часть ключа**. 

**Для Android приложения нужно использовать полный ключ**, который находится в другом месте Dashboard:

### Где найти правильный ключ:

1. **Правильное место**: 
   - **Project Settings** → **API Keys** → **Public SDK Keys**
   - Найдите раздел **"Android Public SDK Key"**
   - Там будет ключ, который начинается с `goog_test_` (для теста) или `goog_` (для production)

2. **Неправильное место**:
   - ❌ **Test configuration** → показывает только `test_XXXXX` (это НЕ полный ключ для SDK)

### Формат ключей:

**Android тестовый ключ должен выглядеть так:**
```
goog_test_XXXXXXXXXXXXXXXXXXXXXX
```

**Android production ключ должен выглядеть так:**
```
goog_XXXXXXXXXXXXXXXXXXXXXX
```

### Если Dashboard показывает только `test_IDMKsubhImwaDGeDtPsuIZguwUb`:

1. **Попробуйте добавить префикс вручную:**
   ```typescript
   'goog_test_IDMKsubhImwaDGeDtPsuIZguwUb'
   ```

2. **Или найдите полный ключ в разделе API Keys:**
   - Project Settings → API Keys
   - Public SDK Keys → Android Public SDK Key
   - Скопируйте полный ключ оттуда

---

## 📍 Где находятся ключи в Dashboard

### ✅ Правильное место (Public SDK Keys):

1. RevenueCat Dashboard
2. **Project Settings** (иконка шестеренки)
3. **API Keys** (вкладка)
4. Раздел **"Public SDK Keys"**
5. **Android Public SDK Key** ← ВОТ ОН!

Этот ключ будет в формате:
- Тест: `goog_test_XXXXXXXXXXXXXXXXXXXXXX`
- Продакшн: `goog_XXXXXXXXXXXXXXXXXXXXXX`

### ❌ Неправильное место (Test configuration):

- Test configuration → показывает только `test_XXXXX`
- Это НЕ полный ключ для SDK
- Используется для других целей (sandbox тестирование)

---

## 🔧 Что делать

### Вариант 1: Использовать ключ из Public SDK Keys

1. Зайдите в **Project Settings** → **API Keys** → **Public SDK Keys**
2. Найдите **Android Public SDK Key**
3. Скопируйте полный ключ (он уже будет с префиксом `goog_test_` или `goog_`)
4. Вставьте в `subscriptionConfig.ts`

### Вариант 2: Добавить префикс к тестовому ключу

Если Dashboard показывает только `test_IDMKsubhImwaDGeDtPsuIZguwUb`:

```typescript
export const REVENUECAT_API_KEY_ANDROID = __DEV__
  ? 'goog_test_IDMKsubhImwaDGeDtPsuIZguwUb' // Добавляем префикс goog_
  : 'goog_DFeJALEUMGsjNLqwHCnVpkFQxoJ'
```

---

## ⚠️ Важно

- **Public SDK Keys** = правильный ключ для SDK (с префиксом `goog_`)
- **Test configuration key** = только часть ключа для sandbox (без префикса)
- Для React Native SDK нужен ключ из **Public SDK Keys**, а не из Test configuration

---

## 🧪 Проверка

После обновления ключа, проверьте логи в консоли:

```
🔑 RevenueCat Configuration:
  Platform: android
  Dev mode: true
  API Key (first 20 chars): goog_test_IDMKsubhI...
  API Key starts with goog_: true  ← Должно быть true!
  API Key length: 41
```

Если `API Key starts with goog_` = `false`, значит ключ неправильного формата.

---

**Используйте ключ из раздела Public SDK Keys, а не из Test configuration!** ✅

