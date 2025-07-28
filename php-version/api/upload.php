<?php
require_once '../config/auth.php';
require_once '../config/cors.php';

setupCORS();

$auth = new Auth();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/api/upload', '', $path);

// Create uploads directory if it doesn't exist
$uploadDir = '../uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

try {
    switch ($method) {
        case 'POST':
            if ($path === '/image') {
                $auth->requireAdmin();
                
                if (!isset($_FILES['image'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'No file uploaded']);
                    exit;
                }
                
                $file = $_FILES['image'];
                
                // Check if it's an image
                if (!getimagesize($file['tmp_name'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Only image files are allowed']);
                    exit;
                }
                
                // Check file size (10MB limit)
                if ($file['size'] > 10 * 1024 * 1024) {
                    http_response_code(400);
                    echo json_encode(['error' => 'File too large. Maximum size is 10MB']);
                    exit;
                }
                
                // Generate unique filename
                $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
                $filename = uniqid() . '.' . $extension;
                $filepath = $uploadDir . $filename;
                
                if (move_uploaded_file($file['tmp_name'], $filepath)) {
                    echo json_encode([
                        'imageUrl' => '/uploads/' . $filename,
                        'originalName' => $file['name'],
                        'size' => $file['size']
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode(['error' => 'Failed to upload file']);
                }
            }
            break;
            
        case 'GET':
            $pathParts = explode('/', trim($path, '/'));
            $filename = $pathParts[0] ?? null;
            
            if (!$filename) {
                http_response_code(400);
                echo json_encode(['error' => 'Filename is required']);
                exit;
            }
            
            $filepath = $uploadDir . $filename;
            
            if (!file_exists($filepath)) {
                http_response_code(404);
                echo json_encode(['error' => 'File not found']);
                exit;
            }
            
            $mimeType = mime_content_type($filepath);
            header('Content-Type: ' . $mimeType);
            header('Content-Length: ' . filesize($filepath));
            readfile($filepath);
            break;
            
        case 'DELETE':
            $auth->requireAdmin();
            $pathParts = explode('/', trim($path, '/'));
            $filename = $pathParts[0] ?? null;
            
            if (!$filename) {
                http_response_code(400);
                echo json_encode(['error' => 'Filename is required']);
                exit;
            }
            
            $filepath = $uploadDir . $filename;
            
            if (file_exists($filepath)) {
                unlink($filepath);
            }
            
            echo json_encode(['message' => 'Image deleted successfully']);
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