const express = require('express');
const { body, validationResult } = require('express-validator');
const { getConnection } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { createBookingAccountingEntries, logAuditAction } = require('./accounting');

const router = express.Router();

// Создать бронирование (публичный эндпоинт)
router.post('/', [
  body('accommodation_type').notEmpty(),
  body('check_in').isDate(),
  body('check_out').isDate(),
  body('guests').isInt({ min: 1 }),
  body('name').notEmpty(),
  body('email').isEmail(),
  body('phone').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      accommodation_type,
      check_in,
      check_out,
      guests,
      name,
      email,
      phone,
      total_price
    } = req.body;

    const db = getConnection();
    const [result] = await db.execute(
      `INSERT INTO bookings 
       (accommodation_type, check_in, check_out, guests, name, email, phone, total_price) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [accommodation_type, check_in, check_out, guests, name, email, phone, total_price]
    );

    res.json({ id: result.insertId, message: 'Booking created successfully' });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Получить все бронирования (админ)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getConnection();
    const [bookings] = await db.execute(
      'SELECT * FROM bookings ORDER BY created_at DESC'
    );

    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// Обновить статус бронирования
router.put('/:id', authenticateToken, requireAdmin, [
  body('status').isIn(['pending', 'confirmed', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    const db = getConnection();
    await db.execute('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);

    res.json({ message: 'Booking updated successfully' });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Получить события календаря
router.get('/calendar', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getConnection();
    const [bookings] = await db.execute(
      `SELECT id, accommodation_type as title, check_in as start, check_out as end, 
       name, email, phone, status, guests 
       FROM bookings 
       WHERE status != 'cancelled' 
       ORDER BY check_in`
    );

    res.json(bookings);
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({ error: 'Failed to get calendar events' });
  }
});

module.exports = router;