# Исправление ошибки 403 в Google Drive API

## Проблема
Ошибка `403 Forbidden` при попытке доступа к Google Drive API означает, что у приложения нет необходимых разрешений.

## Решение

### 1. Включить Google Drive API

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Выберите ваш проект `aidkit-dcfe7`
3. Перейдите в **APIs & Services** → **Library**
4. Найдите **Google Drive API**
5. Нажмите **Enable** (Включить)

### 2. Проверить OAuth 2.0 клиенты

1. В **APIs & Services** → **Credentials**
2. Найдите ваш **OAuth 2.0 Client ID**
3. Убедитесь, что добавлены правильные **Authorized redirect URIs**:
   - `com.aidkit:/oauth2redirect` (для Android)
   - `https://your-domain.com/oauth2redirect` (для Web, если нужен)

### 3. Проверить разрешения (Scopes)

Убедитесь, что в коде используются правильные разрешения:

```typescript
const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata'
```

### 4. Проверить Web Client ID

В `BackupScreen.tsx` должен быть правильный Web Client ID:

```typescript
const WEB_CLIENT_ID = '464124582533-2ctqatjjbk7h1lgu4d1facpe017p167j.apps.googleusercontent.com'
```

### 5. Пересоздать OAuth клиент (если нужно)

Если проблема не решается:

1. Удалите существующий OAuth клиент
2. Создайте новый:
   - **Application type**: Web application
   - **Name**: AidKit Web Client
   - **Authorized redirect URIs**: 
     - `com.aidkit:/oauth2redirect`
     - `https://your-domain.com/oauth2redirect`
3. Скопируйте новый **Client ID** в код

### 6. Проверить google-services.json

Убедитесь, что в `android/app/google-services.json` есть Web Client ID:

```json
{
  "oauth_client": [
    {
      "client_id": "464124582533-2ctqatjjbk7h1lgu4d1facpe017p167j.apps.googleusercontent.com",
      "client_type": 3
    }
  ]
}
```

## Тестирование

После исправления:

1. **Перезапустите приложение**
2. **Выйдите и войдите** в Google аккаунт заново
3. **Попробуйте создать семейную группу**
4. **Проверьте логи** - не должно быть ошибки 403

## Дополнительные проверки

### Проверить права доступа в Google Drive

1. Зайдите в [Google Drive](https://drive.google.com/)
2. Проверьте, есть ли папка **App Data** (скрытая папка для приложений)
3. Если нет - приложение не имеет доступа к `appDataFolder`

### Проверить квоты API

1. В Google Cloud Console → **APIs & Services** → **Quotas**
2. Убедитесь, что не превышены лимиты для Google Drive API

## Если ничего не помогает

1. **Создайте новый проект** в Google Cloud Console
2. **Включите Google Drive API**
3. **Создайте новые OAuth клиенты**
4. **Обновите google-services.json**
5. **Обновите Web Client ID в коде**

## Контакты

Если проблема не решается, проверьте:
- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [OAuth 2.0 Scopes for Google APIs](https://developers.google.com/identity/protocols/oauth2/scopes)
