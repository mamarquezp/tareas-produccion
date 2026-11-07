import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const estado = { base: 'caída', cache: 'caído' };
  try { await sql`SELECT 1`; estado.base = 'arriba'; } catch { /* queda caída */ }
  try { await redis.ping(); estado.cache = 'arriba'; } catch { /* queda caído */ }
  return NextResponse.json({ ok: true, ...estado });
}
