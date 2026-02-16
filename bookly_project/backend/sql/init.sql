SET NAMES utf8mb4 COLLATE utf8mb4_hungarian_ci;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS bookly_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_hungarian_ci;

USE bookly_db;

-- Admins table (separate from users for security)
CREATE TABLE IF NOT EXISTS admins (
  `id` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `last_login` DATETIME,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

CREATE TABLE IF NOT EXISTS users (
  `id` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `name` VARCHAR(255),
  `email` VARCHAR(255) UNIQUE,
  `phone` VARCHAR(20) UNIQUE,
  `address` VARCHAR(255),
  `status` ENUM('active', 'inactive', 'deleted', 'banned') DEFAULT 'inactive',
  `role` ENUM('user', 'employee', 'customer') DEFAULT 'user',
  `last_login` DATETIME,
  `password_hash` VARCHAR(255),
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  `profile_picture_url` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

CREATE TABLE IF NOT EXISTS salons (
  `id` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20),
  `email` VARCHAR(255),
  `type` VARCHAR(100),
  `opening_hours` INT,
  `closing_hours` INT,
  `description` TEXT,
  `latitude` DECIMAL(9, 6),
  `longitude` DECIMAL(9, 6),
  `sharecode` VARCHAR(100) UNIQUE,
  `status` ENUM('open', 'closed', 'renovation') DEFAULT 'open',
  `banner_color` VARCHAR(7) DEFAULT '#3B82F6',
  `logo_url` VARCHAR(500) DEFAULT NULL,
  `banner_image_url` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;


CREATE TABLE IF NOT EXISTS providers (
  `id` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `salon_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `phone` VARCHAR(20) UNIQUE NOT NULL,
  `description` TEXT,
  `status` ENUM('active', 'inactive', 'deleted', 'banned') DEFAULT 'inactive',
  `role` ENUM('provider', 'manager') DEFAULT 'provider',
  `isManager` BOOLEAN DEFAULT FALSE,
  `last_login` DATETIME,
  `password_hash` VARCHAR(255) NOT NULL,
  `profile_picture_url` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (salon_id) REFERENCES salons(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

CREATE TABLE IF NOT EXISTS services (
  `id` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `provider_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `duration_minutes` INT NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `status` ENUM('available', 'unavailable') DEFAULT 'available',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES providers(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

CREATE TABLE IF NOT EXISTS appointments (
  `id` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `user_id` INT NULL,
  `provider_id` INT NOT NULL,
  `service_id` INT NOT NULL,
  `appointment_start` DATETIME NOT NULL,
  `appointment_end` DATETIME NOT NULL,
  `comment` TEXT,
  `price` INT NOT NULL,
  `status` ENUM('scheduled', 'completed', 'canceled', 'no_show', 'deleted') DEFAULT 'scheduled',
  `guest_name` VARCHAR(255) NULL,
  `guest_email` VARCHAR(255) NULL,
  `guest_phone` VARCHAR(20) NULL,
  `deleted_reason` VARCHAR(500) NULL,
  `deleted_at` DATETIME NULL,
  `deleted_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (provider_id) REFERENCES providers(id),
  FOREIGN KEY (service_id) REFERENCES services(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

CREATE TABLE IF NOT EXISTS ratings(
  `id` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `user_id` INT NOT NULL,
  `appointment_id` INT NOT NULL,
  `salon_id` INT NOT NULL,
  `provider_id` INT NOT NULL,
  `salon_rating` INT CHECK (salon_rating >= 1 AND salon_rating <= 5),
  `provider_rating` INT CHECK (provider_rating >= 1 AND provider_rating <= 5),
  `salon_comment` TEXT,
  `provider_comment` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `active` BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (salon_id) REFERENCES salons(id),
  FOREIGN KEY (provider_id) REFERENCES providers(id),
  UNIQUE KEY unique_appointment_rating (appointment_id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

CREATE TABLE IF NOT EXISTS saved_salons(
  `id` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `user_id` INT NOT NULL,
  `salon_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (salon_id) REFERENCES salons(id),
  UNIQUE KEY unique_user_salon (user_id, salon_id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

CREATE TABLE IF NOT EXISTS provider_time_blocks(
  `id` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `provider_id` INT NOT NULL,
  `start_datetime` DATETIME NOT NULL,
  `end_datetime` DATETIME NOT NULL,
  `is_recurring` BOOLEAN DEFAULT FALSE,
  `recurrence_pattern` ENUM('daily', 'weekly') DEFAULT NULL,
  `recurrence_days` JSON DEFAULT NULL,
  `recurrence_end_date` DATE DEFAULT NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
  INDEX idx_provider_start (provider_id, start_datetime),
  INDEX idx_provider_end (provider_id, end_datetime)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- System logs table for audit trail
CREATE TABLE IF NOT EXISTS system_logs (
  `id` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `level` ENUM('INFO', 'WARN', 'CRITICAL') DEFAULT 'INFO',
  `action` VARCHAR(100) NOT NULL,
  `actor_type` ENUM('admin', 'user', 'provider', 'system') DEFAULT 'system',
  `actor_id` INT NULL,
  `target_type` VARCHAR(50) NULL,
  `target_id` INT NULL,
  `details` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_action (action),
  INDEX idx_created_at (created_at),
  INDEX idx_level (level)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- RefTokens table (created last to reference users, providers, and admins)
CREATE TABLE IF NOT EXISTS RefTokens(
  `id` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `user_id` INT NULL,
  `provider_id` INT NULL,
  `admin_id` INT NULL,
  `refresh_token` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;


-- Insert sample data

-- Insert test salons
INSERT INTO salons (name, address, phone, email, type, description, latitude, longitude, sharecode, status, banner_color, logo_url) VALUES 
  ('Premium Hair Salon', '100 Beauty Blvd, Budapest', '2012345678', 'contact@premiumhair.com', 'fodrász', 'Top-rated hair salon with expert stylists', 47.4979, 19.0402, 'HAIR01', 'open', '#8B5CF6', NULL),
  ('Wellness Spa Center', '200 Relaxation St, Budapest', '2098765432', 'info@wellnessspa.com', 'szépségszalon', 'Full-service spa offering massage and beauty treatments', 47.5103, 19.0560, 'SPA001', 'open', '#10B981', NULL),
  ('Tech Repair Pro', '300 Tech Ave, Budapest', '2011223344', 'support@techrepair.com', 'javítószerviz', 'Professional electronics repair service', 47.4850, 19.0780, 'TECH01', 'open', '#EF4444', NULL),
  ('Glamour Studio', 'Andrássy út 45, Budapest', '2013456789', 'hello@glamourstudio.hu', 'fodrász', 'Modern hair studio with creative stylists', 47.5050, 19.0620, 'GLAM01', 'open', '#EC4899', NULL),
  ('Zen Wellness', 'Váci utca 12, Budapest', '2014567890', 'booking@zenwellness.hu', 'szépségszalon', 'Relaxing spa with traditional and modern treatments', 47.4920, 19.0550, 'ZEN001', 'open', '#06B6D4', NULL),
  ('QuickFix Electronics', 'Üllői út 89, Budapest', '2015678901', 'fix@quickfix.hu', 'javítószerviz', 'Fast and reliable electronics repair', 47.4750, 19.0890, 'QFIX01', 'open', '#F59E0B', NULL),
  ('Bella Hair Design', 'Nagymező utca 22, Budapest', '2016789012', 'info@bellahair.hu', 'fodrász', 'Elegant hair salon specializing in bridal styling', 47.5030, 19.0580, 'BELLA1', 'open', '#F97316', NULL),
  ('Serenity Spa', 'Margit körút 15, Budapest', '2017890123', 'relax@serenityspa.hu', 'szépségszalon', 'Luxury spa experience with premium products', 47.5150, 19.0350, 'SEREN1', 'open', '#A855F7', NULL),
  ('TechMaster Service', 'Rákóczi út 50, Budapest', '2018901234', 'service@techmaster.hu', 'javítószerviz', 'Expert computer and phone repair services', 47.4950, 19.0700, 'TECH02', 'open', '#6366F1', NULL),
  ('Chic Salon', 'Király utca 33, Budapest', '2019012345', 'style@chicsalon.hu', 'fodrász', 'Trendy salon with award-winning stylists', 47.5010, 19.0610, 'CHIC01', 'open', '#14B8A6', NULL),
  ('Harmony Beauty', 'Bajcsy-Zsilinszky út 8, Budapest', '2020123456', 'hello@harmonybeauty.hu', 'szépségszalon', 'Complete beauty treatments for body and soul', 47.5000, 19.0530, 'HARM01', 'open', '#84CC16', NULL),
  ('Digital Doctors', 'Teréz körút 28, Budapest', '2021234567', 'help@digitaldoctors.hu', 'javítószerviz', 'Specialists in smartphone and tablet repairs', 47.5080, 19.0650, 'DIGI01', 'open', '#0EA5E9', NULL),
  ('Elegance Hair Lounge', 'Oktogon tér 2, Budapest', '2022345678', 'book@elegancelounge.hu', 'fodrász', 'Premium hair care in the heart of Budapest', 47.5055, 19.0635, 'ELEG01', 'open', '#D946EF', NULL),
  ('Pure Bliss Spa', 'Vörösmarty tér 5, Budapest', '2023456789', 'spa@purebliss.hu', 'szépségszalon', 'Escape to tranquility with our signature treatments', 47.4960, 19.0510, 'PURE01', 'open', '#22C55E', NULL);

-- Insert admin user (separate table for security)
-- Password for admin@bookly.com is: admin123
INSERT INTO admins (name, email, password_hash) VALUES 
  ('Admin User', 'admin@bookly.com', '$2b$10$FnPTtKtmz1H0n8YYxuvdRO0GHUd9C94yvktvThkyYwQk72f0Xsa8S');

-- Insert test users
INSERT INTO users (name, email, phone, address, status, role, password_hash) VALUES 
  ('John Doe', 'john.doe@example.com', '1234567890', '123 Main St, Budapest', 'active', 'user', '$2a$10$hashedpassword1'),
  ('Jane Smith', 'jane.smith@example.com', '0987654321', '456 Oak Ave, Budapest', 'active', 'user', '$2a$10$hashedpassword2'),
  ('Demo User', 'demo@example.com', '1122334455', '789 Demo Rd, Budapest', 'active', 'customer', '$2a$10$hashedpassword3'),
  ('Test User', 'test@example.com', '5544332211', '321 Test Ln, Budapest', 'inactive', 'user', '$2a$10$hashedpassword4');

-- Insert test providers
INSERT INTO providers (salon_id, name, email, phone, description, status, role, isManager, password_hash) VALUES 
  (1, 'Maria Kovacs', 'maria.kovacs@premiumhair.com', '3011111111', 'Senior Hair Stylist', 'active', 'provider', FALSE, '$2a$10$hashedpassword5'),
  (1, 'Peter Nagy', 'peter.nagy@premiumhair.com', '3022222222', 'Hair Color Specialist', 'active', 'provider', FALSE, '$2a$10$hashedpassword6'),
  (2, 'Anna Toth', 'anna.toth@wellnessspa.com', '3033333333', 'Massage Therapist', 'active', 'provider', FALSE, '$2a$10$hashedpassword7'),
  (2, 'Balazs Kiss', 'balazs.kiss@wellnessspa.com', '3044444444', 'Facial Specialist', 'active', 'provider', FALSE, '$2a$10$hashedpassword8'),
  (3, 'Gabor Horvath', 'gabor.horvath@techrepair.com', '3055555555', 'Computer Technician', 'active', 'provider', FALSE, '$2a$10$hashedpassword9'),
  (3, 'Eva Varga', 'eva.varga@techrepair.com', '3066666666', 'Phone Repair Specialist', 'active', 'manager', TRUE, '$2a$10$hashedpassword10');

-- Insert test services
INSERT INTO services (provider_id, name, description, duration_minutes, price, status) VALUES 
  (1, 'Haircut', 'Professional haircut with styling', 45, 3500.00, 'available'),
  (2, 'Hair Coloring', 'Full hair coloring service', 120, 12000.00, 'available'),
  (3, 'Swedish Massage', 'Relaxing full-body massage', 60, 8000.00, 'available'),
  (4, 'Facial Treatment', 'Deep cleansing facial with mask', 75, 9500.00, 'available'),
  (5, 'Laptop Repair', 'Diagnostic and repair service', 90, 15000.00, 'available'),
  (6, 'Phone Screen Replacement', 'Replace broken phone screen', 30, 7000.00, 'available');

-- Insert test appointments
INSERT INTO appointments (user_id, provider_id, service_id, appointment_start, appointment_end, comment, price, status) VALUES 
  (1, 1, 1, '2026-01-25 10:00:00', '2026-01-25 10:45:00', 'First time customer', 3500, 'scheduled'),
  (2, 3, 3, '2026-01-25 14:00:00', '2026-01-25 15:00:00', 'Needs relaxation massage', 8000, 'scheduled'),
  (1, 5, 5, '2026-01-26 11:00:00', '2026-01-26 12:30:00', 'Laptop not turning on', 15000, 'scheduled'),
  (4, 2, 2, '2026-01-23 09:00:00', '2026-01-23 11:00:00', 'Want blonde highlights', 12000, 'completed'),
  (2, 6, 6, '2026-01-22 16:00:00', '2026-01-22 16:30:00', 'Cracked iPhone screen', 7000, 'completed'),
  (1, 4, 4, '2026-01-27 13:00:00', '2026-01-27 14:15:00', 'Anti-aging facial treatment', 9500, 'scheduled');

-- Insert test ratings (must match ratings table schema: appointment_id, provider_id required)
INSERT INTO ratings (user_id, appointment_id, salon_id, provider_id, salon_rating, provider_rating, salon_comment, provider_comment, active) VALUES 
  (4, 4, 1, 2, 5, 4, 'Love my new hair color! Peter did an amazing job.', 'Very professional and creative stylist.', TRUE),
  (2, 5, 3, 6, 4, 5, 'Good repair service, fast turnaround.', 'Eva was super helpful and fixed my phone perfectly!', TRUE);