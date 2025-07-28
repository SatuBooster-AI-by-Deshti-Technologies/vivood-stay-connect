<?php
require_once '../config/database.php';
require_once '../config/auth.php';
require_once '../config/cors.php';

setupCORS();

$db = new Database();
$auth = new Auth();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/api/clients', '', $path);

try {
    switch ($method) {
        case 'GET':
            $auth->requireAdmin();
            $pathParts = explode('/', trim($path, '/'));
            $id = $pathParts[0] ?? null;
            
            if ($id) {
                $client = $db->fetch('SELECT * FROM clients WHERE id = ?', [$id]);
                if (!$client) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Client not found']);
                    exit;
                }
                echo json_encode($client);
            } else {
                $clients = $db->fetchAll('SELECT * FROM clients ORDER BY created_at DESC');
                echo json_encode($clients);
            }
            break;

        case 'POST':
            $auth->requireAdmin();
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data['name'] || !$data['email'] || !$data['phone']) {
                http_response_code(400);
                echo json_encode(['error' => 'Name, email and phone are required']);
                exit;
            }

            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid email format']);
                exit;
            }

            // Check if client with this email already exists
            $existing = $db->fetch('SELECT id FROM clients WHERE email = ?', [$data['email']]);
            if ($existing) {
                http_response_code(400);
                echo json_encode(['error' => 'Client with this email already exists']);
                exit;
            }

            $db->query(
                'INSERT INTO clients (name, email, phone, notes, source, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                [
                    $data['name'],
                    $data['email'],
                    $data['phone'],
                    $data['notes'] ?? '',
                    $data['source'] ?? 'manual'
                ]
            );

            echo json_encode(['id' => $db->lastInsertId(), 'message' => 'Client created successfully']);
            break;

        case 'PUT':
            $auth->requireAdmin();
            $pathParts = explode('/', trim($path, '/'));
            $id = $pathParts[0] ?? null;
            
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID is required']);
                exit;
            }

            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data['name'] || !$data['email'] || !$data['phone']) {
                http_response_code(400);
                echo json_encode(['error' => 'Name, email and phone are required']);
                exit;
            }

            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid email format']);
                exit;
            }

            // Check if another client with this email exists (excluding current client)
            $existing = $db->fetch('SELECT id FROM clients WHERE email = ? AND id != ?', [$data['email'], $id]);
            if ($existing) {
                http_response_code(400);
                echo json_encode(['error' => 'Client with this email already exists']);
                exit;
            }

            $db->query(
                'UPDATE clients SET name = ?, email = ?, phone = ?, notes = ?, updated_at = NOW() WHERE id = ?',
                [
                    $data['name'],
                    $data['email'],
                    $data['phone'],
                    $data['notes'] ?? '',
                    $id
                ]
            );

            echo json_encode(['message' => 'Client updated successfully']);
            break;

        case 'DELETE':
            $auth->requireAdmin();
            $pathParts = explode('/', trim($path, '/'));
            $id = $pathParts[0] ?? null;
            
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID is required']);
                exit;
            }

            $db->query('DELETE FROM clients WHERE id = ?', [$id]);
            echo json_encode(['message' => 'Client deleted successfully']);
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