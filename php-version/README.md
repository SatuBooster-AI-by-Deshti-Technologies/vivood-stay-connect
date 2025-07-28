# Vivood PHP+MySQL Version

Полнофункциональная версия системы управления отелем на PHP и MySQL.

## 🚀 Установка

### 1. Требования
- PHP 7.4+ с расширениями PDO, PDO_MySQL, GD
- MySQL 5.7+ или MariaDB
- Apache/Nginx с mod_rewrite

### 2. Настройка базы данных
```bash
# Создайте базу данных MySQL
mysql -u root -p
CREATE DATABASE vivood_db;
exit

# Импортируйте структуру
mysql -u root -p vivood_db < database.sql
```

### 3. Настройка подключения
Отредактируйте `config/database.php`:
```php
private $host = 'localhost';
private $db_name = 'vivood_db';
private $username = 'your_username';
private $password = 'your_password';
```

### 4. Права доступа
```bash
chmod 755 uploads/
chmod 644 config/*.php
```

### 5. Apache Virtual Host
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