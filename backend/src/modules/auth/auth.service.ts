// src/modules/auth/auth.service.ts
import bcrypt  from 'bcryptjs';
import jwt     from 'jsonwebtoken';
import crypto  from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { db }  from '../../config/database';
import type { JwtPayload, UserRole } from '../../types/domain';

interface RegisterInput {
  email:        string;
  password:     string;
  role:         UserRole;
  display_name: string;
  category?:    string;    // requerido si role === 'professional'
}

interface LoginInput {
  email:    string;
  password: string;
}

export class AuthService {

  // ── Registro ─────────────────────────────────────────────────
  async register(input: RegisterInput) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Verificar email único
      const [existing] = await conn.execute<any[]>(
        'SELECT id FROM users WHERE email = ?', [input.email]
      );
      if (existing.length > 0) throw new Error('EMAIL_TAKEN');

      const userId        = uuidv4();
      const profileId     = uuidv4();
      const passwordHash  = await bcrypt.hash(input.password, 12);

      // Insertar usuario base
      await conn.execute(
        'INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [userId, input.email.toLowerCase(), passwordHash, input.role]
      );

      // Crear perfil según el rol
      if (input.role === 'professional') {
        const slug = await this.generateSlug(input.display_name, conn);
        await conn.execute(
          `INSERT INTO professional_profiles (id, user_id, display_name, slug, category)
           VALUES (?, ?, ?, ?, ?)`,
          [profileId, userId, input.display_name, slug, input.category || 'other']
        );

        // Crear workspace inicial vacío para el profesional
        const workspaceId = uuidv4();
        await conn.execute(
          `INSERT INTO workspaces (id, professional_id, name)
           VALUES (?, ?, ?)`,
          [workspaceId, profileId, `Workspace de ${input.display_name}`]
        );
      } else {
        await conn.execute(
          `INSERT INTO client_profiles (id, user_id, display_name) VALUES (?, ?, ?)`,
          [profileId, userId, input.display_name]
        );
      }

      await conn.commit();

      const { accessToken, refreshToken } = await this.generateTokens(userId, input.role, conn);

      return {
        user: { id: userId, email: input.email, role: input.role, display_name: input.display_name },
        accessToken,
        refreshToken,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // ── Login ─────────────────────────────────────────────────────
  async login(input: LoginInput) {
    const [rows] = await db.execute<any[]>(
      'SELECT id, email, password_hash, role, is_active FROM users WHERE email = ?',
      [input.email.toLowerCase()]
    );

    const user = rows[0];
    if (!user || !user.is_active) throw new Error('INVALID_CREDENTIALS');

    const valid = await bcrypt.compare(input.password, user.password_hash);
    if (!valid) throw new Error('INVALID_CREDENTIALS');

    const conn = await db.getConnection();
    try {
      const { accessToken, refreshToken } = await this.generateTokens(user.id, user.role, conn);
      return {
        user: { id: user.id, email: user.email, role: user.role },
        accessToken,
        refreshToken,
      };
    } finally {
      conn.release();
    }
  }

  // ── Refresh token ─────────────────────────────────────────────
  async refreshToken(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);

    const [rows] = await db.execute<any[]>(
      `SELECT rt.*, u.role FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = ? AND rt.revoked_at IS NULL AND rt.expires_at > NOW()`,
      [tokenHash]
    );

    const stored = rows[0];
    if (!stored) throw new Error('INVALID_REFRESH_TOKEN');

    // Rotar el token: invalida el anterior, emite uno nuevo
    await db.execute(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?',
      [stored.id]
    );

    const conn = await db.getConnection();
    try {
      const { accessToken, refreshToken } = await this.generateTokens(stored.user_id, stored.role, conn);
      return { accessToken, refreshToken };
    } finally {
      conn.release();
    }
  }

  // ── Logout ────────────────────────────────────────────────────
  async logout(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    await db.execute(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?',
      [tokenHash]
    );
  }

  // ── Helpers privados ──────────────────────────────────────────

  private async generateTokens(userId: string, role: UserRole, conn: any) {
    const payload: JwtPayload = { sub: userId, role };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
    );

    // Refresh token: string aleatorio (no JWT) — más seguro y revocable
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash    = this.hashToken(refreshToken);
    const expiresAt    = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await conn.execute(
      'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
      [uuidv4(), userId, tokenHash, expiresAt]
    );

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async generateSlug(displayName: string, conn: any): Promise<string> {
    const base = displayName
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // quita tildes
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);

    let slug    = base;
    let attempt = 0;

    while (true) {
      const [rows] = await conn.execute<any[]>(
        'SELECT id FROM professional_profiles WHERE slug = ?', [slug]
      );
      if (rows.length === 0) return slug;
      attempt++;
      slug = `${base}-${attempt}`;
    }
  }
}
