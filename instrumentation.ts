// Next.js carga este archivo una sola vez, al arrancar el servidor, antes de
// atender cualquier petición. Es el lugar donde se enciende la observabilidad.
//
// Usamos @vercel/otel porque es la vía que la documentación de Next.js
// recomienda hoy: una línea, y funciona también en el runtime de edge.
import { registerOTel } from '@vercel/otel';

export function register() {
  registerOTel({ serviceName: 'tareas-produccion' });
}

// En la ronda 5 se agrega aquí la captura de errores de servidor:
//   export const onRequestError = Sentry.captureRequestError;
// (requiere una cuenta de Sentry con su DSN; en clase es opcional).
