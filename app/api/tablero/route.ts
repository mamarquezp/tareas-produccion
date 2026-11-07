import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════
//  RONDA 4 · Rendimiento: la consulta N+1 sin caché
//
//  Una consulta para los equipos, y después UNA CONSULTA POR CADA EQUIPO.
//  Con tres equipos no se nota. Con trescientos, el tablero es el endpoint
//  que tumba la base cuando entra todo el mundo a las ocho de la mañana.
//
//  Y no hay caché: cada visita vuelve a hacer el mismo trabajo idéntico.
// ═══════════════════════════════════════════════════════════════════════════

export async function GET() {
  const t0 = Date.now();

  const equipos = await sql<{ slug: string; nombre: string }[]>`
    SELECT slug, nombre FROM equipos ORDER BY slug
  `;

  const tablero = [];
  for (const eq of equipos) {
    // +1 consulta por equipo. Aquí está el problema.
    const filas = await sql<{ total: string; hechas: string }[]>`
      SELECT count(*)::text AS total,
             count(*) FILTER (WHERE hecha)::text AS hechas
        FROM tareas
       WHERE equipo = ${eq.slug}
    `;
    // Un poquito de trabajo por fila, para que el N+1 se note en la medición.
    await sql`SELECT pg_sleep(0.03)`;
    tablero.push({
      equipo: eq.slug,
      nombre: eq.nombre,
      total: Number(filas[0].total),
      hechas: Number(filas[0].hechas),
    });
  }

  return NextResponse.json({
    tablero,
    generadoEn: new Date().toISOString(),
    msDeServidor: Date.now() - t0,
    desdeCache: false,
  });
}
