import postgres from 'postgres';

export const sql = postgres(
  process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5436/tareas',
  { max: 10 },
);

/**
 * Ejecuta SQL crudo a partir de un string. Existe SOLO para la ronda 3.
 * En código de verdad esto no se escribe nunca: lo pongo aquí con nombre
 * feo para que se vea lo que es.
 */
export const sqlPeligroso = (texto: string) => sql.unsafe(texto);
