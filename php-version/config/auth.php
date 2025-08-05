<?php
session_start();

function requireAuth() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }
}

function requireAdmin() {
    requireAuth();
    if ($_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        exit;
    }
}

function requireAdminOrManager() {
    requireAuth();
    if (!in_array($_SESSION['role'], ['admin', 'manager'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Admin or manager access required']);
        exit;
    }
}

function getCurrentUserId() {
    return $_SESSION['user_id'] ?? null;
}

function getCurrentUserRole() {
    return $_SESSION['role'] ?? null;
}

function createActivity($pdo, $type, $description, $entity_type = null, $entity_id = null) {
    $stmt = $pdo->prepare("INSERT INTO activities (user_id, type, description, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([getCurrentUserId(), $type, $description, $entity_type, $entity_id]);
}
?>