<?php
require_once '../config/database.php';
require_once '../config/auth.php';
require_once '../config/cors.php';

setupCORS();

$db = new Database();
$auth = new Auth();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/api/auth', '', $path);

try {
    switch ($method) {
        case 'POST':
            if ($path === '/register') {
                $data = json_decode(file_get_contents('php://input'), true);
                
                if (!$data['email'] || !$data['password'] || !$data['name']) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Email, password and name are required']);
                    exit;
                }

                // Check if user exists
                $existing = $db->fetch('SELECT id FROM users WHERE email = ?', [$data['email']]);
                if ($existing) {
                    http_response_code(400);
                    echo json_encode(['error' => 'User already exists']);
                    exit;
                }

                // Create user
                $hashedPassword = $auth->hashPassword($data['password']);
                $db->query('INSERT INTO users (email, password, name, created_at) VALUES (?, ?, ?, NOW())', 
                    [$data['email'], $hashedPassword, $data['name']]);
                
                $userId = $db->lastInsertId();

                // Create profile
                $db->query('INSERT INTO profiles (user_id, name, role, created_at) VALUES (?, ?, ?, NOW())', 
                    [$userId, $data['name'], 'user']);

                $token = $auth->generateJWT($userId, $data['email'], 'user');

                echo json_encode([
                    'user' => [
                        'id' => $userId,
                        'email' => $data['email'],
                        'name' => $data['name'],
                        'role' => 'user'
                    ],
                    'access_token' => $token
                ]);

            } elseif ($path === '/login') {
                $data = json_decode(file_get_contents('php://input'), true);
                
                if (!$data['email'] || !$data['password']) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Email and password are required']);
                    exit;
                }

                $user = $db->fetch('SELECT u.*, p.role FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.email = ?', [$data['email']]);
                
                if (!$user || !$auth->verifyPassword($data['password'], $user['password'])) {
                    http_response_code(401);
                    echo json_encode(['error' => 'Invalid credentials']);
                    exit;
                }

                $token = $auth->generateJWT($user['id'], $user['email'], $user['role'] ?? 'user');

                echo json_encode([
                    'user' => [
                        'id' => $user['id'],
                        'email' => $user['email'],
                        'name' => $user['name'],
                        'role' => $user['role'] ?? 'user'
                    ],
                    'access_token' => $token
                ]);
            }
            break;

        case 'GET':
            if ($path === '/me') {
                $user = $auth->requireAuth();
                $userData = $db->fetch('SELECT u.*, p.role FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.id = ?', [$user['user_id']]);
                
                echo json_encode([
                    'user' => [
                        'id' => $userData['id'],
                        'email' => $userData['email'],
                        'name' => $userData['name'],
                        'role' => $userData['role'] ?? 'user'
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
    echo json_encode(['error' => $e->getMessage()]);
}
?>