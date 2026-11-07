import { trace } from '@opentelemetry/api';

/**
 * Envuelve un trozo de trabajo en un span para que aparezca en Jaeger.
 *
 * Un span es un tramo de tiempo con nombre. La traza del request es el árbol
 * de spans: cuánto tardó cada parte, cuál llamó a cuál, y dónde reventó.
 * Sin esto, cuando el tablero está lento, lo único que sabes es «está lento».
 * Con esto, ves que el 95% del tiempo está en la consulta a la base.
 */
export async function conSpan<T>(nombre: string, fn: () => Promise<T>): Promise<T> {
  const tracer = trace.getTracer('tareas-produccion');
  return tracer.startActiveSpan(nombre, async (span) => {
    try {
      return await fn();
    } catch (e) {
      // Un span que no registra el error es un testigo que se calla.
      span.recordException(e as Error);
      span.setStatus({ code: 2 }); // ERROR
      throw e;
    } finally {
      span.end();
    }
  });
}
