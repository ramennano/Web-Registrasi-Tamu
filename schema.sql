-- Supabase Schema for Visitor Management System

CREATE TABLE IF NOT EXISTS web_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value TEXT
);

INSERT INTO web_settings (setting_key, setting_value) VALUES 
('company_name', 'PT Solusi Bisnis Indonesia'),
('logo_url', ''),
('wallpaper_url', '')
ON CONFLICT (setting_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS approved_companies (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) UNIQUE NOT NULL
);

INSERT INTO approved_companies (company_name) VALUES 
('PT Teknologi Nusantara'), 
('PT Maju Bersama Jaya'),
('PT Global Mandiri')
ON CONFLICT (company_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS id_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO id_types (type_name) VALUES 
('KTP'), 
('SIM'), 
('Paspor'), 
('ID Card Karyawan')
ON CONFLICT (type_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'super_admin'))
);

INSERT INTO users (username, password, role) VALUES 
('superadmin', 'super123', 'super_admin'),
('admin', 'admin123', 'admin')
ON CONFLICT (username) DO NOTHING;

CREATE TABLE IF NOT EXISTS guests (
    id SERIAL PRIMARY KEY,
    guest_id VARCHAR(30) UNIQUE NOT NULL,
    fullname VARCHAR(150) NOT NULL,
    id_type VARCHAR(50) NOT NULL,
    origin_company VARCHAR(150) NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT NOW()
);
