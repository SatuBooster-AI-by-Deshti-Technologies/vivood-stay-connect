-- Vivood Database Structure for PHP/MySQL version
-- Run this SQL to create the database structure

CREATE DATABASE IF NOT EXISTS vivood_db;
USE vivood_db;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Profiles table
CREATE TABLE profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255),
    role ENUM('user', 'manager', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Accommodation types table
CREATE TABLE accommodation_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_kz VARCHAR(255),
    name_ru VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    description_kz TEXT,
    description_ru TEXT,
    description_en TEXT,
    price DECIMAL(10,2) NOT NULL,
    weekday_price DECIMAL(10,2),
    weekend_price DECIMAL(10,2),
    category VARCHAR(100),
    total_quantity INT DEFAULT 1,
    available_quantity INT DEFAULT 1,
    features JSON,
    images JSON,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    accommodation_type VARCHAR(255) NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    total_price DECIMAL(10,2),
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    notes TEXT,
    source VARCHAR(50) DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    priority ENUM('low', 'normal', 'high') DEFAULT 'normal',
    created_by INT NOT NULL,
    assigned_to INT,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Activities table (for audit log)
CREATE TABLE activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- WhatsApp sessions table
CREATE TABLE whatsapp_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    client_name VARCHAR(255),
    client_id INT,
    email VARCHAR(255),
    session_stage ENUM('initial', 'choosing_accommodation', 'providing_details', 'confirming_booking', 'payment_pending', 'completed') DEFAULT 'initial',
    accommodation_type VARCHAR(255),
    check_in_date DATE,
    check_out_date DATE,
    guests INT,
    total_price DECIMAL(10,2),
    booking_id INT,
    notes TEXT,
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_until TIMESTAMP NULL,
    last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

-- WhatsApp messages table
CREATE TABLE whatsapp_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    message_type ENUM('text', 'image', 'document', 'audio') NOT NULL,
    content TEXT,
    is_from_client BOOLEAN DEFAULT TRUE,
    ai_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id) ON DELETE CASCADE
);

-- Payment links table
CREATE TABLE payment_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    booking_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT '₸',
    payment_url VARCHAR(500),
    payment_screenshot VARCHAR(500),
    status ENUM('pending', 'uploaded', 'verified', 'rejected') DEFAULT 'pending',
    verified_by INT,
    verified_at TIMESTAMP NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Marketing campaigns table
CREATE TABLE marketing_campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    message_template TEXT NOT NULL,
    target_audience ENUM('all', 'recent_clients', 'active_sessions') DEFAULT 'all',
    is_active BOOLEAN DEFAULT TRUE,
    sent_count INT DEFAULT 0,
    send_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Marketing messages table
CREATE TABLE marketing_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    session_id INT NOT NULL,
    delivery_status ENUM('sent', 'delivered', 'failed') DEFAULT 'sent',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id) ON DELETE CASCADE
);

-- Accounting tables
CREATE TABLE accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    account_type ENUM('asset', 'liability', 'equity', 'revenue', 'expense') NOT NULL,
    parent_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES accounts(id) ON DELETE SET NULL
);

CREATE TABLE accounting_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    debit_account VARCHAR(20) NOT NULL,
    credit_account VARCHAR(20) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    reference VARCHAR(100),
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password, name) VALUES 
('admin@vivood.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator');

INSERT INTO profiles (user_id, name, role) VALUES 
(1, 'Administrator', 'admin');

-- Insert sample accommodation types
INSERT INTO accommodation_types (name_ru, name_en, name_kz, description_ru, description_en, description_kz, price, weekday_price, weekend_price, category, features, images) VALUES
('Стандартный номер', 'Standard Room', 'Стандартты бөлме', 'Уютный номер с базовыми удобствами', 'Cozy room with basic amenities', 'Негізгі қолайлықтары бар жайлы бөлме', 15000.00, 12000.00, 18000.00, 'rooms', '["Wi-Fi", "TV", "Bathroom"]', '[]'),
('Люкс номер', 'Luxury Suite', 'Люкс бөлме', 'Просторный номер повышенной комфортности', 'Spacious room with enhanced comfort', 'Жақсартылған жайлылығы бар кең бөлме', 25000.00, 22000.00, 28000.00, 'rooms', '["Wi-Fi", "TV", "Mini-bar", "Jacuzzi"]', '[]'),
('Семейный коттедж', 'Family Cottage', 'Отбасылық коттедж', 'Отдельный коттедж для семейного отдыха', 'Separate cottage for family vacation', 'Отбасылық демалыс үшін бөлек коттедж', 40000.00, 35000.00, 45000.00, 'cottages', '["Kitchen", "Living room", "2 bedrooms", "Garden"]', '[]');

-- Insert basic chart of accounts
INSERT INTO accounts (code, name, account_type) VALUES
('1000', 'Денежные средства', 'asset'),
('1100', 'Касса', 'asset'),
('1200', 'Расчетный счет', 'asset'),
('2000', 'Обязательства', 'liability'),
('3000', 'Капитал', 'equity'),
('4000', 'Доходы от услуг', 'revenue'),
('5000', 'Расходы', 'expense');