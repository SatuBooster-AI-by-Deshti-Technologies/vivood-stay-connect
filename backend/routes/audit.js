const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get audit log with pagination and filters
router.get('/log', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const { startDate, endDate, userId, tableName, action } = req.query;

    let query = `
      SELECT al.*, u.name as user_name, u.email as user_email
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ` AND DATE(al.created_at) >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND DATE(al.created_at) <= ?`;
      params.push(endDate);
    }
    if (userId) {
      query += ` AND al.user_id = ?`;
      params.push(userId);
    }
    if (tableName) {
      query += ` AND al.table_name = ?`;
      params.push(tableName);
    }
    if (action) {
      query += ` AND al.action = ?`;
      params.push(action);
    }

    query += ` ORDER BY al.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [logs] = await db.execute(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM audit_log al WHERE 1=1`;
    const countParams = [];
    
    if (startDate) {
      countQuery += ` AND DATE(al.created_at) >= ?`;
      countParams.push(startDate);
    }
    if (endDate) {
      countQuery += ` AND DATE(al.created_at) <= ?`;
      countParams.push(endDate);
    }
    if (userId) {
      countQuery += ` AND al.user_id = ?`;
      countParams.push(userId);
    }
    if (tableName) {
      countQuery += ` AND al.table_name = ?`;
      countParams.push(tableName);
    }
    if (action) {
      countQuery += ` AND al.action = ?`;
      countParams.push(action);
    }

    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// Get audit statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (startDate && endDate) {
      dateFilter = 'WHERE DATE(created_at) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = 'WHERE DATE(created_at) >= ?';
      params.push(startDate);
    } else if (endDate) {
      dateFilter = 'WHERE DATE(created_at) <= ?';
      params.push(endDate);
    }

    // Total actions
    const [totalResult] = await db.execute(
      `SELECT COUNT(*) as total FROM audit_log ${dateFilter}`,
      params
    );

    // Actions by type
    const [actionStats] = await db.execute(
      `SELECT action, COUNT(*) as count FROM audit_log ${dateFilter} GROUP BY action`,
      params
    );

    // Actions by table
    const [tableStats] = await db.execute(
      `SELECT table_name, COUNT(*) as count FROM audit_log ${dateFilter} GROUP BY table_name`,
      params
    );

    // Actions by user
    const [userStats] = await db.execute(
      `SELECT u.name, u.email, COUNT(*) as count 
       FROM audit_log al 
       LEFT JOIN users u ON al.user_id = u.id 
       ${dateFilter} 
       GROUP BY al.user_id, u.name, u.email 
       ORDER BY count DESC`,
      params
    );

    // Daily activity (last 30 days)
    const [dailyActivity] = await db.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM audit_log 
       WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
       GROUP BY DATE(created_at) 
       ORDER BY date DESC`,
      []
    );

    res.json({
      total: totalResult[0].total,
      actionStats,
      tableStats,
      userStats,
      dailyActivity
    });
  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    res.status(500).json({ error: 'Failed to fetch audit statistics' });
  }
});

// Get audit details for specific record
router.get('/record/:table/:id', authenticateToken, async (req, res) => {
  try {
    const { table, id } = req.params;
    
    const [logs] = await db.execute(
      `SELECT al.*, u.name as user_name, u.email as user_email
       FROM audit_log al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.table_name = ? AND al.record_id = ?
       ORDER BY al.created_at DESC`,
      [table, id]
    );

    res.json(logs);
  } catch (error) {
    console.error('Error fetching record audit history:', error);
    res.status(500).json({ error: 'Failed to fetch record audit history' });
  }
});

module.exports = router;