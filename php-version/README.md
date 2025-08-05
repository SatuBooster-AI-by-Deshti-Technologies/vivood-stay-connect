# Vivood Hotel Management System - Полная установка

Полнофункциональная система управления отелем на PHP+MySQL с React фронтендом.

## 📋 ПОШАГОВАЯ УСТАНОВКА НА ХОСТИНГ

### ШАГ 1: Загрузка файлов на сервер

**1.1 PHP Backend (обязательно в корень сайта):**
- Загрузите ВСЕ файлы из папки `php-version/` в корневую папку вашего сайта (обычно `public_html/` или `www/`)
- Структура должна быть:
```
public_html/
├── api/
├── config/
├── uploads/
├── index.php
├── admin.html
├── database.sql
├── .htaccess
```

**1.2 React Frontend (отдельно):**
- Соберите React приложение командой: `npm run build`
- Загрузите содержимое папки `dist/` в подпапку `app/` на сервере:
```
public_html/
├── app/          ← React приложение
│   ├── assets/
│   ├── index.html
│   └── ...
├── api/          ← PHP API
├── config/
└── ...
```

### ШАГ 2: Настройка базы данных

**2.1 Создание базы данных:**
- Войдите в панель управления хостингом (cPanel/ISPmanager)
- Создайте новую MySQL базу данных
- Запомните: имя БД, пользователя, пароль

**2.2 Импорт структуры:**
- Откройте phpMyAdmin
- Выберите созданную базу данных
- Нажмите "Импорт"
- Загрузите файл `database.sql`
- Нажмите "Вперед"

**2.3 Настройка подключения:**
Отредактируйте `config/database.php`:
```php
$host = 'localhost';  // обычно localhost
$dbname = 'your_db_name';  // имя вашей БД
$username = 'your_db_user';  // пользователь БД
$password = 'your_db_password';  // пароль БД
```

### ШАГ 3: Настройка прав доступа
- Установите права 755 на папку `uploads/` (через FTP клиент или файловый менеджер)
- Проверьте что файлы `.htaccess` загружены

### ШАГ 4: Сборка и загрузка React приложения

**4.1 Настройка API URL:**
Отредактируйте `src/lib/api.ts` в React проекте:
```typescript
// Замените на адрес вашего сайта
const API_BASE_URL = 'https://your-domain.com/api';
```

**4.2 Сборка:**
```bash
npm run build
```

**4.3 Загрузка:**
- Создайте папку `app/` в корне сайта
- Загрузите ВСЁ содержимое папки `dist/` в `app/`

### ШАГ 5: Проверка работы

**5.1 Тест API:**
- Откройте: `https://your-domain.com/api/auth/me`
- Должно показать: `{"error":"Unauthorized"}`

**5.2 Тест админки:**
- Откройте: `https://your-domain.com/admin.html`
- Логин: `admin@vivood.com`
- Пароль: `admin123`

**5.3 Тест React приложения:**
- Откройте: `https://your-domain.com/app/`

## 🚨 БЫСТРОЕ РЕШЕНИЕ ПРОБЛЕМ

### 500 Internal Server Error
1. Проверьте настройки в `config/database.php`
2. Убедитесь что база данных создана и SQL импортирован
3. Проверьте что PHP 7.4+ установлен

### Не работает авторизация
1. Проверьте что `database.sql` импортирован полностью
2. Убедитесь что пользователь admin создан в БД

### Не загружаются файлы
1. Установите права 755 на папку `uploads/`
2. Проверьте что папка существует

## 📞 ИТОГОВАЯ СТРУКТУРА НА СЕРВЕРЕ

```
public_html/                    ← корень сайта
├── app/                       ← React приложение
│   ├── assets/
│   ├── index.html
│   └── ...
├── api/                       ← PHP API
│   ├── auth.php
│   ├── accommodations.php
│   └── ...
├── config/
│   ├── database.php          ← НАСТРОИТЬ!
│   └── ...
├── uploads/                   ← права 755
├── index.php
├── admin.html
└── .htaccess
```

### ШАГ 6: Apache Virtual Host (для VPS)
```apache
<VirtualHost *:80>
    DocumentRoot /path/to/php-version
    ServerName vivood.local
    
    <Directory /path/to/php-version>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### 6. Nginx конфигурация
```nginx
server {
    listen 80;
    server_name vivood.local;
    root /path/to/php-version;
    index index.php;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

## 🔐 Доступ по умолчанию

- **Email:** admin@vivood.com
- **Пароль:** admin123

## 📁 Структура проекта

```
php-version/
├── api/                    # API endpoints
│   ├── auth.php           # Аутентификация
│   ├── accommodations.php # Управление размещением
│   ├── bookings.php       # Бронирования
│   ├── clients.php        # Клиенты
│   ├── stats.php          # Статистика
│   └── upload.php         # Загрузка файлов
├── config/                # Конфигурация
│   ├── database.php       # Подключение к БД
│   ├── auth.php          # JWT аутентификация
│   └── cors.php          # CORS настройки
├── uploads/              # Загруженные файлы
├── database.sql          # Структура БД
├── index.php            # Главный роутер
├── .htaccess           # Apache настройки
└── README.md
```

## 🛠 API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Авторизация
- `GET /api/auth/me` - Текущий пользователь

### Размещение
- `GET /api/accommodations` - Активные номера
- `GET /api/accommodations/admin` - Все номера (админ)
- `POST /api/accommodations` - Создать
- `PUT /api/accommodations/{id}` - Обновить
- `DELETE /api/accommodations/{id}` - Удалить

### Бронирования
- `GET /api/bookings` - Все бронирования
- `GET /api/bookings/calendar` - События календаря
- `POST /api/bookings` - Создать
- `PUT /api/bookings/{id}` - Обновить статус

### Клиенты
- `GET /api/clients` - Список клиентов
- `GET /api/clients/{id}` - Один клиент
- `POST /api/clients` - Создать
- `PUT /api/clients/{id}` - Обновить
- `DELETE /api/clients/{id}` - Удалить

### Загрузка файлов
- `POST /api/upload/image` - Загрузить изображение
- `GET /uploads/{filename}` - Получить файл
- `DELETE /api/upload/{filename}` - Удалить

## 🔒 Безопасность

- JWT токены для аутентификации
- Password hashing с PHP password_hash()
- Валидация входных данных
- CORS настройки
- Проверка типов файлов при загрузке

## 🚀 Подключение к фронтенду

Измените в React приложении `src/lib/api.ts`:
```typescript
const API_BASE_URL = 'http://your-domain.com/api';
```

## 📝 Примечания

- Все пароли хешируются с помощью PHP password_hash()
- JWT токены действительны 24 часа
- Максимальный размер загружаемых файлов: 10MB
- Поддержка только изображений для загрузки
- Автоматическая генерация уникальных имен файлов

## 🐛 Отладка

Проверьте логи Apache/Nginx и PHP error log для диагностики проблем.