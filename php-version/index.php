<?php
require_once 'config/cors.php';

setupCORS();

// Simple router for API endpoints
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Remove leading slash
$path = ltrim($path, '/');

// Route to appropriate API endpoint
if (strpos($path, 'api/auth') === 0) {
    require_once 'api/auth.php';
} elseif (strpos($path, 'api/accommodations') === 0) {
    require_once 'api/accommodations.php';
} elseif (strpos($path, 'api/bookings') === 0) {
    require_once 'api/bookings.php';
} elseif (strpos($path, 'api/clients') === 0) {
    require_once 'api/clients.php';
} elseif (strpos($path, 'api/stats') === 0) {
    require_once 'api/stats.php';
} elseif (strpos($path, 'api/upload') === 0) {
    require_once 'api/upload.php';
} elseif (strpos($path, 'uploads/') === 0) {
    // Serve uploaded files
    $filename = str_replace('uploads/', '', $path);
    $filepath = __DIR__ . '/uploads/' . $filename;
    
    if (file_exists($filepath)) {
        $mimeType = mime_content_type($filepath);
        header('Content-Type: ' . $mimeType);
        header('Content-Length: ' . filesize($filepath));
        readfile($filepath);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'File not found']);
    }
} elseif ($path === '' || $path === 'api') {
    // Root endpoint
    echo json_encode([
        'message' => 'Vivood PHP API is running',
        'timestamp' => date('c'),
        'endpoints' => [
            '/api/auth' => 'Authentication endpoints',
            '/api/accommodations' => 'Accommodation management',
            '/api/bookings' => 'Booking management',
            '/api/clients' => 'Client management',
            '/api/stats' => 'Statistics',
            '/api/upload' => 'File upload'
        ]
    ]);
} elseif (strpos($path, 'api/') === 0) {
    // API endpoint not found
    http_response_code(404);
    echo json_encode(['error' => 'API endpoint not found']);
} else {
    // Serve simple admin interface
    ?>
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vivood Admin</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #333; text-align: center; }
            .endpoint { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #007bff; }
            .method { display: inline-block; padding: 3px 8px; border-radius: 3px; color: white; font-size: 12px; font-weight: bold; margin-right: 10px; }
            .get { background: #28a745; }
            .post { background: #007bff; }
            .put { background: #ffc107; color: #212529; }
            .delete { background: #dc3545; }
            code { background: #e9ecef; padding: 2px 5px; border-radius: 3px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🏨 Vivood PHP API</h1>
            <p>API успешно запущен. Документация по эндпоинтам:</p>
            
            <div class="endpoint">
                <h3>🔐 Аутентификация</h3>
                <div><span class="method post">POST</span><code>/api/auth/register</code> - Регистрация пользователя</div>
                <div><span class="method post">POST</span><code>/api/auth/login</code> - Авторизация</div>
                <div><span class="method get">GET</span><code>/api/auth/me</code> - Получить текущего пользователя</div>
            </div>
            
            <div class="endpoint">
                <h3>🏠 Размещение</h3>
                <div><span class="method get">GET</span><code>/api/accommodations</code> - Все активные</div>
                <div><span class="method get">GET</span><code>/api/accommodations/admin</code> - Все (админ)</div>
                <div><span class="method post">POST</span><code>/api/accommodations</code> - Создать</div>
                <div><span class="method put">PUT</span><code>/api/accommodations/{id}</code> - Обновить</div>
                <div><span class="method delete">DELETE</span><code>/api/accommodations/{id}</code> - Удалить</div>
            </div>
            
            <div class="endpoint">
                <h3>📅 Бронирования</h3>
                <div><span class="method get">GET</span><code>/api/bookings</code> - Все бронирования</div>
                <div><span class="method get">GET</span><code>/api/bookings/calendar</code> - События календаря</div>
                <div><span class="method post">POST</span><code>/api/bookings</code> - Создать бронирование</div>
                <div><span class="method put">PUT</span><code>/api/bookings/{id}</code> - Обновить статус</div>
            </div>
            
            <div class="endpoint">
                <h3>👥 Клиенты</h3>
                <div><span class="method get">GET</span><code>/api/clients</code> - Все клиенты</div>
                <div><span class="method get">GET</span><code>/api/clients/{id}</code> - Один клиент</div>
                <div><span class="method post">POST</span><code>/api/clients</code> - Создать клиента</div>
                <div><span class="method put">PUT</span><code>/api/clients/{id}</code> - Обновить</div>
                <div><span class="method delete">DELETE</span><code>/api/clients/{id}</code> - Удалить</div>
            </div>
            
            <div class="endpoint">
                <h3>📊 Статистика</h3>
                <div><span class="method get">GET</span><code>/api/stats</code> - Статистика дашборда</div>
            </div>
            
            <div class="endpoint">
                <h3>📁 Загрузка файлов</h3>
                <div><span class="method post">POST</span><code>/api/upload/image</code> - Загрузить изображение</div>
                <div><span class="method get">GET</span><code>/uploads/{filename}</code> - Получить файл</div>
                <div><span class="method delete">DELETE</span><code>/api/upload/{filename}</code> - Удалить файл</div>
            </div>
            
            <p><strong>Данные для входа по умолчанию:</strong></p>
            <ul>
                <li>Email: admin@vivood.com</li>
                <li>Пароль: admin123</li>
            </ul>
        </div>
    </body>
    </html>
    <?php
}
?>