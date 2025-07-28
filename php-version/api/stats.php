<?php
require_once '../config/database.php';
require_once '../config/auth.php';
require_once '../config/cors.php';

setupCORS();

$db = new Database();
$auth = new Auth();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $auth->requireAdmin();
        
        // Get total counts
        $bookingsCount = $db->fetch('SELECT COUNT(*) as count FROM bookings')['count'];
        $clientsCount = $db->fetch('SELECT COUNT(*) as count FROM clients')['count'];
        $accommodationsCount = $db->fetch('SELECT COUNT(*) as count FROM accommodation_types')['count'];
        
        // Get booking status statistics
        $bookingStatusResults = $db->fetchAll('SELECT status, COUNT(*) as count FROM bookings GROUP BY status');
        $bookingStatus = [];
        foreach ($bookingStatusResults as $row) {
            $bookingStatus[$row['status']] = $row['count'];
        }
        
        // Get recent bookings
        $recentBookings = $db->fetchAll(
            'SELECT id, name, accommodation_type, check_in, check_out, status, created_at FROM bookings ORDER BY created_at DESC LIMIT 5'
        );
        
        // Get monthly statistics
        $monthlyStats = $db->fetchAll(
            "SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as bookings 
             FROM bookings 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH) 
             GROUP BY DATE_FORMAT(created_at, '%Y-%m') 
             ORDER BY month"
        );
        
        $stats = [
            'totals' => [
                'bookings' => (int)$bookingsCount,
                'clients' => (int)$clientsCount,
                'accommodations' => (int)$accommodationsCount
            ],
            'bookingStatus' => $bookingStatus,
            'recentBookings' => $recentBookings,
            'monthlyStats' => $monthlyStats
        ];
        
        echo json_encode($stats);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>