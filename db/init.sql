-- SGCC Break Test Database Schema & Initial Data

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Operator', 'QA Rep', 'Admin') NOT NULL DEFAULT 'Operator',
    language_pref VARCHAR(5) NOT NULL DEFAULT 'en',
    theme_pref VARCHAR(5) NOT NULL DEFAULT 'light',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configurable_lists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- 'thickness', 'glass_kind', 'interlayer_type'
    value VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_category_value (category, value)
);

CREATE TABLE IF NOT EXISTS tempered_tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_date DATE NOT NULL,
    test_time TIME NOT NULL,
    sgcc_number VARCHAR(100) NOT NULL,
    glass_type ENUM('TTG (Non-Pattern)', 'TPG (Pattern)') NOT NULL,
    thickness VARCHAR(50) NOT NULL,
    sample_size VARCHAR(50) NOT NULL,
    specimen_weight_lbs DECIMAL(8,3) NULL,
    max_allowable_particle_weight DECIMAL(10,3) NOT NULL,
    actual_10pc_particle_weight DECIMAL(10,3) NOT NULL,
    suggested_pass_fail ENUM('Pass', 'Fail') NOT NULL,
    confirmed_pass_fail ENUM('Pass', 'Fail') NOT NULL,
    confirmed_by_user_id INT NOT NULL,
    operator_name VARCHAR(100) NOT NULL,
    photo_path VARCHAR(255) NULL,
    notes TEXT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (confirmed_by_user_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS laminated_traceability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    production_date DATE NOT NULL,
    production_time TIME NOT NULL,
    sgcc_number VARCHAR(100) NULL,
    interlayer_type VARCHAR(100) NOT NULL,
    glass_type ENUM('Clear', 'Low-E', 'Satin') NOT NULL,
    glass_kind ENUM('AN', 'HS', 'FT', 'CS') NOT NULL,
    nominal_thickness VARCHAR(50) NOT NULL,
    collection_week INT NOT NULL, -- 1 to 4
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS laminated_test_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    traceability_id INT NOT NULL,
    specimen_number INT NOT NULL, -- 1 to 4
    test_date DATE NOT NULL,
    test_time TIME NOT NULL,
    specimen_temp DECIMAL(6,2) NOT NULL,
    temp_unit ENUM('C', 'F') NOT NULL DEFAULT 'F',
    measured_min_thickness DECIMAL(6,3) NOT NULL,
    drop_height_class ENUM('Class A', 'Class B') NOT NULL,
    suggested_result ENUM('1', '2', '3', '4') NOT NULL,
    confirmed_result ENUM('1', '2', '3', '4') NOT NULL,
    confirmed_by_user_id INT NOT NULL,
    photo_path VARCHAR(255) NULL,
    notes TEXT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (traceability_id) REFERENCES laminated_traceability(id) ON DELETE CASCADE,
    FOREIGN KEY (confirmed_by_user_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS roll_wave_tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_date DATE NOT NULL,
    test_time TIME NOT NULL,
    sgcc_number VARCHAR(100) NOT NULL,
    operator_name VARCHAR(100) NOT NULL,
    specimen_id VARCHAR(100) NOT NULL,
    glass_thickness VARCHAR(50) NOT NULL,
    gauge_type ENUM('Flat Bottom', 'Three Point Contact') NOT NULL,
    unit ENUM('inches', 'mm') NOT NULL DEFAULT 'inches',
    data_points JSON NOT NULL,
    average_wavelength DECIMAL(8,3) NULL,
    min_depth DECIMAL(8,5) NOT NULL,
    max_depth DECIMAL(8,5) NOT NULL,
    avg_depth DECIMAL(8,5) NOT NULL,
    max_distortion_mdpt DECIMAL(8,2) NOT NULL,
    avg_distortion_mdpt DECIMAL(8,2) NOT NULL,
    distortion_threshold_mdpt DECIMAL(8,2) NULL,
    suggested_pass_fail ENUM('Pass', 'Fail') NOT NULL,
    confirmed_pass_fail ENUM('Pass', 'Fail') NOT NULL,
    confirmed_by_user_id INT NOT NULL,
    photo_path VARCHAR(255) NULL,
    notes TEXT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (confirmed_by_user_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'tempered', 'laminated_traceability', 'laminated_test'
    entity_id INT NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSON NULL,
    new_values JSON NULL,
    changed_by_user_id INT NOT NULL,
    changed_by_username VARCHAR(100) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial default Admin user (password: AdminPass123!)
INSERT INTO users (username, password_hash, role, language_pref, theme_pref)
VALUES ('admin', '$2a$10$2J6n8l94oy1rVrjsT4hO3.wc7jbNjqVoFQ7r6rRwuaM/4vzUF14jm', 'Admin', 'en', 'light')
ON DUPLICATE KEY UPDATE password_hash='$2a$10$2J6n8l94oy1rVrjsT4hO3.wc7jbNjqVoFQ7r6rRwuaM/4vzUF14jm';

-- Seed default operator and QA rep for testing
INSERT INTO users (username, password_hash, role, language_pref, theme_pref)
VALUES 
('operator1', '$2a$10$2J6n8l94oy1rVrjsT4hO3.wc7jbNjqVoFQ7r6rRwuaM/4vzUF14jm', 'Operator', 'en', 'light'),
('qarep', '$2a$10$2J6n8l94oy1rVrjsT4hO3.wc7jbNjqVoFQ7r6rRwuaM/4vzUF14jm', 'QA Rep', 'en', 'dark')
ON DUPLICATE KEY UPDATE password_hash='$2a$10$2J6n8l94oy1rVrjsT4hO3.wc7jbNjqVoFQ7r6rRwuaM/4vzUF14jm';

-- Seed configurable lists
INSERT INTO configurable_lists (category, value, sort_order) VALUES
('thickness', '1/8"', 1),
('thickness', '5/32"', 2),
('thickness', '3/16"', 3),
('thickness', '1/4"', 4),
('thickness', '5/16"', 5),
('thickness', '3/8"', 6),
('thickness', '1/2"', 7),
('thickness', '5/8"', 8),
('thickness', '3/4"', 9),
('glass_kind', 'AN', 1),
('glass_kind', 'HS', 2),
('glass_kind', 'FT', 3),
('glass_kind', 'CS', 4),
('interlayer_type', 'PVB', 1),
('interlayer_type', 'SentryGlas', 2),
('interlayer_type', 'EVA', 3)
ON DUPLICATE KEY UPDATE id=id;
