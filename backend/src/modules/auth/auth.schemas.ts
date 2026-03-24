// src/modules/auth/auth.schemas.ts
import { z } from 'zod';

export const registerSchema = z.object({
  email:        z.string().email('Email inválido'),
  password:     z.string().min(8, 'Mínimo 8 caracteres'),
  role:         z.enum(['professional', 'client']),
  display_name: z.string().min(2).max(100),
  category:     z.enum([
    'fitness','nutrition','legal','finance','psychology','education','other'
  ]).optional(),
}).refine(
  data => data.role !== 'professional' || !!data.category,
  { message: 'El profesional debe indicar su categoría', path: ['category'] }
);

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput    = z.infer<typeof loginSchema>;
