-- ============================================================
-- 004_sessions_and_chat.sql
-- Sesiones agendadas, notas post-sesión y mensajería
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Sesiones agendadas entre profesional y cliente
-- video_room_url: URL que genera Daily.co al crear la sala.
-- Se crea justo cuando el profesional (o cliente) inicia la llamada,
-- no al agendar — así no consumimos recursos de video innecesariamente.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id              CHAR(36)   NOT NULL DEFAULT (UUID()),
  workspace_id    CHAR(36)   NOT NULL,
  professional_id CHAR(36)   NOT NULL,
  client_id       CHAR(36)   NOT NULL,
  scheduled_at    DATETIME   NOT NULL,
  duration_minutes SMALLINT  NOT NULL DEFAULT 60,
  status          ENUM(
                    'scheduled',
                    'in_progress',
                    'completed',
                    'cancelled',
                    'no_show'
                  ) NOT NULL DEFAULT 'scheduled',
  video_room_url  VARCHAR(500) DEFAULT NULL,         -- generada por Daily.co al iniciar
  video_room_name VARCHAR(100) DEFAULT NULL,         -- nombre de la sala en Daily.co
  cancelled_by    CHAR(36)   DEFAULT NULL,           -- user_id de quien canceló
  cancel_reason   TEXT       DEFAULT NULL,
  created_at      DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_sessions_workspace    (workspace_id),
  INDEX idx_sessions_professional (professional_id),
  INDEX idx_sessions_client       (client_id),
  INDEX idx_sessions_scheduled    (scheduled_at),
  INDEX idx_sessions_status       (status),
  CONSTRAINT fk_sessions_workspace
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_sessions_professional
    FOREIGN KEY (professional_id) REFERENCES professional_profiles(id),
  CONSTRAINT fk_sessions_client
    FOREIGN KEY (client_id) REFERENCES client_profiles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------
-- Notas de sesión
-- El profesional puede agregar notas privadas (solo él las ve)
-- o notas compartidas (el cliente también las ve).
-- El resumen auto-generado al cerrar la llamada es tipo 'summary'.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS session_notes (
  id          CHAR(36)  NOT NULL DEFAULT (UUID()),
  session_id  CHAR(36)  NOT NULL,
  created_by  CHAR(36)  NOT NULL,                  -- user_id del profesional
  note_type   ENUM('private', 'shared', 'summary') NOT NULL DEFAULT 'private',
  content     TEXT      NOT NULL,
  created_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_notes_session (session_id),
  CONSTRAINT fk_notes_session
    FOREIGN KEY (session_id) REFERENCES sessions(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------
-- Disponibilidad del profesional
-- Define en qué días y horarios acepta sesiones.
-- day_of_week: 0=Domingo, 1=Lunes ... 6=Sábado
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS availability_slots (
  id              CHAR(36)  NOT NULL DEFAULT (UUID()),
  professional_id CHAR(36)  NOT NULL,
  day_of_week     TINYINT   NOT NULL,              -- 0-6
  start_time      TIME      NOT NULL,
  end_time        TIME      NOT NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,

  PRIMARY KEY (id),
  INDEX idx_avail_professional (professional_id),
  CONSTRAINT fk_avail_professional
    FOREIGN KEY (professional_id) REFERENCES professional_profiles(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------
-- Mensajes del chat
-- Chat asincrónico por workspace (no por sesión).
-- El chat persiste entre sesiones — es el hilo del acompañamiento.
-- read_at es NULL mientras el mensaje no se ha leído.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id           CHAR(36)  NOT NULL DEFAULT (UUID()),
  workspace_id CHAR(36)  NOT NULL,
  sender_id    CHAR(36)  NOT NULL,                 -- user_id (puede ser prof o cliente)
  content      TEXT      NOT NULL,
  message_type ENUM('text', 'file', 'system') NOT NULL DEFAULT 'text',
  file_url     VARCHAR(500) DEFAULT NULL,          -- si es un archivo adjunto
  read_at      DATETIME  DEFAULT NULL,             -- NULL = no leído
  sent_at      DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_messages_workspace (workspace_id),
  INDEX idx_messages_sender    (sender_id),
  INDEX idx_messages_sent      (workspace_id, sent_at),
  CONSTRAINT fk_messages_workspace
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
