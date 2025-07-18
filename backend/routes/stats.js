const express = require('express');
const { getConnection } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Получить статистику для дашборда
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getConnection();

    // Получаем все статистики параллельно
    const [bookingsResult] = await db.execute('SELECT COUNT(*) as count FROM bookings');
    const [clientsResult] = await db.execute('SELECT COUNT(*) as count FROM clients');
    const [accommodationsResult] = await db.execute('SELECT COUNT(*) as count FROM accommodation_types');
    
    // Получаем статистику по статусам бронирований
    const [bookingStatusResult] = await db.execute(`
      SELECT status, COUNT(*) as count 
      FROM bookings 
      GROUP BY status
    `);

    // Получаем последние бронирования
    const [recentBookings] = await db.execute(`
      SELECT id, name, accommodation_type, check_in, check_out, status, created_at
      FROM bookings 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    // Получаем статистику по месяцам
    const [monthlyStats] = await db.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as bookings
      FROM bookings 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month
    `);

    const stats = {
      totals: {
        bookings: bookingsResult[0].count,
        clients: clientsResult[0].count,
        accommodations: accommodationsResult[0].count
      },
      bookingStatus: bookingStatusResult.reduce((acc, curr) => {
        acc[curr.status] = curr.count;
        return acc;
      }, {}),
      recentBookings,
      monthlyStats
    };

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;