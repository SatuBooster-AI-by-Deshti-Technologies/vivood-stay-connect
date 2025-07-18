const express = require('express');
const { body, validationResult } = require('express-validator');
const { getConnection } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Получить все типы размещений
router.get('/', async (req, res) => {
  try {
    const db = getConnection();
    const [accommodations] = await db.execute(
      'SELECT * FROM accommodation_types WHERE is_active = TRUE ORDER BY created_at DESC'
    );

    // Парсим JSON поля
    const processedAccommodations = accommodations.map(acc => ({
      ...acc,
      features: JSON.parse(acc.features || '[]'),
      images: JSON.parse(acc.images || '[]')
    }));

    res.json(processedAccommodations);
  } catch (error) {
    console.error('Get accommodations error:', error);
    res.status(500).json({ error: 'Failed to get accommodations' });
  }
});

// Получить все типы размещений для админа
router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getConnection();
    const [accommodations] = await db.execute(
      'SELECT * FROM accommodation_types ORDER BY created_at DESC'
    );

    const processedAccommodations = accommodations.map(acc => ({
      ...acc,
      features: JSON.parse(acc.features || '[]'),
      images: JSON.parse(acc.images || '[]')
    }));

    res.json(processedAccommodations);
  } catch (error) {
    console.error('Get admin accommodations error:', error);
    res.status(500).json({ error: 'Failed to get accommodations' });
  }
});

// Создать новый тип размещения
router.post('/', authenticateToken, requireAdmin, [
  body('name_kz').notEmpty(),
  body('name_ru').notEmpty(),
  body('name_en').notEmpty(),
  body('price').isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name_kz,
      name_ru,
      name_en,
      description_kz,
      description_ru,
      description_en,
      price,
      features,
      images,
      is_active
    } = req.body;

    const db = getConnection();
    const [result] = await db.execute(
      `INSERT INTO accommodation_types 
       (name_kz, name_ru, name_en, description_kz, description_ru, description_en, price, features, images, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name_kz,
        name_ru,
        name_en,
        description_kz || null,
        description_ru || null,
        description_en || null,
        price,
        JSON.stringify(features || []),
        JSON.stringify(images || []),
        is_active !== false
      ]
    );

    res.json({ id: result.insertId, message: 'Accommodation created successfully' });
  } catch (error) {
    console.error('Create accommodation error:', error);
    res.status(500).json({ error: 'Failed to create accommodation' });
  }
});

// Обновить тип размещения
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name_kz,
      name_ru,
      name_en,
      description_kz,
      description_ru,
      description_en,
      price,
      features,
      images,
      is_active
    } = req.body;

    const db = getConnection();
    await db.execute(
      `UPDATE accommodation_types SET 
       name_kz = ?, name_ru = ?, name_en = ?, 
       description_kz = ?, description_ru = ?, description_en = ?, 
       price = ?, features = ?, images = ?, is_active = ?
       WHERE id = ?`,
      [
        name_kz,
        name_ru,
        name_en,
        description_kz,
        description_ru,
        description_en,
        price,
        JSON.stringify(features || []),
        JSON.stringify(images || []),
        is_active,
        id
      ]
    );

    res.json({ message: 'Accommodation updated successfully' });
  } catch (error) {
    console.error('Update accommodation error:', error);
    res.status(500).json({ error: 'Failed to update accommodation' });
  }
});

// Удалить тип размещения
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getConnection();

    await db.execute('DELETE FROM accommodation_types WHERE id = ?', [id]);
    res.json({ message: 'Accommodation deleted successfully' });
  } catch (error) {
    console.error('Delete accommodation error:', error);
    res.status(500).json({ error: 'Failed to delete accommodation' });
  }
});

module.exports = router;