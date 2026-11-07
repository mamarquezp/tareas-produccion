import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { equipoActual } from '@/lib/sesion';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════
//  RONDA 1 · A01:2025 Broken Access Control
//
//  Esta ruta comprueba que haya sesión y se queda tranquila. Nunca comprueba
//  que la tarea pedida sea del equipo que la pide.
//
//  Es exactamente el fallo de First American en 2019: el identificador era
//  secuencial y el servidor servía cualquier documento a cualquiera que
//  cambiara un dígito en la URL. 885 millones de documentos.
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const equipo = await equipoActual();

  const n = Number(id);
  if (!Number.isInteger(n)) {
    return NextResponse.json({ error: 'id inválido' }, { status: 400 });
  }

  const filas = await sql`
    SELECT id, equipo, titulo, detalle, hecha
      FROM tareas
     WHERE id = ${n}
       AND equipo = ${equipo}
  `;

  if (filas.length === 0) {
    return NextResponse.json({ error: 'no existe' }, { status: 404 });
  }

  return NextResponse.json({ tarea: filas[0], pedidaPor: equipo });
}
