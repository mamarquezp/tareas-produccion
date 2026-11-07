import { redis } from '@/lib/redis';

// ───────────────────────────────────────────────────────────────────────────
//  RONDA 4 · el caché que falta
//
//  "Si ya lo calculaste hace un segundo, no lo vuelvas a calcular."
//
//  Patrón cache-aside, el más común: mira el caché; si está, devuélvelo; si no,
//  calcula, guárdalo con un tiempo de vida (TTL) y devuélvelo.
//
//  El TTL es la pieza que la gente olvida. Sin él, el dato viejo se queda para
//  siempre. Con un TTL corto (unos segundos para un tablero), absorbes la
//  avalancha de las 8 de la mañana sin servir datos rancios.
// ───────────────────────────────────────────────────────────────────────────
export async function cacheAside<T>(
  clave: string,
  ttlSeg: number,
  calcular: () => Promise<T>,
): Promise<{ valor: T; desdeCache: boolean }> {
  // TODO (ronda 4):
  //   const guardado = await redis.get(clave);
  //   if (guardado) return { valor: JSON.parse(guardado), desdeCache: true };
  //   const valor = await calcular();
  //   await redis.set(clave, JSON.stringify(valor), 'EX', ttlSeg);
  //   return { valor, desdeCache: false };

  return { valor: await calcular(), desdeCache: false }; // ← sin caché todavía
}
