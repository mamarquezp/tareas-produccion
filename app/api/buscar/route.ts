import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { equipoActual } from '@/lib/sesion';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════
//  RONDA 3 · A05:2025 Injection
//
//  La consulta se arma pegando texto. El motor de la base recibe una sola
//  cadena y no tiene forma de saber qué parte escribió el programador y qué
//  parte escribió el usuario.
//
//  Ese es el problema de fondo, y es el MISMO que tiene un modelo de lenguaje
//  con la inyección de prompt: no puede distinguir la procedencia de los
//  tokens que procesa. Treinta años después, el mismo error con otra sintaxis.
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q') ?? '';
  const equipo = await equipoActual();

  try {
    const filas = await sql`
      SELECT id, titulo, hecha
        FROM tareas
       WHERE equipo = ${equipo}
         AND titulo ILIKE ${'%' + q + '%'}
       ORDER BY id
    `;
    return NextResponse.json({ resultados: filas });
  } catch (e) {
    // No devolvemos ni el error crudo ni la consulta al cliente
    console.error('fallo en /api/buscar:', e);
    return NextResponse.json({ error: 'no se pudo buscar' }, { status: 500 });
  }
}
