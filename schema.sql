CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Web Settings Table[cite: 4]
CREATE TABLE IF NOT EXISTS web_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value TEXT
);

INSERT INTO web_settings (setting_key, setting_value) VALUES 
('company_name', 'PT Solusi Teknologi Indonesia'),
('logo_url', ''),
('wallpaper_url', '')
ON CONFLICT (setting_key) DO NOTHING;

-- Approved Companies (Whitelist) Table[cite: 4]
CREATE TABLE IF NOT EXISTS approved_companies (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL UNIQUE
);

INSERT INTO approved_companies (company_name) VALUES 
('PT Maju Bersama'), 
('PT Teknologi Nusantara'), 
('PT Global Solusi')
ON CONFLICT (company_name) DO NOTHING;

-- ID Types Table[cite: 4]
CREATE TABLE IF NOT EXISTS id_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO id_types (name) VALUES 
('KTP'), 
('SIM'), 
('Paspor'), 
('KID')
ON CONFLICT (name) DO NOTHING;

-- Users Table (Admin & Super Admin, tanpa email)[cite: 4]
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'super_admin'))
);

INSERT INTO users (username, password, role) VALUES 
('superadmin', 'super123', 'super_admin'),
('admin', 'admin123', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Guests Table[cite: 4]
CREATE TABLE IF NOT EXISTS guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id VARCHAR(30) UNIQUE NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    id_type VARCHAR(50) NOT NULL,
    id_number VARCHAR(50) NOT NULL,
    origin_company VARCHAR(100) NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT NOW()
);