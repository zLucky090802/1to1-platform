// src/types/domain.ts
// Tipos que reflejan exactamente el schema de la BD.
// Si cambias la BD, cambia esto primero — TypeScript te dirá qué se rompe.

export type UserRole = 'professional' | 'client';

export interface User {
  id:            string;
  email:         string;
  password_hash: string;
  role:          UserRole;
  is_active:     boolean;
  created_at:    Date;
  updated_at:    Date;
}

export interface ProfessionalProfile {
  id:           string;
  user_id:      string;
  display_name: string;
  slug:         string;
  category:     'fitness' | 'nutrition' | 'legal' | 'finance' | 'psychology' | 'education' | 'other';
  bio:          string | null;
  avatar_url:   string | null;
  is_public:    boolean;
  created_at:   Date;
  updated_at:   Date;
}

export interface ClientProfile {
  id:            string;
  user_id:       string;
  display_name:  string;
  avatar_url:    string | null;
  date_of_birth: Date | null;
  created_at:    Date;
  updated_at:    Date;
}

export interface Workspace {
  id:              string;
  professional_id: string;
  name:            string;
  description:     string | null;
  invite_token:    string;
  is_active:       boolean;
  created_at:      Date;
  updated_at:      Date;
}

export interface ModuleType {
  id:          string;
  key_name:    string;
  label:       string;
  description: string | null;
  icon:        string | null;
  is_active:   boolean;
}

export interface WorkspaceModule {
  id:             string;
  workspace_id:   string;
  module_type_id: string;
  config:         Record<string, unknown> | null;
  is_active:      boolean;
  display_order:  number;
  created_at:     Date;
  updated_at:     Date;
}

export interface ClientEnrollment {
  id:           string;
  workspace_id: string;
  client_id:    string;
  status:       'invited' | 'active' | 'paused' | 'cancelled';
  enrolled_at:  Date;
  updated_at:   Date;
}

export interface Session {
  id:               string;
  workspace_id:     string;
  professional_id:  string;
  client_id:        string;
  scheduled_at:     Date;
  duration_minutes: number;
  status:           'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  video_room_url:   string | null;
  video_room_name:  string | null;
  cancelled_by:     string | null;
  cancel_reason:    string | null;
  created_at:       Date;
  updated_at:       Date;
}

export interface Message {
  id:           string;
  workspace_id: string;
  sender_id:    string;
  content:      string;
  message_type: 'text' | 'file' | 'system';
  file_url:     string | null;
  read_at:      Date | null;
  sent_at:      Date;
}

// Payload que vive dentro del JWT
export interface JwtPayload {
  sub:  string;       // user_id
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Extiende el Request de Express para tener el usuario en req.user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
