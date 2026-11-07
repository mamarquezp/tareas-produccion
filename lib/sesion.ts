import { cookies } from 'next/headers';

/**
 * Una "sesión" de mentira: una cookie con el nombre del equipo.
 *
 * Esto NO es autenticación y no pretende serlo — eso fue la Semana 5 con
 * Better Auth. Lo que importa hoy es la línea siguiente: aunque la
 * autenticación fuera perfecta, la AUTORIZACIÓN se verifica aparte, en cada
 * objeto, en cada consulta. Un atacante con sesión válida sigue siendo un
 * atacante cuando pide algo que no es suyo.
 */
export async function equipoActual(): Promise<string> {
  const c = await cookies();
  return c.get('equipo')?.value ?? 'cafe-luna';
}
