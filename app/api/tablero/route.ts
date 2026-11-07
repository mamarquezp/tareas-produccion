import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cacheAside } from '@/lib/cache';

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

  // (a) Una sola consulta con LEFT JOIN + GROUP BY reemplaza las 151 del N+1.
  // (b) cacheAside con TTL corto: la segunda visita viene de caché, no de la base.
  const { valor: tablero, desdeCache } = await cacheAside('tablero', 10, async () => {
    const filas = await sql<
      { slug: string; nombre: string; total: string; hechas: string }[]
    >`
      SELECT e.slug, e.nombre,
             count(t.id)::text AS total,
             count(t.id) FILTER (WHERE t.hecha)::text AS hechas
        FROM equipos e
        LEFT JOIN tareas t ON t.equipo = e.slug
       GROUP BY e.slug, e.nombre
       ORDER BY e.slug
    `;
    return filas.map((f) => ({
      equipo: f.slug,
      nombre: f.nombre,
      total: Number(f.total),
      hechas: Number(f.hechas),
    }));
  });

  return NextResponse.json({
    tablero,
    generadoEn: new Date().toISOString(),
    msDeServidor: Date.now() - t0,
    desdeCache,
  });
}
