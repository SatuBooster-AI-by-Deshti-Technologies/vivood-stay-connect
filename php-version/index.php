<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vivood - Система управления бронированием</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            background: white;
            padding: 3rem;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
            width: 90%;
        }
        
        .logo {
            width: 120px;
            height: 120px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            margin: 0 auto 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            color: white;
            font-weight: bold;
        }
        
        h1 {
            color: #333;
            margin-bottom: 1rem;
            font-size: 2.5rem;
        }
        
        p {
            color: #666;
            margin-bottom: 2rem;
            line-height: 1.6;
        }
        
        .buttons {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .btn {
            padding: 1rem 2rem;
            border: none;
            border-radius: 10px;
            font-size: 1rem;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
            font-weight: 600;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-secondary {
            background: #f8f9fa;
            color: #333;
            border: 2px solid #e9ecef;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        
        .features {
            margin-top: 3rem;
            text-align: left;
        }
        
        .feature {
            display: flex;
            align-items: center;
            margin-bottom: 1rem;
            color: #555;
        }
        
        .feature::before {
            content: "✓";
            color: #28a745;
            font-weight: bold;
            margin-right: 0.5rem;
        }
        
        .status {
            margin-top: 2rem;
            padding: 1rem;
            border-radius: 10px;
            background: #e8f5e8;
            color: #155724;
            border: 1px solid #c3e6c3;
        }
        
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">V</div>
        <h1>Vivood</h1>
        <p>Система управления бронированием и размещением</p>
        
        <?php
        // Check database connection
        try {
            require_once 'config/database.php';
            echo '<div class="status">✅ База данных подключена успешно</div>';
            $dbConnected = true;
        } catch (Exception $e) {
            echo '<div class="status error">❌ Ошибка подключения к базе данных: ' . $e->getMessage() . '</div>';
            $dbConnected = false;
        }
        ?>
        
        <div class="features">
            <div class="feature">Управление бронированиями</div>
            <div class="feature">База клиентов</div>
            <div class="feature">Типы размещения</div>
            <div class="feature">Статистика и отчеты</div>
            <div class="feature">Управление задачами</div>
            <div class="feature">Загрузка файлов</div>
        </div>
        
        <div class="buttons">
            <?php if ($dbConnected): ?>
                <a href="admin.html" class="btn btn-primary">Панель администратора</a>
                <a href="api/stats.php" class="btn btn-secondary">API Статистика</a>
            <?php else: ?>
                <button class="btn btn-secondary" disabled>Сначала настройте базу данных</button>
            <?php endif; ?>
        </div>
        
        <p style="margin-top: 2rem; font-size: 0.9rem; color: #888;">
            Для входа в систему используйте:<br>
            Email: admin@vivood.com<br>
            Пароль: admin123
        </p>
    </div>
</body>
</html>