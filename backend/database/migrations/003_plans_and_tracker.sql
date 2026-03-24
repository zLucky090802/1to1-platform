-- ============================================================
-- 003_plans_and_tracker.sql
-- Sistema de planes asignables + tracker de métricas
-- ============================================================
-- DECISIÓN CLAVE:
-- plan_items.content es JSON.
-- Un ítem de rutina: {"sets": 4, "reps": 12, "rest_seconds": 60, "video_url": "..."}
-- Un ítem de dieta:  {"calories": 450, "protein_g": 35, "meal_type": "breakfast", "recipe": "..."}
-- Un ítem legal:     {"description": "...", "required_doc": "contrato_firmado"}
-- El motor de módulos no sabe qué tipo de contenido hay — solo lo almacena y lo muestra.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Planes / programas creados por el profesional
-- is_template = true: plan de la biblioteca reutilizable
-- is_template = false: plan directo sin plantilla
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plans (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  workspace_id CHAR(36)     NOT NULL,
  title        VARCHAR(150) NOT NULL,
  description  TEXT,
  duration_days SMALLINT    DEFAULT NULL,           -- NULL = sin duración fija
  is_template  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_plans_workspace (workspace_id),
  INDEX idx_plans_template  (is_template),
  CONSTRAINT fk_plans_workspace
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------
-- Ítems dentro de un plan (ejercicios, comidas, tareas, etc.)
-- day_number: qué día del plan aplica (1, 2, 3... o NULL = sin día)
-- content: JSON con todo lo específico del tipo de profesión
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_items (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  plan_id       CHAR(36)     NOT NULL,
  title         VARCHAR(150) NOT NULL,
  content       JSON,                               -- contenido libre por categoría
  day_number    SMALLINT     DEFAULT NULL,
  display_order SMALLINT     NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_items_plan (plan_id),
  INDEX idx_items_day  (plan_id, day_number),
  CONSTRAINT fk_items_plan
    FOREIGN KEY (plan_id) REFERENCES plans(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------
-- Asignación de un plan a un cliente
-- El mismo plan puede asignarse a múltiples clientes.
-- start_date define desde qué día arranca el programa.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_assignments (
  id           CHAR(36)  NOT NULL DEFAULT (UUID()),
  plan_id      CHAR(36)  NOT NULL,
  client_id    CHAR(36)  NOT NULL,
  start_date   DATE      NOT NULL,
  end_date     DATE      DEFAULT NULL,              -- NULL = sin fin fijo
  status       ENUM('active', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
  assigned_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_assignment_plan   (plan_id),
  INDEX idx_assignment_client (client_id),
  INDEX idx_assignment_status (status),
  CONSTRAINT fk_assignment_plan
    FOREIGN KEY (plan_id) REFERENCES plans(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_assignment_client
    FOREIGN KEY (client_id) REFERENCES client_profiles(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------
-- Métricas que el profesional quiere medir por workspace
-- El profesional define QUÉ medir. El cliente registra los valores.
-- value_type determina cómo se valida y se grafica el valor.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tracker_metrics (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  workspace_id CHAR(36)     NOT NULL,
  name         VARCHAR(100) NOT NULL,              -- "Peso corporal", "Glucosa en ayunas"
  unit         VARCHAR(30),                        -- "kg", "mg/dL", "cm", "%" — NULL si es texto o bool
  value_type   ENUM('number', 'text', 'boolean')  NOT NULL DEFAULT 'number',
  min_value    DECIMAL(10,2) DEFAULT NULL,         -- validación opcional
  max_value    DECIMAL(10,2) DEFAULT NULL,
  is_required  TINYINT(1)   NOT NULL DEFAULT 0,
  display_order SMALLINT    NOT NULL DEFAULT 0,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_metrics_workspace (workspace_id),
  CONSTRAINT fk_metrics_workspace
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------
-- Registros del cliente en el tracker
-- value siempre se guarda como VARCHAR para soportar los 3 tipos.
-- La conversión a número/bool la hace el backend antes de mostrar.
-- recorded_at lo pone el cliente (puede ser hoy o ayer).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tracker_entries (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  metric_id   CHAR(36)     NOT NULL,
  client_id   CHAR(36)     NOT NULL,
  value       VARCHAR(255) NOT NULL,               -- "72.5" | "Bien" | "1"
  notes       TEXT,                                -- nota libre opcional del cliente
  recorded_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_entries_metric    (metric_id),
  INDEX idx_entries_client    (client_id),
  INDEX idx_entries_recorded  (metric_id, client_id, recorded_at),
  CONSTRAINT fk_entries_metric
    FOREIGN KEY (metric_id) REFERENCES tracker_metrics(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_entries_client
    FOREIGN KEY (client_id) REFERENCES client_profiles(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
