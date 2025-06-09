-- Create database if not exists
CREATE DATABASE IF NOT EXISTS projectsync;
USE projectsync;

-- Create user table
CREATE TABLE `user` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    roles JSON NOT NULL
);

-- Create client table
CREATE TABLE client (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cif VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    web VARCHAR(255)
);

-- Create repo table
CREATE TABLE repo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT,
    client_id INT,
    projectname VARCHAR(255) NOT NULL,
    description TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    FOREIGN KEY (owner_id) REFERENCES `user`(id),
    FOREIGN KEY (client_id) REFERENCES client(id)
);

-- Create repo_colaboradores table (many-to-many relationship between repo and user)
CREATE TABLE repo_colaboradores (
    repo_id INT,
    user_id INT,
    PRIMARY KEY (repo_id, user_id),
    FOREIGN KEY (repo_id) REFERENCES repo(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES `user`(id) ON DELETE CASCADE
);

-- Create project_file table
CREATE TABLE project_file (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    project_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    fecha_subida DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES `user`(id),
    FOREIGN KEY (project_id) REFERENCES repo(id)
);

-- Create indexes for better performance
CREATE INDEX idx_repo_owner ON repo(owner_id);
CREATE INDEX idx_repo_client ON repo(client_id);
CREATE INDEX idx_project_file_user ON project_file(user_id);
CREATE INDEX idx_project_file_project ON project_file(project_id);
CREATE INDEX idx_repo_colaboradores_repo ON repo_colaboradores(repo_id);
CREATE INDEX idx_repo_colaboradores_user ON repo_colaboradores(user_id);

-- Insert sample data

-- Insert users (password is 'password' hashed)
INSERT INTO `user` (username, email, password, roles) VALUES
('admin', 'admin@example.com', 'admin', '["ROLE_ADMIN"]'),
('user1', 'user1@example.com', 'user1', '["ROLE_USER"]'),
('user2', 'user2@example.com', 'user2', '["ROLE_USER"]');

-- Insert clients
INSERT INTO client (name, cif, email, phone, web) VALUES
('Empresa A', 'A12345678', 'empresaA@example.com', '912345678', 'www.empresaa.com'),
('Empresa B', 'B87654321', 'empresaB@example.com', '923456789', 'www.empresab.com'),
('Empresa C', 'C11223344', 'empresaC@example.com', '934567890', 'www.empresac.com');

-- Insert repos
INSERT INTO repo (owner_id, client_id, projectname, description, fecha_inicio, fecha_fin) VALUES
(1, 1, 'Proyecto Web A', 'Desarrollo de sitio web para Empresa A', '2024-01-01', '2024-06-30'),
(2, 2, 'App Móvil B', 'Desarrollo de aplicación móvil para Empresa B', '2024-02-01', '2024-07-31'),
(3, 3, 'Sistema CRM C', 'Implementación de sistema CRM para Empresa C', '2024-03-01', '2024-08-31');

-- Insert repo_colaboradores
INSERT INTO repo_colaboradores (repo_id, user_id) VALUES
(1, 2),
(1, 3),
(2, 1),
(2, 3),
(3, 1),
(3, 2);

-- Insert project_files
INSERT INTO project_file (user_id, project_id, file_name, original_name, fecha_subida) VALUES
(1, 1, 'documento1.pdf', 'documento_original1.pdf', '2024-01-15 10:00:00'),
(2, 2, 'presentacion.pptx', 'presentacion_original.pptx', '2024-02-15 11:30:00'),
(3, 3, 'contrato.docx', 'contrato_original.docx', '2024-03-15 09:15:00');

-- Quita o comenta estas líneas si ya existen
-- CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY '';
-- GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

-- Añade estas líneas:
ALTER USER 'root'@'localhost' IDENTIFIED BY '';
ALTER USER 'root'@'%' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;