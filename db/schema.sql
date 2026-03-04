-- Database schema for Time GFL Digital Clocking App

-- Create extension for UUID if needed (optional)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for users (Employees and Admins)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for authorized locations (Workplaces)
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER DEFAULT 100, -- Maximum distance allowed for clocking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for work sessions (Clock-ins and Clock-outs)
CREATE TABLE IF NOT EXISTS work_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL, -- Current location at time of entry
    
    in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    in_lat DECIMAL(10, 8) NOT NULL,
    in_lon DECIMAL(11, 8) NOT NULL,
    in_note TEXT,
    
    out_time TIMESTAMP WITH TIME ZONE,
    out_lat DECIMAL(10, 8),
    out_lon DECIMAL(11, 8),
    out_note TEXT,
    
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_work_sessions_user_id ON work_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_in_time ON work_sessions(in_time);

-- Initial data (optional - only for development)
-- INSERT INTO users (name, email, password_hash, role) VALUES ('Admin', 'admin@example.com', '$2b$10$YourHashedPasswordHere', 'admin');
