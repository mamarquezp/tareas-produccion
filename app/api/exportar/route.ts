import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { equipoActual } from '@/lib/sesion';

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
    const filas = await sql`
      SELECT id, titulo, prioridad
        FROM tareas
       WHERE equipo = ${equipo}
       ORDER BY prioridad DESC
    `;
    return NextResponse.json({ ok: true, filas });
  } catch {
    // Aquí está el pecado. Dos líneas, y es lo peor que le puedes hacer a
    // quien tenga que entender esto a las dos de la mañana.
    return NextResponse.json({ ok: true, filas: [] });
  }
}
