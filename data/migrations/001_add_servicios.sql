-- Migración idempotente: segura de ejecutar múltiples veces

CREATE TABLE IF NOT EXISTS servicios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  color       VARCHAR(7)  NULL,
  created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE programas
  ADD COLUMN IF NOT EXISTS servicioId INT NULL;

SET @fk_exists = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'programas'
    AND CONSTRAINT_NAME = 'fk_programa_servicio'
);

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE programas ADD CONSTRAINT fk_programa_servicio FOREIGN KEY (servicioId) REFERENCES servicios(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
