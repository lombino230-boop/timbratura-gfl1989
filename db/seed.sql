-- Add initial data for testing

-- 1. Create an admin user (Password: "admin123")
INSERT INTO users (name, email, password_hash, role) 
VALUES (
    'Amministratore', 
    'admin@example.com', 
    '$2b$10$wO3r2h4iJ8/O4.6.4W041.L/Xp1vXvXvXvXvXvXvXvXvXvXvXvXvX', -- Mock hash for 'admin123'
    'admin'
);

-- 2. Create an employee user (Password: "user123")
INSERT INTO users (name, email, password_hash, role) 
VALUES (
    'Mario Rossi', 
    'mario@example.com', 
    '$2b$10$wO3r2h4iJ8/O4.6.4W041.L/Xp1vXvXvXvXvXvXvXvXvXvXvXvXvX', -- Mock hash for 'user123'
    'employee'
);

-- 3. Create an authorized location (Sede Centrale)
-- Latitude and Longitude for testing (e.g., Rome)
INSERT INTO locations (name, address, latitude, longitude, radius_meters)
VALUES (
    'Sede Centrale', 
    'Via Roma 1, Roma', 
    41.8902, 
    12.4922, 
    500
);
