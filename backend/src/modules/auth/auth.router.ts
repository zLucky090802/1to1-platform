// src/modules/auth/auth.router.ts
import { Router }       from 'express';
import { AuthService }  from './auth.service';
import { registerSchema, loginSchema } from './auth.schemas';

export const authRouter = Router();
const svc = new AuthService();

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const result = await svc.register(parsed.data);

    // El refresh token va en una httpOnly cookie — el cliente JS nunca lo ve
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   30 * 24 * 60 * 60 * 1000,     // 30 días en ms
    });

    return res.status(201).json({
      user:        result.user,
      accessToken: result.accessToken,
    });
  } catch (err: any) {
    if (err.message === 'EMAIL_TAKEN') {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const result = await svc.login(parsed.data);

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   30 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      user:        result.user,
      accessToken: result.accessToken,
    });
  } catch (err: any) {
    if (err.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// POST /api/auth/refresh — renueva el access token usando la cookie
authRouter.post('/refresh', async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) {
    return res.status(401).json({ error: 'No hay sesión activa' });
  }

  try {
    const result = await svc.refreshToken(token);
    return res.json({ accessToken: result.accessToken });
  } catch {
    res.clearCookie('refresh_token');
    return res.status(401).json({ error: 'Sesión expirada, inicia sesión de nuevo' });
  }
});

// POST /api/auth/logout — invalida el refresh token
authRouter.post('/logout', async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (token) {
    await svc.logout(token).catch(() => {});
  }
  res.clearCookie('refresh_token');
  return res.json({ message: 'Sesión cerrada' });
});
