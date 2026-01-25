-- Demo data for Provider ID 7 (asd@asd.com)
-- Run this after the provider has been created through registration

USE bookly_db;

-- First, add services for provider 7
INSERT INTO services (provider_id, name, description, duration_minutes, price, status) VALUES 
  (7, 'Haircut & Styling', 'Complete hair styling service', 60, 4500.00, 'available'),
  (7, 'Beard Trim', 'Professional beard grooming', 30, 2000.00, 'available'),
  (7, 'Hair Wash & Blowdry', 'Wash and professional blowdry', 45, 3000.00, 'available');

-- Insert demo appointments for January 2026
-- Note: Service IDs will be auto-assigned. Adjust if needed based on your actual service IDs
-- You can find actual service IDs by running: SELECT id, name FROM services WHERE provider_id = 7;

INSERT INTO appointments (user_id, provider_id, service_id, appointment_start, appointment_end, comment, price, status) VALUES 
  -- Week of Jan 20-24 (past appointments - completed)
  (1, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Haircut & Styling' LIMIT 1), '2026-01-20 09:00:00', '2026-01-20 10:00:00', 'Regular customer', 4500, 'completed'),
  (2, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Beard Trim' LIMIT 1), '2026-01-20 10:30:00', '2026-01-20 11:00:00', 'Beard maintenance', 2000, 'completed'),
  (4, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Haircut & Styling' LIMIT 1), '2026-01-20 14:00:00', '2026-01-20 15:00:00', 'Special occasion haircut', 4500, 'completed'),
  (1, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Hair Wash & Blowdry' LIMIT 1), '2026-01-20 15:30:00', '2026-01-20 16:15:00', NULL, 3000, 'completed'),
  
  (2, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Haircut & Styling' LIMIT 1), '2026-01-21 09:30:00', '2026-01-21 10:30:00', 'First time here', 4500, 'completed'),
  (4, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Beard Trim' LIMIT 1), '2026-01-21 11:00:00', '2026-01-21 11:30:00', NULL, 2000, 'completed'),
  (1, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Hair Wash & Blowdry' LIMIT 1), '2026-01-21 13:00:00', '2026-01-21 13:45:00', 'Quick service needed', 3000, 'completed'),
  (2, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Haircut & Styling' LIMIT 1), '2026-01-21 16:00:00', '2026-01-21 17:00:00', 'Wedding next week', 4500, 'completed'),
  
  (4, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Haircut & Styling' LIMIT 1), '2026-01-22 10:00:00', '2026-01-22 11:00:00', NULL, 4500, 'completed'),
  (1, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Beard Trim' LIMIT 1), '2026-01-22 11:30:00', '2026-01-22 12:00:00', 'Trim and shape', 2000, 'completed'),
  (2, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Hair Wash & Blowdry' LIMIT 1), '2026-01-22 14:30:00', '2026-01-22 15:15:00', NULL, 3000, 'completed'),
  
  (1, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Haircut & Styling' LIMIT 1), '2026-01-23 09:00:00', '2026-01-23 10:00:00', 'Monthly haircut', 4500, 'completed'),
  (4, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Haircut & Styling' LIMIT 1), '2026-01-23 10:30:00', '2026-01-23 11:30:00', NULL, 4500, 'completed'),
  (2, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Beard Trim' LIMIT 1), '2026-01-23 13:00:00', '2026-01-23 13:30:00', 'Quick beard trim', 2000, 'completed'),
  (1, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Hair Wash & Blowdry' LIMIT 1), '2026-01-23 15:00:00', '2026-01-23 15:45:00', 'Blowdry for event', 3000, 'completed'),
  
  -- Today (Jan 24) - mix of completed and scheduled
  (2, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Haircut & Styling' LIMIT 1), '2026-01-24 09:00:00', '2026-01-24 10:00:00', 'Early appointment', 4500, 'completed'),
  (4, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Beard Trim' LIMIT 1), '2026-01-24 10:30:00', '2026-01-24 11:00:00', NULL, 2000, 'completed'),
  (1, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Haircut & Styling' LIMIT 1), '2026-01-24 14:00:00', '2026-01-24 15:00:00', 'Afternoon slot', 4500, 'scheduled'),
  (2, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Hair Wash & Blowdry' LIMIT 1), '2026-01-24 15:30:00', '2026-01-24 16:15:00', NULL, 3000, 'scheduled'),
  (4, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Beard Trim' LIMIT 1), '2026-01-24 17:00:00', '2026-01-24 17:30:00', 'After work', 2000, 'scheduled'),
  
  -- Week of Jan 27-31 (future appointments - all scheduled)
  (1, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Haircut & Styling' LIMIT 1), '2026-01-27 09:30:00', '2026-01-27 10:30:00', 'Regular appointment', 4500, 'scheduled'),
  (2, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Beard Trim' LIMIT 1), '2026-01-27 11:00:00', '2026-01-27 11:30:00', NULL, 2000, 'scheduled'),
  (4, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Haircut & Styling' LIMIT 1), '2026-01-27 14:00:00', '2026-01-27 15:00:00', 'New style', 4500, 'scheduled'),
  (1, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Hair Wash & Blowdry' LIMIT 1), '2026-01-27 16:00:00', '2026-01-27 16:45:00', NULL, 3000, 'scheduled'),
  
  (2, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Haircut & Styling' LIMIT 1), '2026-01-28 10:00:00', '2026-01-28 11:00:00', NULL, 4500, 'scheduled'),
  (4, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Beard Trim' LIMIT 1), '2026-01-28 11:30:00', '2026-01-28 12:00:00', 'Maintenance trim', 2000, 'scheduled'),
  (1, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Haircut & Styling' LIMIT 1), '2026-01-28 13:30:00', '2026-01-28 14:30:00', NULL, 4500, 'scheduled'),
  (2, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Hair Wash & Blowdry' LIMIT 1), '2026-01-28 15:00:00', '2026-01-28 15:45:00', 'Quick blowdry', 3000, 'scheduled'),
  
  (4, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Haircut & Styling' LIMIT 1), '2026-01-29 09:00:00', '2026-01-29 10:00:00', 'Fresh cut', 4500, 'scheduled'),
  (1, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Beard Trim' LIMIT 1), '2026-01-29 10:30:00', '2026-01-29 11:00:00', NULL, 2000, 'scheduled'),
  (2, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Haircut & Styling' LIMIT 1), '2026-01-29 14:00:00', '2026-01-29 15:00:00', NULL, 4500, 'scheduled'),
  (4, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Hair Wash & Blowdry' LIMIT 1), '2026-01-29 16:00:00', '2026-01-29 16:45:00', 'Evening appointment', 3000, 'scheduled'),
  
  (1, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Haircut & Styling' LIMIT 1), '2026-01-30 09:30:00', '2026-01-30 10:30:00', NULL, 4500, 'scheduled'),
  (2, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Beard Trim' LIMIT 1), '2026-01-30 11:00:00', '2026-01-30 11:30:00', 'Quick service', 2000, 'scheduled'),
  (4, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Haircut & Styling' LIMIT 1), '2026-01-30 13:00:00', '2026-01-30 14:00:00', 'Important meeting tomorrow', 4500, 'scheduled'),
  (1, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Hair Wash & Blowdry' LIMIT 1), '2026-01-30 15:30:00', '2026-01-30 16:15:00', NULL, 3000, 'scheduled'),
  
  (2, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Haircut & Styling' LIMIT 1), '2026-01-31 10:00:00', '2026-01-31 11:00:00', 'End of month appointment', 4500, 'scheduled'),
  (4, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Beard Trim' LIMIT 1), '2026-01-31 11:30:00', '2026-01-31 12:00:00', NULL, 2000, 'scheduled'),
  (1, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Haircut & Styling' LIMIT 1), '2026-01-31 14:30:00', '2026-01-31 15:30:00', NULL, 4500, 'scheduled'),
  (2, 7, (SELECT id FROM services WHERE provider_id = 7 AND name = 'Hair Wash & Blowdry' LIMIT 1), '2026-01-31 16:00:00', '2026-01-31 16:45:00', 'Last slot of the month', 3000, 'scheduled');

-- Verify the data was inserted
SELECT COUNT(*) as total_appointments FROM appointments WHERE provider_id = 7;
SELECT DATE(appointment_start) as date, COUNT(*) as appointments_count 
FROM appointments 
WHERE provider_id = 7 
GROUP BY DATE(appointment_start) 
ORDER BY date;
