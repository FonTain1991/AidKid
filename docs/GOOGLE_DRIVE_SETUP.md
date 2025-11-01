# Настройка Google Drive API для резервного копирования

Это руководство поможет настроить Google Drive API для функции резервного копирования в приложении AidKit.

## Шаг 1: Создание проекта в Google Cloud Console

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Запомните **Project ID** вашего проекта

## Шаг 2: Включение Google Drive API

1. В левом меню выберите **APIs & Services** > **Library**
2. Найдите "Google Drive API"
3. Нажмите **Enable** (Включить)

## Шаг 3: Создание OAuth 2.0 Client ID

> **Важно:** Даже для Android-only приложения нужны оба типа Client ID:
> - Web Client ID (для OAuth авторизации)
> - Android Client ID (для привязки к приложению)

### Настройка OAuth Consent Screen

1. Перейдите в **APIs & Services** > **OAuth consent screen**
2. Выберите **External** (если приложение для публичного использования)
3. Заполните обязательные поля:
   - **App name**: AidKit
   - **User support email**: ваш email
   - **Developer contact information**: ваш email
4. Нажмите **Save and Continue**
5. На странице **Scopes** нажмите **Add or Remove Scopes**
6. Найдите и добавьте scope: `https://www.googleapis.com/auth/drive.appdata`
7. Нажмите **Update** и **Save and Continue**
8. Пропустите раздел **Test users** (или добавьте тестовых пользователей)
9. Нажмите **Save and Continue**

### Создание Web Client ID

1. Перейдите в **APIs & Services** > **Credentials**
2. Нажмите **Create Credentials** > **OAuth client ID**
3. Выберите **Application type**: **Web application**
4. Введите **Name**: "AidKit Web Client"
5. В **Authorized redirect URIs** добавьте:
   - `http://localhost`
6. Нажмите **Create**
7. **ВАЖНО**: Сохраните **Client ID** - он понадобится позже

### Создание Android Client ID

1. В **Credentials** нажмите **Create Credentials** > **OAuth client ID**
2. Выберите **Application type**: **Android**
3. Введите **Name**: "AidKit Android"
4. Заполните **Package name**: `com.aidkit` (или ваш package name)
5. Для **SHA-1 certificate fingerprint**:
   
   **Debug Certificate** (для разработки):
   ```bash
   cd android
   # macOS/Linux:
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # Windows:
   keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
   ```
   
   **Release Certificate** (для production):
   ```bash
   cd android/app
   keytool -list -v -keystore aidkit.keystore -alias aidkit
   ```
   
6. Скопируйте SHA-1 fingerprint и вставьте в поле
7. Нажмите **Create**

## Шаг 4: Обновление кода приложения

### 4.1. Обновите Web Client ID в коде

Откройте файл `src/screens/Backup/BackupScreen.tsx` и замените строку:

```typescript
const WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com'
```

На ваш реальный Web Client ID из шага 3.

### 4.2. Проверьте AndroidManifest.xml

Убедитесь, что в `android/app/src/main/AndroidManifest.xml` есть разрешение на интернет:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

## Шаг 5: Настройка iOS (только если планируете iOS версию)

> **Примечание:** Этот шаг можно пропустить, если вы разрабатываете только Android версию.

Для iOS требуется дополнительная настройка:

1. Создайте iOS Client ID в Google Cloud Console (аналогично Android)
2. Откройте `ios/AidKit/Info.plist`
3. Добавьте URL scheme:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.YOUR_CLIENT_ID</string>
    </array>
  </dict>
</array>
```

Замените `YOUR_CLIENT_ID` на обратный Client ID (без `.apps.googleusercontent.com`).

## Шаг 6: Установка зависимостей (только для iOS)

> **Примечание:** Этот шаг только для iOS. Для Android все зависимости уже установлены.

Выполните команду для установки pod зависимостей:

```bash
cd ios
pod install
cd ..
```

## Шаг 7: Сборка и тестирование

### Android

```bash
yarn android
```

### iOS

```bash
yarn ios
```

## Использование

1. Откройте приложение
2. Перейдите в **Еще** > **Резервное копирование**
3. Нажмите **Войти в Google Drive**
4. Разрешите доступ к Google Drive
5. Теперь вы можете:
   - Создавать локальные резервные копии
   - Загружать их в Google Drive
   - Скачивать из Google Drive
   - Восстанавливать данные из бэкапа

## Структура бэкапа

Резервная копия включает:
- 📦 Все аптечки с иерархией
- 💊 Все лекарства с описаниями
- 📸 Фотографии лекарств
- 📊 Данные о запасах и сроках годности
- 👨‍👩‍👧‍👦 Информация о членах семьи
- ⏰ Напоминания и расписание
- 📝 История приема лекарств
- 🛒 Список покупок

## Безопасность

- Google Drive использует **appDataFolder** - специальную защищённую папку, доступную только вашему приложению
- Другие приложения не имеют доступа к вашим резервным копиям
- Данные передаются по защищённому HTTPS соединению
- Токены доступа хранятся безопасно в системном хранилище

## Устранение проблем

### Ошибка "Developer Error" при входе

- Убедитесь, что Web Client ID указан правильно
- Проверьте, что Android Client ID создан с правильным SHA-1
- Убедитесь, что Google Drive API включен в проекте

### Ошибка "Access Denied" или "403"

- Проверьте, что добавлен правильный scope: `https://www.googleapis.com/auth/drive.appdata`
- Убедитесь, что OAuth Consent Screen настроен правильно

### Не удаётся загрузить файл

- Проверьте интернет-соединение
- Убедитесь, что пользователь авторизован
- Проверьте логи для деталей ошибки

### SHA-1 не совпадает

Если вы получаете ошибку о несовпадении SHA-1:
1. Удалите приложение с устройства
2. Пересоберите: `cd android && ./gradlew clean`
3. Установите снова: `yarn android`

## Дополнительные ресурсы

- [Google Sign-In для React Native](https://github.com/react-native-google-signin/google-signin)
- [Google Drive REST API v3](https://developers.google.com/drive/api/v3/reference)
- [OAuth 2.0 для мобильных приложений](https://developers.google.com/identity/protocols/oauth2/native-app)

