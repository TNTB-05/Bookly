CREATE TABLE IF NOT EXISTS users (
  `id` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `phone` VARCHAR(20) UNIQUE NOT NULL,
  `address` VARCHAR(255),
  `status` ENUM('active', 'inactive', 'deleted', 'banned') DEFAULT 'inactive',
  `role` ENUM('user', 'employee', 'admin') DEFAULT 'user',
  `last_login` DATETIME,
  `password_hash` VARCHAR(255) NOT NULL,
  `access_token` TEXT,
  `refresh_token` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS providers (
  `id` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `phone` VARCHAR(20) UNIQUE NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` ENUM('active', 'inactive', 'deleted', 'banned') DEFAULT 'inactive',
  `last_login` DATETIME,
  `password_hash` VARCHAR(255) NOT NULL,
  `access_token` TEXT,
  `refresh_token` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  -- rating DECIMAL(2,1) DEFAULT 0.0 - consider adding later
);

CREATE TABLE IF NOT EXISTS services (
  `id` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `duration_minutes` INT NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `status` ENUM('available', 'unavailable') DEFAULT 'available',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
  `id` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `provider_id` INT NOT NULL,
  `service_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `phone` VARCHAR(20) UNIQUE NOT NULL,
  `status` ENUM('active', 'inactive', 'deleted', 'banned') DEFAULT 'inactive',
  `role` ENUM('user', 'employee', 'admin') DEFAULT 'employee',
  `last_login` DATETIME,
  `password_hash` VARCHAR(255) NOT NULL,
  `access_token` TEXT,
  `refresh_token` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES providers(id),
  FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE TABLE IF NOT EXISTS appointments (
  `id` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `user_id` INT NOT NULL,
  `employee_id` INT NOT NULL,
  `appointment_start` DATETIME NOT NULL,
  `appointment_end` DATETIME NOT NULL,
  `comment` TEXT,
  `price` INT NOT NULL,
  `status` ENUM('scheduled', 'completed', 'canceled', 'no_show') DEFAULT 'scheduled',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);


-- Optional: Insert sample data (seed)

-- Insert test users
INSERT INTO users (name, email, phone, address, status, role, password_hash) VALUES 
  ('John Doe', 'john.doe@example.com', '1234567890', '123 Main St, Budapest', 'active', 'user', '$2a$10$hashedpassword1'),
  ('Jane Smith', 'jane.smith@example.com', '0987654321', '456 Oak Ave, Budapest', 'active', 'user', '$2a$10$hashedpassword2'),
  ('Admin User', 'admin@bookly.com', '1122334455', '789 Admin Rd, Budapest', 'active', 'admin', '$2a$10$hashedpassword3'),
  ('Test User', 'test@example.com', '5544332211', '321 Test Ln, Budapest', 'inactive', 'user', '$2a$10$hashedpassword4');

-- Insert test providers
INSERT INTO providers (name, email, phone, address, description, status, password_hash) VALUES 
  ('Premium Hair Salon', 'contact@premiumhair.com', '2012345678', '100 Beauty Blvd, Budapest', 'Top-rated hair salon with expert stylists', 'active', '$2a$10$hashedpassword5'),
  ('Wellness Spa Center', 'info@wellnessspa.com', '2098765432', '200 Relaxation St, Budapest', 'Full-service spa offering massage and beauty treatments', 'active', '$2a$10$hashedpassword6'),
  ('Tech Repair Pro', 'support@techrepair.com', '2011223344', '300 Tech Ave, Budapest', 'Professional electronics repair service', 'active', '$2a$10$hashedpassword7');

-- Insert test services
INSERT INTO services (name, description, duration_minutes, price, status) VALUES 
  ('Haircut', 'Professional haircut with styling', 45, 3500.00, 'available'),
  ('Hair Coloring', 'Full hair coloring service', 120, 12000.00, 'available'),
  ('Swedish Massage', 'Relaxing full-body massage', 60, 8000.00, 'available'),
  ('Facial Treatment', 'Deep cleansing facial with mask', 75, 9500.00, 'available'),
  ('Laptop Repair', 'Diagnostic and repair service', 90, 15000.00, 'available'),
  ('Phone Screen Replacement', 'Replace broken phone screen', 30, 7000.00, 'available');

-- Insert test employees
INSERT INTO employees (provider_id, service_id, name, email, phone, status, role, password_hash) VALUES 
  (1, 1, 'Maria Kovacs', 'maria.kovacs@premiumhair.com', '3011111111', 'active', 'employee', '$2a$10$hashedpassword8'),
  (1, 2, 'Peter Nagy', 'peter.nagy@premiumhair.com', '3022222222', 'active', 'employee', '$2a$10$hashedpassword9'),
  (2, 3, 'Anna Toth', 'anna.toth@wellnessspa.com', '3033333333', 'active', 'employee', '$2a$10$hashedpassword10'),
  (2, 4, 'Balazs Kiss', 'balazs.kiss@wellnessspa.com', '3044444444', 'active', 'employee', '$2a$10$hashedpassword11'),
  (3, 5, 'Gabor Horvath', 'gabor.horvath@techrepair.com', '3055555555', 'active', 'employee', '$2a$10$hashedpassword12'),
  (3, 6, 'Eva Varga', 'eva.varga@techrepair.com', '3066666666', 'active', 'employee', '$2a$10$hashedpassword13');

-- Insert test appointments
INSERT INTO appointments (user_id, employee_id, appointment_start, appointment_end, comment, price, status) VALUES 
  (1, 1, '2026-01-25 10:00:00', '2026-01-25 10:45:00', 'First time customer', 3500, 'scheduled'),
  (2, 3, '2026-01-25 14:00:00', '2026-01-25 15:00:00', 'Needs relaxation massage', 8000, 'scheduled'),
  (1, 5, '2026-01-26 11:00:00', '2026-01-26 12:30:00', 'Laptop not turning on', 15000, 'scheduled'),
  (4, 2, '2026-01-23 09:00:00', '2026-01-23 11:00:00', 'Want blonde highlights', 12000, 'completed'),
  (2, 6, '2026-01-22 16:00:00', '2026-01-22 16:30:00', 'Cracked iPhone screen', 7000, 'completed'),
  (1, 4, '2026-01-27 13:00:00', '2026-01-27 14:15:00', 'Anti-aging facial treatment', 9500, 'scheduled');