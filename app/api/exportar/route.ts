import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { equipoActual } from '@/lib/sesion';
import { conSpan } from '@/lib/trazas';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════
//  RONDA 5 · A09:2025 Security Logging & Alerting Failures
//            A10:2025 Mishandling of Exceptional Conditions
//
//  Las dos son categorías del OWASP Top 10 de 2025. No son "buenas prácticas
//  de ingeniería": son fallas de seguridad, con número.
//
//  Esta ruta exporta las tareas del equipo. Cuando algo sale mal —y sale mal,
//  la columna `prioridad` no existe— el catch se traga el error y devuelve
//  200 con una lista vacía. El usuario cree que no tiene tareas. Nadie se
//  entera de nada. No hay registro, no hay alerta, no hay traza.
//
//  Roblox, octubre de 2021: 73 horas de caída, de las cuales unas 50 fueron
//  diagnóstico. El postmortem lo dice: "we lacked the telemetry data that
//  would have made it easier for us to figure out what was wrong".
// ═══════════════════════════════════════════════════════════════════════════

export async function GET() {
  const equipo = await equipoActual();

  try {
    // (b) La consulta va dentro de un span: aparece en Jaeger y, si revienta,
    // conSpan registra la excepción en la traza antes de relanzarla.
    const filas = await conSpan('exportar', () => sql`
      SELECT id, titulo, prioridad
        FROM tareas
       WHERE equipo = ${equipo}
       ORDER BY prioridad DESC
    `);
    return NextResponse.json({ ok: true, filas });
  } catch (e) {
    // (a) Se acabó tragarse el error: lo registramos y respondemos 500. Un 500
    // sin log sigue siendo silencio para quien está de guardia.
    console.error('fallo al exportar:', e);
    return NextResponse.json({ ok: false, error: 'no se pudo exportar' }, { status: 500 });
  }
}
