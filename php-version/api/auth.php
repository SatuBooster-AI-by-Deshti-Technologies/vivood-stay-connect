<?php
require_once '../config/cors.php';
require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? '';

try {
    switch ($method) {
        case 'POST':
            if ($path === '/login') {
                // Login
                $input = json_decode(file_get_contents('php://input'), true);
                $email = $input['email'] ?? '';
                $password = $input['password'] ?? '';

                if (empty($email) || empty($password)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Email and password required']);
                    exit;
                }

                $stmt = $pdo->prepare("SELECT u.id, u.email, u.password, u.name, p.role FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.email = ?");
                $stmt->execute([$email]);
                $user = $stmt->fetch();

                if (!$user || !password_verify($password, $user['password'])) {
                    http_response_code(401);
                    echo json_encode(['error' => 'Invalid credentials']);
                    exit;
                }

                session_start();
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['email'] = $user['email'];
                $_SESSION['name'] = $user['name'];
                $_SESSION['role'] = $user['role'] ?? 'user';

                echo json_encode([
                    'user' => [
                        'id' => $user['id'],
                        'email' => $user['email'],
                        'name' => $user['name'],
                        'role' => $user['role'] ?? 'user'
                    ]
                ]);

            } elseif ($path === '/register') {
                // Register
                $input = json_decode(file_get_contents('php://input'), true);
                $email = $input['email'] ?? '';
                $password = $input['password'] ?? '';
                $name = $input['name'] ?? '';

                if (empty($email) || empty($password) || empty($name)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'All fields required']);
                    exit;
                }

                // Check if user exists
                $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
                $stmt->execute([$email]);
                if ($stmt->fetch()) {
                    http_response_code(400);
                    echo json_encode(['error' => 'User already exists']);
                    exit;
                }

                $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                
                $pdo->beginTransaction();
                
                // Create user
                $stmt = $pdo->prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?)");
                $stmt->execute([$email, $hashedPassword, $name]);
                $userId = $pdo->lastInsertId();
                
                // Create profile
                $stmt = $pdo->prepare("INSERT INTO profiles (user_id, name, role) VALUES (?, ?, 'user')");
                $stmt->execute([$userId, $name]);
                
                $pdo->commit();

                session_start();
                $_SESSION['user_id'] = $userId;
                $_SESSION['email'] = $email;
                $_SESSION['name'] = $name;
                $_SESSION['role'] = 'user';

                echo json_encode([
                    'user' => [
                        'id' => $userId,
                        'email' => $email,
                        'name' => $name,
                        'role' => 'user'
                    ]
                ]);

            } elseif ($path === '/logout') {
                session_start();
                session_destroy();
                echo json_encode(['message' => 'Logged out successfully']);
            }
            break;

        case 'GET':
            if ($path === '/me') {
                session_start();
                if (!isset($_SESSION['user_id'])) {
                    http_response_code(401);
                    echo json_encode(['error' => 'Not authenticated']);
                    exit;
                }

                echo json_encode([
                    'user' => [
                        'id' => $_SESSION['user_id'],
                        'email' => $_SESSION['email'],
                        'name' => $_SESSION['name'],
                        'role' => $_SESSION['role']
                    ]
                ]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>