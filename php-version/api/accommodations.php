<?php
require_once '../config/database.php';
require_once '../config/auth.php';
require_once '../config/cors.php';

setupCORS();

$db = new Database();
$auth = new Auth();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/api/accommodations', '', $path);

try {
    switch ($method) {
        case 'GET':
            if ($path === '/admin') {
                $auth->requireAdmin();
                $accommodations = $db->fetchAll('SELECT * FROM accommodation_types ORDER BY created_at DESC');
                
                // Parse JSON fields
                foreach ($accommodations as &$acc) {
                    $acc['features'] = json_decode($acc['features'] ?? '[]');
                    $acc['images'] = json_decode($acc['images'] ?? '[]');
                }
                
                echo json_encode($accommodations);
            } else {
                $accommodations = $db->fetchAll('SELECT * FROM accommodation_types WHERE is_active = 1 ORDER BY created_at DESC');
                
                // Parse JSON fields
                foreach ($accommodations as &$acc) {
                    $acc['features'] = json_decode($acc['features'] ?? '[]');
                    $acc['images'] = json_decode($acc['images'] ?? '[]');
                }
                
                echo json_encode($accommodations);
            }
            break;

        case 'POST':
            $auth->requireAdmin();
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data['name_ru'] || !$data['price']) {
                http_response_code(400);
                echo json_encode(['error' => 'Name (RU) and price are required']);
                exit;
            }

            $features = json_encode($data['features'] ?? []);
            $images = json_encode($data['images'] ?? []);

            $db->query(
                'INSERT INTO accommodation_types (name_kz, name_ru, name_en, description_kz, description_ru, description_en, price, weekday_price, weekend_price, category, total_quantity, available_quantity, features, images, image_url, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
                [
                    $data['name_kz'] ?? '',
                    $data['name_ru'],
                    $data['name_en'] ?? '',
                    $data['description_kz'] ?? '',
                    $data['description_ru'] ?? '',
                    $data['description_en'] ?? '',
                    $data['price'],
                    $data['weekday_price'] ?? $data['price'],
                    $data['weekend_price'] ?? $data['price'],
                    $data['category'] ?? '',
                    $data['total_quantity'] ?? 1,
                    $data['available_quantity'] ?? 1,
                    $features,
                    $images,
                    $data['image_url'] ?? '',
                    $data['is_active'] ?? 1
                ]
            );

            echo json_encode(['id' => $db->lastInsertId(), 'message' => 'Accommodation created successfully']);
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
            $features = json_encode($data['features'] ?? []);
            $images = json_encode($data['images'] ?? []);

            $db->query(
                'UPDATE accommodation_types SET name_kz=?, name_ru=?, name_en=?, description_kz=?, description_ru=?, description_en=?, price=?, weekday_price=?, weekend_price=?, category=?, total_quantity=?, available_quantity=?, features=?, images=?, image_url=?, is_active=?, updated_at=NOW() WHERE id=?',
                [
                    $data['name_kz'] ?? '',
                    $data['name_ru'] ?? '',
                    $data['name_en'] ?? '',
                    $data['description_kz'] ?? '',
                    $data['description_ru'] ?? '',
                    $data['description_en'] ?? '',
                    $data['price'] ?? 0,
                    $data['weekday_price'] ?? $data['price'] ?? 0,
                    $data['weekend_price'] ?? $data['price'] ?? 0,
                    $data['category'] ?? '',
                    $data['total_quantity'] ?? 1,
                    $data['available_quantity'] ?? 1,
                    $features,
                    $images,
                    $data['image_url'] ?? '',
                    $data['is_active'] ?? 1,
                    $id
                ]
            );

            echo json_encode(['message' => 'Accommodation updated successfully']);
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

            $db->query('DELETE FROM accommodation_types WHERE id = ?', [$id]);
            echo json_encode(['message' => 'Accommodation deleted successfully']);
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