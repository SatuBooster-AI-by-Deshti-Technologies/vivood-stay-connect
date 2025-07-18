-- Создание базы данных
CREATE DATABASE IF NOT EXISTS vivood_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vivood_db;

-- Таблица пользователей (заменяет auth.users)
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Таблица профилей
CREATE TABLE profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(255),
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_id (user_id)
);

-- Таблица типов размещений
CREATE TABLE accommodation_types (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name_kz TEXT NOT NULL,
    name_ru TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_kz TEXT,
    description_ru TEXT,
    description_en TEXT,
    price DECIMAL(10,2) NOT NULL,
    features JSON,  -- массив строк
    images JSON,    -- массив путей к изображениям
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Таблица бронирований
CREATE TABLE bookings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    accommodation_type VARCHAR(255) NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    total_price DECIMAL(10,2),
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Таблица клиентов
CREATE TABLE clients (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(255) NOT NULL,
    notes TEXT,
    source ENUM('manual', 'whatsapp', 'instagram', 'website') DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX idx_accommodation_active ON accommodation_types(is_active);

-- Вставка админа по умолчанию (пароль: admin123)
INSERT INTO users (id, email, password_hash, name, role) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'admin@vivood.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'admin');

INSERT INTO profiles (user_id, name, role) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Admin User', 'admin');

-- Тестовые данные для типов размещений
INSERT INTO accommodation_types (name_kz, name_ru, name_en, description_kz, description_ru, description_en, price, features, images) VALUES
('Эко-юрта', 'Эко-юрта', 'Eco Yurt', 'Дәстүрлі юрта қазіргі ыңғайлылықпен', 'Традиционная юрта с современными удобствами', 'Traditional yurt with modern amenities', 15000.00, JSON_ARRAY('Wi-Fi', 'Кондиционер', 'Душ'), JSON_ARRAY()),
('Глэмпинг шатыр', 'Глэмпинг палатка', 'Glamping Tent', 'Сапа көліктің ішінде кемпинг', 'Роскошный кемпинг в палатке', 'Luxury camping in a tent', 20000.00, JSON_ARRAY('Джакузи', 'Кухня', 'Террас'), JSON_ARRAY()),
('Ағаш үй', 'Домик на дереве', 'Tree House', 'Ағаштың үстіндегі романтикалық үй', 'Романтический домик на дереве', 'Romantic tree house', 25000.00, JSON_ARRAY('Балкон', 'Камин', 'Сауна'), JSON_ARRAY());