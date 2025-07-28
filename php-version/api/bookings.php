<?php
require_once '../config/database.php';
require_once '../config/auth.php';
require_once '../config/cors.php';

setupCORS();

$db = new Database();
$auth = new Auth();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/api/bookings', '', $path);

try {
    switch ($method) {
        case 'GET':
            if ($path === '/calendar') {
                $auth->requireAdmin();
                $bookings = $db->fetchAll(
                    "SELECT id, accommodation_type as title, check_in as start, check_out as end, name, email, phone, status, guests FROM bookings WHERE status != 'cancelled' ORDER BY check_in"
                );
                echo json_encode($bookings);
            } else {
                $auth->requireAdmin();
                $bookings = $db->fetchAll('SELECT * FROM bookings ORDER BY created_at DESC');
                echo json_encode($bookings);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data['accommodation_type'] || !$data['check_in'] || !$data['check_out'] || !$data['guests'] || !$data['name'] || !$data['email'] || !$data['phone']) {
                http_response_code(400);
                echo json_encode(['error' => 'All required fields must be provided']);
                exit;
            }

            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid email format']);
                exit;
            }

            if ($data['guests'] < 1) {
                http_response_code(400);
                echo json_encode(['error' => 'Guests must be at least 1']);
                exit;
            }

            $db->query(
                'INSERT INTO bookings (accommodation_type, check_in, check_out, guests, name, email, phone, total_price, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
                [
                    $data['accommodation_type'],
                    $data['check_in'],
                    $data['check_out'],
                    $data['guests'],
                    $data['name'],
                    $data['email'],
                    $data['phone'],
                    $data['total_price'] ?? 0,
                    'pending'
                ]
            );

            echo json_encode(['id' => $db->lastInsertId(), 'message' => 'Booking created successfully']);
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
            
            if (!in_array($data['status'], ['pending', 'confirmed', 'cancelled'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid status']);
                exit;
            }

            $db->query('UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?', [$data['status'], $id]);
            echo json_encode(['message' => 'Booking updated successfully']);
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