import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { equipoActual } from '@/lib/sesion';
import { dentroDelLimite } from '@/lib/limite';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════
//  RONDA 2 · Abuso: la ruta que cuesta dinero
//
//  Cada llamada "resume" las tareas del equipo con un modelo. Aquí el modelo
//  está simulado —no quiero que gasten su cuota de Gemini en clase— pero el
//  costo NO está simulado: cada llamada anota centavos en la tabla gasto_ia,
//  y esa tabla es la factura.
//
//  No hay límite de ninguna clase. Cualquiera con sesión puede llamarla mil
//  veces en un minuto.
//
//  En la vida real: Dell, abril de 2024. Un endpoint autenticado sin límites
//  por cuenta, 5 000 peticiones por minuto durante tres semanas según el
//  propio atacante, 49 millones de registros de clientes.
// ═══════════════════════════════════════════════════════════════════════════

const CENTAVOS_POR_LLAMADA = 3;

export async function POST() {
  const equipo = await equipoActual();

  // Autorización ya está (ronda 1); aquí el riesgo es el ABUSO: cada llamada
  // cuesta dinero. Cortamos antes de gastar: máximo 5 llamadas por minuto y
  // por equipo. La 6.ª dentro de la ventana recibe 429.
  if (!(await dentroDelLimite(equipo, 5, 60))) {
    return NextResponse.json(
      { error: 'demasiadas peticiones, intenta más tarde' },
      { status: 429 },
    );
  }

  const tareas = await sql<{ titulo: string }[]>`
    SELECT titulo FROM tareas WHERE equipo = ${equipo} ORDER BY id
  `;

  // Lo que tardaría un modelo de verdad.
  await new Promise((r) => setTimeout(r, 120));

  await sql`
    INSERT INTO gasto_ia (equipo, centavos) VALUES (${equipo}, ${CENTAVOS_POR_LLAMADA})
  `;

  const [{ total }] = await sql<{ total: string }[]>`
    SELECT COALESCE(sum(centavos), 0)::text AS total FROM gasto_ia
  `;

  return NextResponse.json({
    resumen: `${tareas.length} tareas, ${tareas.filter((_, i) => i % 2 === 0).length} pendientes al parecer.`,
    costoCentavos: CENTAVOS_POR_LLAMADA,
    facturaAcumuladaCentavos: Number(total),
  });
}
