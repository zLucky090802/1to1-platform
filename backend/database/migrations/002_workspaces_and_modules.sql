-- ============================================================
-- 002_workspaces_and_modules.sql
-- Workspace del profesional + catálogo de módulos activables
-- ============================================================
-- DECISIÓN CLAVE:
-- workspace_modules.config es JSON.
-- Cada módulo guarda su propia configuración sin nuevas tablas.
-- Ejemplo fitness:  {"show_photos": true, "metrics": ["weight","body_fat"]}
-- Ejemplo legal:    {"require_id_upload": true, "max_docs_per_case": 20}
-- Ejemplo finanzas: {"currency": "COP", "show_net_worth": false}
-- Agregar una categoría nueva = definir su config JSON, no alterar el schema.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Workspaces
-- Cada profesional tiene exactamente UN workspace activo.
-- El invite_token es el link que le comparte al cliente.
-- Cuando el cliente entra con ese token, ve el workspace
-- y se registra justo en ese momento (no antes).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspaces (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  professional_id CHAR(36)   NOT NULL,
  name          VARCHAR(150) NOT NULL,
  description   TEXT,
  invite_token  CHAR(36)     NOT NULL DEFAULT (UUID()),  -- token único del link
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_workspace_professional (professional_id),   -- 1 workspace por profesional
  UNIQUE KEY uq_workspace_token        (invite_token),
  CONSTRAINT fk_workspace_professional
    FOREIGN KEY (professional_id) REFERENCES professional_profiles(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------
-- Catálogo de tipos de módulos (seed data)
-- Esta tabla es casi estática — la llenas con INSERT al migrar.
-- Cada fila = un tipo de módulo que el sistema soporta.
-- El profesional activa los que quiere de este catálogo.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS module_types (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  key_name    VARCHAR(50)  NOT NULL,          -- 'TRACKER', 'PLANS', 'DOCS', 'CHAT', 'NOTES'
  label       VARCHAR(100) NOT NULL,          -- "Seguimiento y métricas"
  description TEXT,
  icon        VARCHAR(50),                    -- nombre del ícono Angular Material
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,

  PRIMARY KEY (id),
  UNIQUE KEY uq_module_key (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed: módulos disponibles en v1
INSERT IGNORE INTO module_types (id, key_name, label, description, icon) VALUES
  (UUID(), 'PLANS',   'Planes y programas',     'Crea rutinas, dietas o programas y asígnalos a tus clientes',        'assignment'),
  (UUID(), 'TRACKER', 'Seguimiento de métricas','Define qué quieres medir y el cliente registra su progreso diario',   'show_chart'),
  (UUID(), 'CHAT',    'Chat directo',            'Mensajería asincrónica entre el profesional y el cliente',            'chat'),
  (UUID(), 'DOCS',    'Documentos y archivos',   'Solicita y recibe archivos de tus clientes de forma organizada',      'folder'),
  (UUID(), 'NOTES',   'Notas de sesión',         'Resumen y notas privadas de cada sesión para el profesional',         'note');


-- ------------------------------------------------------------
-- Módulos activos por workspace
-- El profesional activa módulos de su catálogo.
-- config (JSON) guarda las opciones específicas del módulo.
-- display_order define el orden en que aparecen al cliente.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspace_modules (
  id             CHAR(36)    NOT NULL DEFAULT (UUID()),
  workspace_id   CHAR(36)    NOT NULL,
  module_type_id CHAR(36)    NOT NULL,
  config         JSON,                               -- opciones del módulo
  is_active      TINYINT(1)  NOT NULL DEFAULT 1,
  display_order  SMALLINT    NOT NULL DEFAULT 0,
  created_at     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_workspace_module (workspace_id, module_type_id),  -- no duplicar módulos
  INDEX idx_wm_workspace (workspace_id),
  CONSTRAINT fk_wm_workspace
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_wm_module_type
    FOREIGN KEY (module_type_id) REFERENCES module_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------
-- Relación profesional → cliente dentro de un workspace
-- Un cliente puede estar en múltiples workspaces (varios coaches)
-- Un workspace puede tener múltiples clientes.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_enrollments (
  id           CHAR(36)  NOT NULL DEFAULT (UUID()),
  workspace_id CHAR(36)  NOT NULL,
  client_id    CHAR(36)  NOT NULL,
  status       ENUM('invited', 'active', 'paused', 'cancelled') NOT NULL DEFAULT 'invited',
  enrolled_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_enrollment (workspace_id, client_id),
  INDEX idx_enrollment_client    (client_id),
  INDEX idx_enrollment_workspace (workspace_id),
  INDEX idx_enrollment_status    (status),
  CONSTRAINT fk_enrollment_workspace
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_enrollment_client
    FOREIGN KEY (client_id) REFERENCES client_profiles(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
