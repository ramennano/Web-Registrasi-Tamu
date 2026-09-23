-- Buat tabel untuk Perusahaan / Instansi
CREATE TABLE instansi (
  id SERIAL PRIMARY KEY,
  nama_instansi VARCHAR NOT NULL
);

-- Buat tabel untuk Orang yang Dituju (Karyawan/Atasan)
CREATE TABLE orang_tujuan (
  id SERIAL PRIMARY KEY,
  nama_orang VARCHAR NOT NULL
);

-- Buat tabel Registrasi Tamu
CREATE TABLE tamu (
  id SERIAL PRIMARY KEY,
  nama_tamu VARCHAR NOT NULL,
  instansi_id INT REFERENCES instansi(id),
  tujuan_id INT REFERENCES orang_tujuan(id),
  keperluan TEXT,
  status VARCHAR DEFAULT 'Pending', -- Bisa 'Pending', 'Approved', 'Rejected'
  waktu_masuk TIMESTAMP DEFAULT NOW()
);

-- Buat tabel Profil Pengguna (Role: admin atau atasan)
CREATE TABLE user_roles (
  user_id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  role VARCHAR NOT NULL CHECK (role IN ('admin', 'atasan'))
);

-- Insert data dummy awal (Opsional)
INSERT INTO instansi (nama_instansi) VALUES ('PT Mencari Cinta Sejati'), ('Dinas Kominfo');
INSERT INTO orang_tujuan (nama_orang) VALUES ('Budi (Manager)'), ('Siti (HRD)');