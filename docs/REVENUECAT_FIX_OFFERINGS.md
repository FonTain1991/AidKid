# 🔧 Исправление ошибки "There are no products registered"

## ❌ Ошибка

```
Error fetching offerings - PurchasesError(code=ConfigurationError, 
underlyingErrorMessage=There are no products registered in the RevenueCat dashboard 
for your offerings.)
```

## ✅ Решение

Эта ошибка означает, что в RevenueCat Dashboard не настроены продукты и offerings. Нужно выполнить следующие шаги:

---

## 📋 Пошаговое исправление

### Шаг 1: Создать Entitlement

1. В RevenueCat Dashboard перейдите в **Project Settings** → **Entitlements**
2. Нажмите **"Create entitlement"** или **"Add entitlement"**
3. Заполните:
   - **Identifier**: `premium` (важно: именно это имя используется в коде!)
   - **Display name**: `Premium Subscription`
   - **Description**: `Премиум подписка с неограниченными возможностями`
4. Нажмите **"Save"**

### Шаг 2: Создать подписки в Google Play Console

**Сначала создайте подписки в Google Play**, затем привяжите их к RevenueCat.

⚠️ **ВАЖНО**: Google Play Console требует, чтобы приложение было опубликовано хотя бы в **Internal Testing** для создания подписок. Если вы видите ошибку "Требуется загрузить APK файл", даже при наличии релиза в Closed Testing, вам нужно:

1. Перейти в **Тестирование** → **Внутреннее тестирование (Internal Testing)**
2. Загрузить или использовать существующий APK/AAB
3. Опубликовать релиз в Internal Testing
4. Только после этого создать подписки

📖 **Подробная инструкция**: См. [GOOGLE_PLAY_SUBSCRIPTION_SETUP.md](./GOOGLE_PLAY_SUBSCRIPTION_SETUP.md)

После публикации в Internal Testing:

1. Зайдите в [Google Play Console](https://play.google.com/console/)
2. Выберите ваше приложение `AidKit`
3. Перейдите в **Монетизация** → **Продукты** → **Подписки**
4. Нажмите **"Создать подписку"** (теперь должно работать!)

#### Подписка 1: Ежемесячная

- **Product ID**: `premium_monthly`
- **Название**: `Премиум подписка (месяц)`
- **Описание**: `Неограниченное количество аптечек и лекарств, облачное резервное копирование и другие премиум функции`
- **Цена**: `99 ₽` (или ваша цена)
- **Период подписки**: `1 месяц`
- **Бесплатный пробный период**: По желанию (например, 7 дней)
- Нажмите **"Сохранить"**

#### Подписка 2: Годовая

- **Product ID**: `premium_yearly`
- **Название**: `Премиум подписка (год)`
- **Описание**: `Годовая подписка. Экономия до 40% по сравнению с ежемесячной подпиской`
- **Цена**: `699 ₽` (или ваша цена)
- **Период подписки**: `1 год`
- Нажмите **"Сохранить"**

⚠️ **Важно**: Подписки нужно сначала активировать в Google Play Console перед привязкой к RevenueCat.

### Шаг 3: Привязать подписки к RevenueCat

1. Вернитесь в RevenueCat Dashboard
2. Перейдите в **Products** (в левом меню проекта)
3. Вы увидите список доступных продуктов из Google Play
4. Для каждой подписки:
   - Найдите `premium_monthly` в списке
   - Нажмите на неё или кнопку **"Edit"**
   - В разделе **"Attach to Entitlements"** выберите `premium`
   - Нажмите **"Save"**
   - Повторите для `premium_yearly`

**Альтернативный способ** (если продукты не появились автоматически):
1. В разделе **Products** нажмите **"Add Product"**
2. Выберите ваше Android приложение
3. Введите Product ID из Google Play: `premium_monthly`
4. Привяжите к entitlement `premium`
5. Повторите для `premium_yearly`

### Шаг 4: Создать Offering

1. В RevenueCat Dashboard перейдите в **Offerings** (в левом меню проекта)
2. Нажмите **"Create Offering"** или используйте существующий `default`
3. **Identifier**: `default` (важно: именно это имя используется в коде!)
4. **Display name**: `Default Offering`

5. Добавьте Packages (планы подписки):
   
   **Package 1 - Monthly:**
   - Нажмите **"Add Package"**
   - **Package Identifier**: `$rc_monthly` (или `monthly`)
   - **Product**: Выберите `premium_monthly` из списка
   - Нажмите **"Save"**

   **Package 2 - Annual:**
   - Нажмите **"Add Package"** снова
   - **Package Identifier**: `$rc_annual` (или `annual`)
   - **Product**: Выберите `premium_yearly` из списка
   - Нажмите **"Save"**

6. Нажмите **"Save Offering"** или **"Publish"**

### Шаг 5: Проверка

После настройки:
1. Подождите 1-2 минуты (RevenueCat синхронизирует данные)
2. Перезапустите приложение
3. Откройте экран подписки
4. Ошибка должна исчезнуть, и вы увидите планы подписки

---

## 🔍 Проверка конфигурации

Убедитесь, что в RevenueCat Dashboard настроено:

✅ **Entitlement создан**:
- Identifier: `premium`
- Привязан к подпискам

✅ **Products настроены**:
- `premium_monthly` создан в Google Play и привязан к RevenueCat
- `premium_yearly` создан в Google Play и привязан к RevenueCat

✅ **Offering создан**:
- Identifier: `default`
- Содержит минимум один Package с привязанным Product

✅ **Код использует правильные идентификаторы**:
- `PREMIUM_ENTITLEMENT_ID = 'premium'` ✅
- `DEFAULT_OFFERING_ID = 'default'` ✅

---

## ⚠️ Частые проблемы

### Проблема 1: Products не появляются в RevenueCat

**Решение**:
- Убедитесь, что подписки активированы в Google Play Console
- Проверьте, что Package Name в RevenueCat совпадает с Google Play (`com.aidkit`)
- Подождите несколько минут для синхронизации
- Попробуйте нажать "Refresh" или "Sync Products" в RevenueCat

### Проблема 2: Offering пустой

**Решение**:
- Убедитесь, что Products привязаны к Entitlement `premium`
- Проверьте, что в Offering добавлены Packages с правильными Products
- Убедитесь, что Offering сохранен и опубликован

### Проблема 3: Ошибка остается после настройки

**Решение**:
- Подождите 2-3 минуты (синхронизация может занять время)
- Перезапустите приложение полностью
- Проверьте логи в RevenueCat Dashboard → Events
- Убедитесь, что используете правильный API ключ

---

## 📝 Чек-лист настройки

Выполните все пункты по порядку:

- [ ] Создан Entitlement `premium` в RevenueCat
- [ ] Создана подписка `premium_monthly` в Google Play Console
- [ ] Создана подписка `premium_yearly` в Google Play Console
- [ ] Подписки активированы в Google Play Console
- [ ] `premium_monthly` привязана к Entitlement `premium` в RevenueCat
- [ ] `premium_yearly` привязана к Entitlement `premium` в RevenueCat
- [ ] Создан Offering `default` в RevenueCat
- [ ] В Offering добавлен Package с `premium_monthly`
- [ ] В Offering добавлен Package с `premium_yearly`
- [ ] Offering сохранен и опубликован
- [ ] Приложение перезапущено
- [ ] Проверена работа экрана подписки

---

## 🚀 Быстрая проверка в коде

Убедитесь, что в `subscriptionConfig.ts` правильные идентификаторы:

```typescript
export const PREMIUM_ENTITLEMENT_ID = 'premium'  // ✅ Должен совпадать с Dashboard
export const DEFAULT_OFFERING_ID = 'default'      // ✅ Должен совпадать с Dashboard
```

---

После выполнения всех шагов ошибка должна исчезнуть, и экран подписки покажет доступные планы! 🎉

