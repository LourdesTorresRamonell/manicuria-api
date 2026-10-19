-- ============================================================
-- Manicuría API - Esquema de base de datos (MySQL 8)
-- Ejecutalo en MySQL Workbench: File > Open SQL Script > Run
-- Si preferís que Sequelize cree las tablas solo, dejá DB_SYNC=true
-- ============================================================

CREATE DATABASE IF NOT EXISTS manicuria_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE manicuria_db;

-- ------------------------------------------------------------
-- Usuarios (clientas y administradoras)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL,
  password    VARCHAR(255) NOT NULL,           -- hash bcrypt, nunca texto plano
  telefono    VARCHAR(30)  NULL,
  rol         ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Servicios que ofrece la manicuría
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS servicios (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre            VARCHAR(100) NOT NULL,
  descripcion       VARCHAR(500) NULL,
  precio            DECIMAL(10,2) NOT NULL,
  duracion_minutos  INT UNSIGNED NOT NULL,
  activo            TINYINT(1) NOT NULL DEFAULT 1,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_servicios_nombre (nombre)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Turnos (reservas): un usuario reserva un servicio en fecha/hora
-- Relaciones:
--   usuarios 1 --- N turnos
--   servicios 1 --- N turnos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS turnos (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id   INT UNSIGNED NOT NULL,
  servicio_id  INT UNSIGNED NOT NULL,
  fecha        DATE NOT NULL,
  hora         TIME NOT NULL,
  estado       ENUM('pendiente', 'confirmado', 'cancelado', 'completado') NOT NULL DEFAULT 'pendiente',
  notas        VARCHAR(500) NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_turnos_fecha (fecha),
  CONSTRAINT fk_turnos_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_turnos_servicio
    FOREIGN KEY (servicio_id) REFERENCES servicios (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;
