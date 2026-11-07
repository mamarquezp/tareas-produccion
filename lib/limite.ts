import { redis } from '@/lib/redis';

// ───────────────────────────────────────────────────────────────────────────
//  RONDA 2 · el límite que falta
//
//  Esta función está a medio escribir a propósito. La completas tú.
//
//  Idea (ventana fija, la más simple que funciona): una clave en Redis por
//  identificador, que cuenta cuántas llamadas van en esta ventana de tiempo y
//  se borra sola cuando la ventana termina.
//
//    INCR  cuenta las llamadas y devuelve el número nuevo.
//    EXPIRE pone el reloj, pero SOLO la primera vez (cuando el contador vale 1),
//           para que la ventana no se reinicie en cada llamada.
//
//  Devuelve true si la llamada entra, false si se pasó del límite.
// ───────────────────────────────────────────────────────────────────────────
export async function dentroDelLimite(
  id: string,
  limite: number,
  ventanaSeg: number,
): Promise<boolean> {
  const clave = `limite:${id}`;

  const n = await redis.incr(clave);
  if (n === 1) await redis.expire(clave, ventanaSeg);
  return n <= limite;
}
