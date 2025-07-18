const express = require('express');
const { body, validationResult } = require('express-validator');
const { getConnection } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Получить всех клиентов
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getConnection();
    const [clients] = await db.execute(
      'SELECT * FROM clients ORDER BY created_at DESC'
    );

    res.json(clients);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to get clients' });
  }
});

// Создать нового клиента
router.post('/', authenticateToken, requireAdmin, [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('phone').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, notes, source } = req.body;

    const db = getConnection();
    
    // Проверяем существует ли клиент с таким email
    const [existingClients] = await db.execute(
      'SELECT id FROM clients WHERE email = ?',
      [email]
    );

    if (existingClients.length > 0) {
      return res.status(400).json({ error: 'Client with this email already exists' });
    }

    const [result] = await db.execute(
      'INSERT INTO clients (name, email, phone, notes, source) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, notes || null, source || 'manual']
    );

    res.json({ id: result.insertId, message: 'Client created successfully' });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// Обновить клиента
router.put('/:id', authenticateToken, requireAdmin, [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('phone').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, email, phone, notes, source } = req.body;

    const db = getConnection();
    
    // Проверяем существует ли другой клиент с таким email
    const [existingClients] = await db.execute(
      'SELECT id FROM clients WHERE email = ? AND id != ?',
      [email, id]
    );

    if (existingClients.length > 0) {
      return res.status(400).json({ error: 'Client with this email already exists' });
    }

    await db.execute(
      'UPDATE clients SET name = ?, email = ?, phone = ?, notes = ?, source = ? WHERE id = ?',
      [name, email, phone, notes, source, id]
    );

    res.json({ message: 'Client updated successfully' });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// Удалить клиента
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getConnection();

    await db.execute('DELETE FROM clients WHERE id = ?', [id]);
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// Получить одного клиента
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getConnection();

    const [clients] = await db.execute('SELECT * FROM clients WHERE id = ?', [id]);
    
    if (clients.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(clients[0]);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Failed to get client' });
  }
});

module.exports = router;