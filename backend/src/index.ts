// src/index.ts
import 'dotenv/config';
import express     from 'express';
import cors        from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/database';

// --- Routers (se van agregando sprint a sprint) ---
import { authRouter } from './modules/auth/auth.router';

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globales ──────────────────────────────────────
app.use(cors({
  origin:      process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true,          // necesario para que Angular envíe cookies
}));
app.use(express.json());
app.use(cookieParser());

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Rutas ─────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
// Sprint 1:
// app.use('/api/workspaces', workspaceRouter);
// app.use('/api/modules',    moduleRouter);
// Sprint 2:
// app.use('/api/plans',      planRouter);
// app.use('/api/tracker',    trackerRouter);
// Sprint 3:
// app.use('/api/sessions',   sessionRouter);
// app.use('/api/chat',       chatRouter);

// ── Error handler global ─────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ── Arranque ──────────────────────────────────────────────────
async function bootstrap() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`✓ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`  Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
}

bootstrap();
