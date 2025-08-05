<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? '';

try {
    switch ($method) {
        case 'GET':
            requireAdminOrManager();
            
            $stmt = $pdo->query("SELECT t.*, u1.name as created_by_name, u2.name as assigned_to_name FROM tasks t LEFT JOIN users u1 ON t.created_by = u1.id LEFT JOIN users u2 ON t.assigned_to = u2.id ORDER BY t.created_at DESC");
            $tasks = $stmt->fetchAll();
            echo json_encode($tasks);
            break;

        case 'POST':
            requireAdminOrManager();
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            $required = ['title'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Field $field is required"]);
                    exit;
                }
            }
            
            $stmt = $pdo->prepare("INSERT INTO tasks (title, description, status, priority, created_by, assigned_to, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $input['title'],
                $input['description'] ?? null,
                $input['status'] ?? 'pending',
                $input['priority'] ?? 'normal',
                getCurrentUserId(),
                $input['assigned_to'] ?? null,
                $input['due_date'] ?? null
            ]);
            
            $taskId = $pdo->lastInsertId();
            createActivity($pdo, 'create', "Создана задача: {$input['title']}", 'task', $taskId);
            
            echo json_encode(['id' => $taskId, 'message' => 'Task created successfully']);
            break;

        case 'PUT':
            requireAdminOrManager();
            
            $id = basename($path);
            $input = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, assigned_to = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $stmt->execute([
                $input['title'],
                $input['description'] ?? null,
                $input['status'] ?? 'pending',
                $input['priority'] ?? 'normal',
                $input['assigned_to'] ?? null,
                $input['due_date'] ?? null,
                $id
            ]);
            
            createActivity($pdo, 'update', "Обновлена задача ID: $id", 'task', $id);
            
            echo json_encode(['message' => 'Task updated successfully']);
            break;

        case 'DELETE':
            requireAdminOrManager();
            
            $id = basename($path);
            
            $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
            $stmt->execute([$id]);
            
            createActivity($pdo, 'delete', "Удалена задача ID: $id", 'task', $id);
            
            echo json_encode(['message' => 'Task deleted successfully']);
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