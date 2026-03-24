-- ============================================================
-- 001_users_and_auth.sql
-- Tablas base: usuarios, perfiles, tokens de refresco
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Tabla principal de usuarios
-- Un usuario puede ser profesional O cliente.
-- El rol vive en el token JWT pero también aquí para queries.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('professional', 'client') NOT NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------
-- Perfil del profesional
-- Separado de users para no mezclar datos de identidad
-- con datos de presentación pública.
-- El campo category hoy es ENUM.
-- Cuando agreguemos más categorías sin deployer código,
-- lo convertimos en FK a una tabla categories. (Sprint 5+)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS professional_profiles (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id      CHAR(36)     NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  slug         VARCHAR(100) NOT NULL,              -- URL pública: /p/drmaria
  category     ENUM(
                 'fitness',
                 'nutrition',
                 'legal',
                 'finance',
                 'psychology',
                 'education',
                 'other'
               ) NOT NULL DEFAULT 'other',
  bio          TEXT,
  avatar_url   VARCHAR(500),
  is_public    TINYINT(1)   NOT NULL DEFAULT 0,    -- perfil público activado
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_prof_user   (user_id),
  UNIQUE KEY uq_prof_slug   (slug),
  CONSTRAINT fk_prof_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------
-- Perfil del cliente
-- Datos mínimos de presentación. 
-- No necesita categoría ni slug — no tiene página pública.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_profiles (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id      CHAR(36)     NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url   VARCHAR(500),
  date_of_birth DATE,                              -- opcional, útil para salud
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_client_user (user_id),
  CONSTRAINT fk_client_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------
-- Refresh tokens
-- El access JWT dura 15 min.
-- El refresh token dura 30 días, vive en httpOnly cookie.
-- Guardamos el hash (nunca el token en claro) para poder
-- invalidar sesiones específicas sin cerrar todas.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id     CHAR(36)     NOT NULL,
  token_hash  VARCHAR(255) NOT NULL,               -- SHA-256 del token
  device_info VARCHAR(255),                        -- user-agent opcional
  expires_at  DATETIME     NOT NULL,
  revoked_at  DATETIME,                            -- NULL = activo
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_refresh_user    (user_id),
  INDEX idx_refresh_hash    (token_hash),
  INDEX idx_refresh_expires (expires_at),
  CONSTRAINT fk_refresh_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
