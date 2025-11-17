-- Establecer la base de datos a usar
USE deployment_tracker;

-- -----------------------------------------------------
-- Table programas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS programas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table responsables
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS responsables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table plataformas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS plataformas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table despliegues
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS despliegues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Campos con relaciones
    programaId INT NOT NULL,
    responsableId INT NOT NULL,

    -- Campos del despliegue
    fecha DATETIME NOT NULL,
    entorno ENUM('Preproducción', 'Producción') NOT NULL,
    plataforma VARCHAR(255) NOT NULL, -- Usamos el nombre como string o el ID de la tabla 'plataformas'
    version VARCHAR(255) NOT NULL,
    
    -- Campos opcionales
    accion TEXT,
    comentario TEXT,
    hasSwagger TINYINT(1) DEFAULT 0, -- Booleano (0 o 1)
    url VARCHAR(255),
    port VARCHAR(10),

    -- Claves foráneas (para mantener la integridad de los datos)
    FOREIGN KEY (programaId) REFERENCES programas(id),
    FOREIGN KEY (responsableId) REFERENCES responsables(id)
) ENGINE=InnoDB;

-- Insertar plataformas iniciales (como en tu repositorio JSON)
INSERT IGNORE INTO plataformas (nombre) VALUES 
('IIS'), 
('Docker');