-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: db:3306
-- Generation Time: May 04, 2026 at 08:30 PM
-- Server version: 8.0.45
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bookly_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_hungarian_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_hungarian_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_hungarian_ci NOT NULL,
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `provider_id` int NOT NULL,
  `service_id` int NOT NULL,
  `appointment_start` datetime NOT NULL,
  `appointment_end` datetime NOT NULL,
  `comment` text COLLATE utf8mb4_hungarian_ci,
  `price` int NOT NULL,
  `status` enum('scheduled','completed','canceled','no_show','deleted') COLLATE utf8mb4_hungarian_ci DEFAULT 'scheduled',
  `guest_name` varchar(255) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `guest_email` varchar(255) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `guest_phone` varchar(20) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `deleted_reason` varchar(500) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `conversations`
--

CREATE TABLE `conversations` (
  `id` int NOT NULL,
  `provider_id` int NOT NULL,
  `user_id` int NOT NULL,
  `last_message_at` timestamp NULL DEFAULT NULL,
  `last_message_preview` varchar(100) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `provider_unread_count` int DEFAULT '0',
  `user_unread_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int NOT NULL,
  `conversation_id` int NOT NULL,
  `sender_role` enum('user','provider') COLLATE utf8mb4_hungarian_ci NOT NULL,
  `sender_id` int NOT NULL,
  `content` text COLLATE utf8mb4_hungarian_ci NOT NULL,
  `appointment_id` int DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `providers`
--

CREATE TABLE `providers` (
  `id` int NOT NULL,
  `salon_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_hungarian_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_hungarian_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_hungarian_ci NOT NULL,
  `description` text COLLATE utf8mb4_hungarian_ci,
  `status` enum('active','inactive','deleted','banned') COLLATE utf8mb4_hungarian_ci DEFAULT 'inactive',
  `role` enum('provider','manager') COLLATE utf8mb4_hungarian_ci DEFAULT 'provider',
  `isManager` tinyint(1) DEFAULT '0',
  `last_login` datetime DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_hungarian_ci NOT NULL,
  `profile_picture_url` varchar(500) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `provider_time_blocks`
--

CREATE TABLE `provider_time_blocks` (
  `id` int NOT NULL,
  `provider_id` int NOT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `is_recurring` tinyint(1) DEFAULT '0',
  `recurrence_pattern` enum('daily','weekly') COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `recurrence_days` json DEFAULT NULL,
  `recurrence_end_date` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_hungarian_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ratings`
--

CREATE TABLE `ratings` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `appointment_id` int NOT NULL,
  `salon_id` int NOT NULL,
  `provider_id` int NOT NULL,
  `salon_rating` int DEFAULT NULL,
  `provider_rating` int DEFAULT NULL,
  `salon_comment` text COLLATE utf8mb4_hungarian_ci,
  `provider_comment` text COLLATE utf8mb4_hungarian_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `active` tinyint(1) DEFAULT '1'
) ;

-- --------------------------------------------------------

--
-- Table structure for table `RefTokens`
--

CREATE TABLE `RefTokens` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `provider_id` int DEFAULT NULL,
  `admin_id` int DEFAULT NULL,
  `refresh_token` text COLLATE utf8mb4_hungarian_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `salons`
--

CREATE TABLE `salons` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_hungarian_ci NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_hungarian_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `type` varchar(100) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `opening_hours` int DEFAULT NULL,
  `closing_hours` int DEFAULT NULL,
  `open_days` json DEFAULT NULL,
  `description` text COLLATE utf8mb4_hungarian_ci,
  `latitude` decimal(9,6) DEFAULT NULL,
  `longitude` decimal(9,6) DEFAULT NULL,
  `sharecode` varchar(100) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `status` enum('open','closed','renovation') COLLATE utf8mb4_hungarian_ci DEFAULT 'open',
  `banner_color` varchar(7) COLLATE utf8mb4_hungarian_ci DEFAULT '#3B82F6',
  `logo_url` varchar(500) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `banner_image_url` varchar(500) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `saved_salons`
--

CREATE TABLE `saved_salons` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `salon_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int NOT NULL,
  `provider_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_hungarian_ci NOT NULL,
  `description` text COLLATE utf8mb4_hungarian_ci,
  `duration_minutes` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `status` enum('available','unavailable') COLLATE utf8mb4_hungarian_ci DEFAULT 'available',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `service_images`
--

CREATE TABLE `service_images` (
  `id` int NOT NULL,
  `service_id` int NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_hungarian_ci NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_logs`
--

CREATE TABLE `system_logs` (
  `id` int NOT NULL,
  `level` enum('INFO','WARN','CRITICAL') COLLATE utf8mb4_hungarian_ci DEFAULT 'INFO',
  `action` varchar(100) COLLATE utf8mb4_hungarian_ci NOT NULL,
  `actor_type` enum('admin','user','provider','system') COLLATE utf8mb4_hungarian_ci DEFAULT 'system',
  `actor_id` int DEFAULT NULL,
  `target_type` varchar(50) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `target_id` int DEFAULT NULL,
  `details` text COLLATE utf8mb4_hungarian_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `status` enum('active','inactive','deleted','banned') COLLATE utf8mb4_hungarian_ci DEFAULT 'inactive',
  `role` enum('user','employee','customer') COLLATE utf8mb4_hungarian_ci DEFAULT 'user',
  `last_login` datetime DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `profile_picture_url` varchar(500) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `waitlist`
--

CREATE TABLE `waitlist` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `provider_id` int NOT NULL,
  `service_id` int NOT NULL,
  `preferred_date_from` date NOT NULL,
  `preferred_date_to` date NOT NULL,
  `preferred_time_from` time DEFAULT NULL,
  `preferred_time_to` time DEFAULT NULL,
  `status` enum('active','booked','expired','canceled') COLLATE utf8mb4_hungarian_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `provider_id` (`provider_id`),
  ADD KEY `service_id` (`service_id`);

--
-- Indexes for table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_conversation` (`provider_id`,`user_id`),
  ADD KEY `idx_conv_provider` (`provider_id`),
  ADD KEY `idx_conv_user` (`user_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appointment_id` (`appointment_id`),
  ADD KEY `idx_msg_conversation` (`conversation_id`,`created_at`);

--
-- Indexes for table `providers`
--
ALTER TABLE `providers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `phone` (`phone`),
  ADD KEY `salon_id` (`salon_id`);

--
-- Indexes for table `provider_time_blocks`
--
ALTER TABLE `provider_time_blocks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_provider_start` (`provider_id`,`start_datetime`),
  ADD KEY `idx_provider_end` (`provider_id`,`end_datetime`);

--
-- Indexes for table `ratings`
--
ALTER TABLE `ratings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_appointment_rating` (`appointment_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `salon_id` (`salon_id`),
  ADD KEY `provider_id` (`provider_id`);

--
-- Indexes for table `RefTokens`
--
ALTER TABLE `RefTokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `provider_id` (`provider_id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Indexes for table `salons`
--
ALTER TABLE `salons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sharecode` (`sharecode`);

--
-- Indexes for table `saved_salons`
--
ALTER TABLE `saved_salons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_salon` (`user_id`,`salon_id`),
  ADD KEY `salon_id` (`salon_id`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `provider_id` (`provider_id`);

--
-- Indexes for table `service_images`
--
ALTER TABLE `service_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `service_id` (`service_id`);

--
-- Indexes for table `system_logs`
--
ALTER TABLE `system_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_level` (`level`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `phone` (`phone`);

--
-- Indexes for table `waitlist`
--
ALTER TABLE `waitlist`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `provider_id` (`provider_id`),
  ADD KEY `service_id` (`service_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `conversations`
--
ALTER TABLE `conversations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `providers`
--
ALTER TABLE `providers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `provider_time_blocks`
--
ALTER TABLE `provider_time_blocks`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ratings`
--
ALTER TABLE `ratings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `RefTokens`
--
ALTER TABLE `RefTokens`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `salons`
--
ALTER TABLE `salons`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `saved_salons`
--
ALTER TABLE `saved_salons`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `service_images`
--
ALTER TABLE `service_images`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_logs`
--
ALTER TABLE `system_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `waitlist`
--
ALTER TABLE `waitlist`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`),
  ADD CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`);

--
-- Constraints for table `conversations`
--
ALTER TABLE `conversations`
  ADD CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `providers`
--
ALTER TABLE `providers`
  ADD CONSTRAINT `providers_ibfk_1` FOREIGN KEY (`salon_id`) REFERENCES `salons` (`id`);

--
-- Constraints for table `provider_time_blocks`
--
ALTER TABLE `provider_time_blocks`
  ADD CONSTRAINT `provider_time_blocks_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ratings`
--
ALTER TABLE `ratings`
  ADD CONSTRAINT `ratings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `ratings_ibfk_2` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ratings_ibfk_3` FOREIGN KEY (`salon_id`) REFERENCES `salons` (`id`),
  ADD CONSTRAINT `ratings_ibfk_4` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`);

--
-- Constraints for table `RefTokens`
--
ALTER TABLE `RefTokens`
  ADD CONSTRAINT `RefTokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `RefTokens_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `RefTokens_ibfk_3` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `saved_salons`
--
ALTER TABLE `saved_salons`
  ADD CONSTRAINT `saved_salons_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `saved_salons_ibfk_2` FOREIGN KEY (`salon_id`) REFERENCES `salons` (`id`);

--
-- Constraints for table `services`
--
ALTER TABLE `services`
  ADD CONSTRAINT `services_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`);

--
-- Constraints for table `service_images`
--
ALTER TABLE `service_images`
  ADD CONSTRAINT `service_images_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `waitlist`
--
ALTER TABLE `waitlist`
  ADD CONSTRAINT `waitlist_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `waitlist_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `waitlist_ibfk_3` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
