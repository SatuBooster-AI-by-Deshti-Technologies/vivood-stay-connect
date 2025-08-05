<?php
// Database configuration
// Обновите эти значения согласно настройкам вашего хостинга
$host = 'localhost';  // или IP адрес базы данных
$dbname = 'your_database_name';  // имя вашей базы данных
$username = 'your_database_user';  // пользователь базы данных
$password = 'your_database_password';  // пароль от базы данных

// Пример для популярных хостингов:
// Beget: $host = 'localhost'; $dbname = 'your_account_dbname';
// TimeWeb: $host = 'localhost'; $dbname = 'your_account_dbname';
// Hostinger: $host = 'localhost'; $dbname = 'your_account_dbname';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
?>