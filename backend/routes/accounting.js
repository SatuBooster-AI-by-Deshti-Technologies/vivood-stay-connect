const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Get all accounting entries with pagination
router.get('/entries', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const { startDate, endDate, account } = req.query;

    let query = `
      SELECT ae.*, a.account_name, b.id as booking_number, u.name as created_by_name
      FROM accounting_entries ae
      LEFT JOIN accounts a ON ae.account = a.account_code
      LEFT JOIN bookings b ON ae.booking_id = b.id
      LEFT JOIN users u ON ae.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ` AND ae.entry_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND ae.entry_date <= ?`;
      params.push(endDate);
    }
    if (account) {
      query += ` AND ae.account = ?`;
      params.push(account);
    }

    query += ` ORDER BY ae.entry_date DESC, ae.id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [entries] = await db.execute(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM accounting_entries ae WHERE 1=1`;
    const countParams = [];
    
    if (startDate) {
      countQuery += ` AND ae.entry_date >= ?`;
      countParams.push(startDate);
    }
    if (endDate) {
      countQuery += ` AND ae.entry_date <= ?`;
      countParams.push(endDate);
    }
    if (account) {
      countQuery += ` AND ae.account = ?`;
      countParams.push(account);
    }

    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching accounting entries:', error);
    res.status(500).json({ error: 'Failed to fetch accounting entries' });
  }
});

// Create accounting entry
router.post('/entries', authMiddleware, async (req, res) => {
  try {
    const { entry_date, account, description, debit, credit, booking_id } = req.body;
    
    // Validate that debit and credit are not both non-zero
    if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
      return res.status(400).json({ error: 'Either debit or credit must be non-zero, but not both' });
    }

    const [result] = await db.execute(
      `INSERT INTO accounting_entries (entry_date, account, description, debit, credit, booking_id, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [entry_date, account, description, debit || 0, credit || 0, booking_id, req.user.id]
    );

    // Log the action
    await logAuditAction(req.user.id, 'CREATE', 'accounting_entries', result.insertId, null, req.body, req.ip, req.get('User-Agent'));

    res.status(201).json({ id: result.insertId, message: 'Accounting entry created successfully' });
  } catch (error) {
    console.error('Error creating accounting entry:', error);
    res.status(500).json({ error: 'Failed to create accounting entry' });
  }
});

// Update accounting entry
router.put('/entries/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { entry_date, account, description, debit, credit } = req.body;

    // Get old values for audit
    const [oldEntry] = await db.execute('SELECT * FROM accounting_entries WHERE id = ?', [id]);
    if (oldEntry.length === 0) {
      return res.status(404).json({ error: 'Accounting entry not found' });
    }

    await db.execute(
      `UPDATE accounting_entries 
       SET entry_date = ?, account = ?, description = ?, debit = ?, credit = ?
       WHERE id = ?`,
      [entry_date, account, description, debit || 0, credit || 0, id]
    );

    // Log the action
    await logAuditAction(req.user.id, 'UPDATE', 'accounting_entries', id, oldEntry[0], req.body, req.ip, req.get('User-Agent'));

    res.json({ message: 'Accounting entry updated successfully' });
  } catch (error) {
    console.error('Error updating accounting entry:', error);
    res.status(500).json({ error: 'Failed to update accounting entry' });
  }
});

// Delete accounting entry
router.delete('/entries/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Get old values for audit
    const [oldEntry] = await db.execute('SELECT * FROM accounting_entries WHERE id = ?', [id]);
    if (oldEntry.length === 0) {
      return res.status(404).json({ error: 'Accounting entry not found' });
    }

    await db.execute('DELETE FROM accounting_entries WHERE id = ?', [id]);

    // Log the action
    await logAuditAction(req.user.id, 'DELETE', 'accounting_entries', id, oldEntry[0], null, req.ip, req.get('User-Agent'));

    res.json({ message: 'Accounting entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting accounting entry:', error);
    res.status(500).json({ error: 'Failed to delete accounting entry' });
  }
});

// Get chart of accounts
router.get('/accounts', authMiddleware, async (req, res) => {
  try {
    const [accounts] = await db.execute(
      `SELECT * FROM accounts WHERE is_active = TRUE ORDER BY account_code`
    );
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Create new account
router.post('/accounts', authMiddleware, async (req, res) => {
  try {
    const { account_code, account_name, account_type, parent_account_id } = req.body;

    const [result] = await db.execute(
      `INSERT INTO accounts (account_code, account_name, account_type, parent_account_id) 
       VALUES (?, ?, ?, ?)`,
      [account_code, account_name, account_type, parent_account_id]
    );

    // Log the action
    await logAuditAction(req.user.id, 'CREATE', 'accounts', result.insertId, null, req.body, req.ip, req.get('User-Agent'));

    res.status(201).json({ id: result.insertId, message: 'Account created successfully' });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Get trial balance
router.get('/trial-balance', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        ae.account,
        a.account_name,
        a.account_type,
        SUM(ae.debit) as total_debit,
        SUM(ae.credit) as total_credit,
        (SUM(ae.debit) - SUM(ae.credit)) as balance
      FROM accounting_entries ae
      LEFT JOIN accounts a ON ae.account = a.account_code
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ` AND ae.entry_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND ae.entry_date <= ?`;
      params.push(endDate);
    }

    query += ` GROUP BY ae.account, a.account_name, a.account_type ORDER BY ae.account`;

    const [balance] = await db.execute(query, params);
    res.json(balance);
  } catch (error) {
    console.error('Error generating trial balance:', error);
    res.status(500).json({ error: 'Failed to generate trial balance' });
  }
});

// Get profit and loss statement
router.get('/profit-loss', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        a.account_type,
        ae.account,
        a.account_name,
        SUM(ae.credit - ae.debit) as amount
      FROM accounting_entries ae
      LEFT JOIN accounts a ON ae.account = a.account_code
      WHERE a.account_type IN ('revenue', 'expense')
    `;
    const params = [];

    if (startDate) {
      query += ` AND ae.entry_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND ae.entry_date <= ?`;
      params.push(endDate);
    }

    query += ` GROUP BY a.account_type, ae.account, a.account_name ORDER BY a.account_type, ae.account`;

    const [results] = await db.execute(query, params);
    
    const revenue = results.filter(r => r.account_type === 'revenue');
    const expenses = results.filter(r => r.account_type === 'expense');
    
    const totalRevenue = revenue.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Math.abs(parseFloat(e.amount)), 0);
    const netIncome = totalRevenue - totalExpenses;

    res.json({
      revenue,
      expenses,
      totalRevenue,
      totalExpenses,
      netIncome
    });
  } catch (error) {
    console.error('Error generating P&L statement:', error);
    res.status(500).json({ error: 'Failed to generate P&L statement' });
  }
});

// Auto-create accounting entries for booking
async function createBookingAccountingEntries(bookingId, amount, userId) {
  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Debit: Cash (Asset increases)
      await connection.execute(
        `INSERT INTO accounting_entries (entry_date, account, description, debit, credit, booking_id, created_by) 
         VALUES (CURRENT_DATE, '1100', 'Поступление от бронирования #${bookingId}', ?, 0, ?, ?)`,
        [amount, bookingId, userId]
      );

      // Credit: Revenue (Revenue increases)
      await connection.execute(
        `INSERT INTO accounting_entries (entry_date, account, description, debit, credit, booking_id, created_by) 
         VALUES (CURRENT_DATE, '4100', 'Доход от бронирования #${bookingId}', 0, ?, ?, ?)`,
        [amount, bookingId, userId]
      );

      await connection.commit();
      connection.release();
      
      console.log(`Accounting entries created for booking ${bookingId}`);
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error creating booking accounting entries:', error);
    throw error;
  }
}

// Audit logging function
async function logAuditAction(userId, action, tableName, recordId, oldValues, newValues, ipAddress, userAgent) {
  try {
    await db.execute(
      `INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        tableName,
        recordId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress,
        userAgent
      ]
    );
  } catch (error) {
    console.error('Error logging audit action:', error);
  }
}

module.exports = { router, createBookingAccountingEntries, logAuditAction };