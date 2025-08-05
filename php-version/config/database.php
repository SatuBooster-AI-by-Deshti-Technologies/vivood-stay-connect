<?php
// Database configuration
$host = 'localhost';
$dbname = 'vivood_db';
$username = 'root';
$password = '';

// For production, update these values:
// $host = 'your_database_host';
// $dbname = 'your_database_name';
// $username = 'your_database_user';
// $password = 'your_database_password';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
?>