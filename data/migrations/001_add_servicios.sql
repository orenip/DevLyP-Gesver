-- Migración idempotente: segura de ejecutar múltiples veces

CREATE TABLE IF NOT EXISTS servicios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  color       VARCHAR(7)  NULL,
  created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- MySQL 8.0 no soporta ADD COLUMN IF NOT EXISTS (es sintaxis MariaDB)
-- Este bloque añade la columna solo si no existe
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'programas'
    AND COLUMN_NAME = 'servicioId'
);

SET @sql_col = IF(@col_exists = 0,
  'ALTER TABLE programas ADD COLUMN servicioId INT NULL',
  'SELECT 1'
);
PREPARE stmt_col FROM @sql_col;
EXECUTE stmt_col;
DEALLOCATE PREPARE stmt_col;

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
