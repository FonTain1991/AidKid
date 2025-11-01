# 🎯 Настройка RevenueCat Dashboard

## ✅ Рекомендуемая версия API: **v2**

**Используйте API версии v2** - это современная версия с улучшенными возможностями:
- ✅ Более быстрая обработка подписок
- ✅ Расширенная аналитика
- ✅ Лучшая интеграция с Google Play и App Store
- ✅ Поддержка новых функций RevenueCat

API v1 устарел и не рекомендуется к использованию.

---

## 📝 Пошаговая настройка

### Шаг 1: Регистрация и создание проекта

1. Зайдите на [https://app.revenuecat.com/](https://app.revenuecat.com/)
2. Зарегистрируйтесь (если еще не зарегистрированы)
   - Можно через GitHub, Google или email
3. Создайте новый проект:
   - Нажмите **"Create a project"** или **"New project"**
   - Название проекта: `AidKit`
   - Описание: `Мобильное приложение для управления аптечкой`

### Шаг 2: Добавление приложения

#### 2.1 Android приложение

1. В проекте нажмите **"Add app"** или **"New app"**
2. Выберите **Android**
3. Заполните данные:
   - **App name**: `AidKit` (или как вам нужно)
   - **Bundle ID / Package Name**: `com.aidkit` (должен совпадать с `android/app/build.gradle`)
   - **Google Play Store**: Выберите или создайте связь с Google Play Console

#### 2.2 iOS приложение (опционально, если планируется)

1. Добавьте еще одно приложение, выберите **iOS**
2. Заполните:
   - **App name**: `AidKit`
   - **Bundle ID**: `com.aidkit` (должен совпадать с Bundle Identifier в Xcode)

### Шаг 3: Получение API ключей

1. После добавления приложений, перейдите в **Project Settings** → **API Keys**
2. Вы увидите два типа ключей для каждого приложения:
   - **Public SDK Keys** (для клиентского приложения) ✅ **ИХ И НУЖНО ИСПОЛЬЗОВАТЬ**
   - **Secret API Keys** (для серверной части - не нужны для React Native)

#### Для Android:
- Найдите **"Android Public SDK Key"**
- Скопируйте ключ (начинается с `goog_`)

#### Для iOS (если есть):
- Найдите **"iOS Public SDK Key"**
- Скопируйте ключ (начинается с `appl_`)

⚠️ **Важно**: 
- **Public SDK Keys** - безопасно использовать в приложении
- **Secret API Keys** - НИКОГДА не используйте в мобильном приложении, только для серверной части

### Шаг 4: Настройка Entitlements

1. Перейдите в **Project Settings** → **Entitlements**
2. Нажмите **"Create entitlement"** или **"Add entitlement"**
3. Создайте entitlement:
   - **Identifier**: `premium` (именно это используется в коде)
   - **Display name**: `Premium Subscription`
   - **Description**: `Премиум подписка с неограниченными возможностями`
4. Нажмите **"Save"**

### Шаг 5: Настройка Products в Google Play Console

**Сначала нужно настроить подписки в Google Play Console**, затем привязать их в RevenueCat.

#### 5.1 Создание подписок в Google Play Console

1. Зайдите в [Google Play Console](https://play.google.com/console/)
2. Выберите ваше приложение
3. Перейдите в **Монетизация** → **Продукты** → **Подписки**
4. Создайте первую подписку:
   - Нажмите **"Создать подписку"**
   - **Product ID**: `premium_monthly`
   - **Название**: `Премиум подписка (месяц)`
   - **Описание**: `Неограниченное количество аптечек и лекарств, облачное резервное копирование и другие премиум функции`
   - **Цена**: `99 ₽` (или ваша цена)
   - **Период подписки**: `1 месяц`
   - Нажмите **"Сохранить"**
5. Создайте вторую подписку:
   - **Product ID**: `premium_yearly`
   - **Название**: `Премиум подписка (год)`
   - **Описание**: `Годовая подписка. Экономия до 40% по сравнению с ежемесячной подпиской`
   - **Цена**: `699 ₽` (или ваша цена)
   - **Период подписки**: `1 год`
   - Нажмите **"Сохранить"**

#### 5.2 Привязка подписок к RevenueCat

1. Вернитесь в RevenueCat Dashboard
2. Перейдите в **Products** (в левом меню проекта)
3. Нажмите **"Add Product"** или **"Attach product"**
4. Выберите ваше Android приложение
5. Найдите подписки из Google Play:
   - `premium_monthly`
   - `premium_yearly`
6. Привяжите каждую подписку к entitlement `premium`:
   - Выберите подписку
   - В разделе **"Entitlements"** выберите `premium`
   - Нажмите **"Save"**

### Шаг 6: Настройка Offerings

1. Перейдите в **Offerings** (в левом меню проекта)
2. Нажмите **"Create Offering"** или используйте существующий `default`
3. Название: `default` (или оставьте как есть)
4. Добавьте packages (планы подписки):
   - Нажмите **"Add Package"**
   - **Package Identifier**: `$rc_monthly` (для ежемесячной) или `$rc_annual` (для годовой)
   - **Product**: Выберите `premium_monthly` или `premium_yearly`
   - Повторите для второй подписки
5. Нажмите **"Save"**

### Шаг 7: Обновление кода

1. Откройте `src/shared/lib/subscriptionConfig.ts`
2. Замените тестовые ключи на реальные:

```typescript
// Для разработки (тестовые ключи)
export const REVENUECAT_API_KEY_ANDROID = __DEV__
  ? 'goog_YOUR_REAL_TEST_KEY_HERE' // Вставьте Test key
  : 'goog_YOUR_REAL_PRODUCTION_KEY_HERE' // Вставьте Production key

export const REVENUECAT_API_KEY_IOS = __DEV__
  ? 'appl_YOUR_REAL_TEST_KEY_HERE'
  : 'appl_YOUR_REAL_PRODUCTION_KEY_HERE'
```

### Шаг 8: Тестирование

1. **Создайте тестовый аккаунт в Google Play Console**:
   - Google Play Console → **Настройки** → **Управление аккаунтом** → **Тестовые аккаунты**
   - Добавьте email вашего тестового Google аккаунта

2. **Установите приложение на тестовое устройство**

3. **Войдите в Google Play с тестовым аккаунтом**

4. **Проверьте покупки**:
   - Откройте экран подписки в приложении
   - Попробуйте купить подписку (деньги не будут списаны)

---

## 🔑 Где найти API ключи в Dashboard

### Способ 1: Через Project Settings
1. **Dashboard** → **Project Settings** (иконка шестеренки слева вверху)
2. **API Keys** (вкладка)
3. Найдите **"Public SDK Keys"**
4. Скопируйте нужный ключ:
   - `Android Public SDK Key` → для Android
   - `iOS Public SDK Key` → для iOS

### Способ 2: Через App Settings
1. Выберите ваше приложение в списке
2. **App Settings** → **API Keys**
3. Скопируйте **Public SDK Key**

---

## 📋 Чек-лист настройки

### RevenueCat Dashboard:
- [ ] Создан проект
- [ ] Добавлено Android приложение (Package: `com.aidkit`)
- [ ] Добавлено iOS приложение (если нужно, Bundle: `com.aidkit`)
- [ ] Скопированы Public SDK Keys для Android и iOS
- [ ] Создан entitlement `premium`
- [ ] Создано Offering `default`

### Google Play Console:
- [ ] Активирована учетная запись продавца
- [ ] Создана подписка `premium_monthly` (99₽/месяц)
- [ ] Создана подписка `premium_yearly` (699₽/год)
- [ ] Подписки привязаны к RevenueCat
- [ ] Добавлены тестовые аккаунты

### Код:
- [ ] Обновлен `subscriptionConfig.ts` с реальными API ключами
- [ ] Проверена работа инициализации
- [ ] Протестированы покупки на тестовых аккаунтах

---

## ⚠️ Важные моменты

### Test vs Production ключи

**Public SDK Keys** бывают двух типов:

1. **Test Keys** (для разработки):
   - Работают с тестовыми покупками
   - Не списывают реальные деньги
   - Начинаются с `goog_test_` (Android) или `appl_test_` (iOS)

2. **Production Keys** (для продакшена):
   - Работают с реальными покупками
   - Списывают деньги
   - Начинаются с `goog_` или `appl_`

**В коде уже настроено автоматическое переключение:**
```typescript
export const REVENUECAT_API_KEY_ANDROID = __DEV__
  ? 'goog_test_...' // Test key в режиме разработки
  : 'goog_...'      // Production key в release билде
```

### Где находятся ключи в Dashboard

**Public SDK Keys** находятся в разделе:
- **Project Settings** → **API Keys** → **Public SDK Keys**

Их можно безопасно использовать в клиентском приложении.

**Secret API Keys** - НЕ ИСПОЛЬЗУЙТЕ в мобильном приложении! Они нужны только для серверной части.

---

## 🎯 Быстрый старт

1. **Зарегистрируйтесь** на [RevenueCat](https://app.revenuecat.com/)
2. **Создайте проект** `AidKit`
3. **Добавьте Android приложение** с Package `com.aidkit`
4. **Скопируйте Public SDK Key** (Android)
5. **Обновите** `subscriptionConfig.ts` с ключом
6. **Создайте entitlement** `premium`
7. **Создайте подписки** в Google Play Console
8. **Привяжите подписки** к entitlement в RevenueCat
9. **Создайте Offering** `default` с подписками
10. **Протестируйте** на тестовых аккаунтах

---

## 📚 Дополнительные ресурсы

- [RevenueCat Dashboard](https://app.revenuecat.com/)
- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [Setting up Google Play Products](https://docs.revenuecat.com/docs/google-play-products)
- [Creating Entitlements](https://docs.revenuecat.com/docs/entitlements)
- [Configuring Offerings](https://docs.revenuecat.com/docs/offerings)

---

**Готово!** После выполнения этих шагов ваше приложение будет готово к работе с подписками через RevenueCat. 🎉

