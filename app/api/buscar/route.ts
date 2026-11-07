import { NextResponse } from 'next/server';
import { sqlPeligroso } from '@/lib/db';
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

  const consulta = `
    SELECT id, titulo, hecha
      FROM tareas
     WHERE equipo = '${equipo}'
       AND titulo ILIKE '%${q}%'
     ORDER BY id
  `;

  try {
    const filas = await sqlPeligroso(consulta);
    return NextResponse.json({ resultados: filas, consulta });
  } catch (e) {
    // Devolver el error de la base al cliente es regalo adicional para el
    // atacante: le dice la forma de la consulta sin tener que adivinarla.
    return NextResponse.json({ error: String(e), consulta }, { status: 500 });
  }
}
