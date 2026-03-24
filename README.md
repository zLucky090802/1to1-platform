# Advisory Platform

Plataforma modular de asesorías 1:1. Conecta profesionales (coaches, nutricionistas, abogados, asesores) con sus clientes en un workspace personalizable.

## Stack

- **Frontend:** Angular 17 (PWA)
- **Backend:** Node.js + Express + TypeScript
- **Base de datos:** MySQL 8.0
- **Auth:** JWT (access token + refresh token en httpOnly cookie)
- **Video:** Daily.co SDK
- **Tiempo real:** Socket.io

## Estructura del proyecto

```
advisory-platform/
├── backend/              # API REST + WebSocket
│   ├── src/
│   │   ├── config/       # DB, env, constantes
│   │   ├── middleware/   # auth, roles, errores
│   │   ├── modules/      # auth, users, workspaces, plans, tracker, sessions, chat
│   │   ├── types/        # tipos globales TypeScript
│   │   └── utils/        # helpers
│   └── database/
│       └── migrations/   # SQL versionado
└── frontend/             # Angular app
```

## Levantar en local

### Requisitos
- Node.js 20+
- MySQL 8.0+
- npm

### Backend

```bash
cd backend
cp .env.example .env        # completar variables
npm install
npm run migrate             # ejecuta las migraciones SQL
npm run dev                 # levanta en :3000
```

### Frontend

```bash
cd frontend
npm install
ng serve                    # levanta en :4200
```

## Sprints

| Sprint | Foco | Estado |
|--------|------|--------|
| 0 | Base técnica, BD, auth | En progreso |
| 1 | Workspace y módulos | Pendiente |
| 2 | Planes y tracker | Pendiente |
| 3 | Sesiones y comunicación | Pendiente |
