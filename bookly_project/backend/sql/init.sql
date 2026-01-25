SET NAMES utf8mb4 COLLATE utf8mb4_hungarian_ci;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS bookly_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_hungarian_ci;

USE bookly_db;

-- Create RefTokens table first (no dependencies)
CREATE TABLE IF NOT EXISTS RefTokens(
  `id` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `user_id` INT,
  `refresh_token` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

CREATE TABLE IF NOT EXISTS users (
  `id` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `name` VARCHAR(255),
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `phone` VARCHAR(20) UNIQUE ,
  `address` VARCHAR(255),
  `status` ENUM('active', 'inactive', 'deleted', 'banned') DEFAULT 'inactive',
  `role` ENUM('user', 'employee', 'admin', 'customer') DEFAULT 'user',
  `last_login` DATETIME,
  `password_hash` VARCHAR(255) NOT NULL,
  `access_token` TEXT,
  `refresh_token_id` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (refresh_token_id) REFERENCES RefTokens(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;


-- Add foreign key constraint to RefTokens after users table is created
ALTER TABLE RefTokens ADD FOREIGN KEY (user_id) REFERENCES users(id);


CREATE TABLE IF NOT EXISTS salons (
  `id` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20),
  `email` VARCHAR(255),
  `type` VARCHAR(100),
  `description` TEXT,
  `latitude` DECIMAL(9, 6) NOT NULL,
  `longitude` DECIMAL(9, 6) NOT NULL,
  `sharecode` VARCHAR(100) UNIQUE,
  `status` ENUM('open', 'closed', 'renovation') DEFAULT 'open',
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
  `refresh_token` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- rating DECIMAL(2,1) DEFAULT 0.0 - consider adding later
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
  `user_id` INT NOT NULL,
  `provider_id` INT NOT NULL,
  `appointment_start` DATETIME NOT NULL,
  `appointment_end` DATETIME NOT NULL,
  `comment` TEXT,
  `price` INT NOT NULL,
  `status` ENUM('scheduled', 'completed', 'canceled', 'no_show') DEFAULT 'scheduled',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (provider_id) REFERENCES providers(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

CREATE TABLE IF NOT EXISTS ratings(
  `id` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `user_id` INT NOT NULL,
  `salon_id` INT NOT NULL,
  `rating` INT CHECK (rating >= 1 AND rating <= 5),
  `comment` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `active` BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (salon_id) REFERENCES salons(id)
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



-- Optional: Insert sample data (seed)

-- Insert test salons
INSERT INTO salons (name, address, phone, email, type, description, latitude, longitude, sharecode, status) VALUES 
  ('Premium Hair Salon', '100 Beauty Blvd, Budapest', '2012345678', 'contact@premiumhair.com', 'fodrász', 'Top-rated hair salon with expert stylists', 47.4979, 19.0402, 'HAIR01', 'open'),
  ('Wellness Spa Center', '200 Relaxation St, Budapest', '2098765432', 'info@wellnessspa.com', 'szépségszalon', 'Full-service spa offering massage and beauty treatments', 47.5103, 19.0560, 'SPA001', 'open'),
  ('Tech Repair Pro', '300 Tech Ave, Budapest', '2011223344', 'support@techrepair.com', 'javítószerviz', 'Professional electronics repair service', 47.4850, 19.0780, 'TECH01', 'open'),
  ('Glamour Studio', 'Andrássy út 45, Budapest', '2013456789', 'hello@glamourstudio.hu', 'fodrász', 'Modern hair studio with creative stylists', 47.5050, 19.0620, 'GLAM01', 'open'),
  ('Zen Wellness', 'Váci utca 12, Budapest', '2014567890', 'booking@zenwellness.hu', 'szépségszalon', 'Relaxing spa with traditional and modern treatments', 47.4920, 19.0550, 'ZEN001', 'open'),
  ('QuickFix Electronics', 'Üllői út 89, Budapest', '2015678901', 'fix@quickfix.hu', 'javítószerviz', 'Fast and reliable electronics repair', 47.4750, 19.0890, 'QFIX01', 'open'),
  ('Bella Hair Design', 'Nagymező utca 22, Budapest', '2016789012', 'info@bellahair.hu', 'fodrász', 'Elegant hair salon specializing in bridal styling', 47.5030, 19.0580, 'BELLA1', 'open'),
  ('Serenity Spa', 'Margit körút 15, Budapest', '2017890123', 'relax@serenityspa.hu', 'szépségszalon', 'Luxury spa experience with premium products', 47.5150, 19.0350, 'SEREN1', 'open'),
  ('TechMaster Service', 'Rákóczi út 50, Budapest', '2018901234', 'service@techmaster.hu', 'javítószerviz', 'Expert computer and phone repair services', 47.4950, 19.0700, 'TECH02', 'open'),
  ('Chic Salon', 'Király utca 33, Budapest', '2019012345', 'style@chicsalon.hu', 'fodrász', 'Trendy salon with award-winning stylists', 47.5010, 19.0610, 'CHIC01', 'open'),
  ('Harmony Beauty', 'Bajcsy-Zsilinszky út 8, Budapest', '2020123456', 'hello@harmonybeauty.hu', 'szépségszalon', 'Complete beauty treatments for body and soul', 47.5000, 19.0530, 'HARM01', 'open'),
  ('Digital Doctors', 'Teréz körút 28, Budapest', '2021234567', 'help@digitaldoctors.hu', 'javítószerviz', 'Specialists in smartphone and tablet repairs', 47.5080, 19.0650, 'DIGI01', 'open'),
  ('Elegance Hair Lounge', 'Oktogon tér 2, Budapest', '2022345678', 'book@elegancelounge.hu', 'fodrász', 'Premium hair care in the heart of Budapest', 47.5055, 19.0635, 'ELEG01', 'open'),
  ('Pure Bliss Spa', 'Vörösmarty tér 5, Budapest', '2023456789', 'spa@purebliss.hu', 'szépségszalon', 'Escape to tranquility with our signature treatments', 47.4960, 19.0510, 'PURE01', 'open');

-- Insert test users
INSERT INTO users (name, email, phone, address, status, role, password_hash) VALUES 
  ('John Doe', 'john.doe@example.com', '1234567890', '123 Main St, Budapest', 'active', 'user', '$2a$10$hashedpassword1'),
  ('Jane Smith', 'jane.smith@example.com', '0987654321', '456 Oak Ave, Budapest', 'active', 'user', '$2a$10$hashedpassword2'),
  ('Admin User', 'admin@bookly.com', '1122334455', '789 Admin Rd, Budapest', 'active', 'admin', '$2a$10$hashedpassword3'),
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
INSERT INTO appointments (user_id, provider_id, appointment_start, appointment_end, comment, price, status) VALUES 
  (1, 1, '2026-01-25 10:00:00', '2026-01-25 10:45:00', 'First time customer', 3500, 'scheduled'),
  (2, 3, '2026-01-25 14:00:00', '2026-01-25 15:00:00', 'Needs relaxation massage', 8000, 'scheduled'),
  (1, 5, '2026-01-26 11:00:00', '2026-01-26 12:30:00', 'Laptop not turning on', 15000, 'scheduled'),
  (4, 2, '2026-01-23 09:00:00', '2026-01-23 11:00:00', 'Want blonde highlights', 12000, 'completed'),
  (2, 6, '2026-01-22 16:00:00', '2026-01-22 16:30:00', 'Cracked iPhone screen', 7000, 'completed'),
  (1, 4, '2026-01-27 13:00:00', '2026-01-27 14:15:00', 'Anti-aging facial treatment', 9500, 'scheduled');

-- Insert test ratings
INSERT INTO ratings (user_id, provider_id, rating, comment, active) VALUES 
  (1, 1, 5, 'Excellent service! Very professional and friendly staff. Highly recommend!', TRUE),
  (2, 1, 4, 'Great haircut, but had to wait a bit longer than expected.', TRUE),
  (1, 2, 5, 'Amazing massage experience. Anna is very skilled and the atmosphere was perfect.', TRUE),
  (4, 2, 5, 'Best facial treatment I have ever had. My skin feels amazing!', TRUE),
  (2, 3, 3, 'Service was okay, but the technician seemed rushed.', TRUE),
  (1, 3, 4, 'Fixed my laptop quickly and explained the issue clearly. Good value.', TRUE),
  (4, 1, 5, 'Love my new hair color! Peter did an amazing job with the highlights.', TRUE),
  (2, 2, 4, 'Very relaxing spa experience. Will definitely come back.', TRUE),
  (1, 1, 4, 'Good service overall. The salon is clean and modern.', TRUE),
  (4, 3, 5, 'Eva was super helpful and fixed my phone screen perfectly!', TRUE);