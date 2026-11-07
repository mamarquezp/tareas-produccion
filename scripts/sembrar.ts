// Añade equipos de relleno para que el problema N+1 de la ronda 4 se vea.
// Sin esto, con tres equipos, el tablero es instantáneo y la lección no se nota.
//
//   pnpm sembrar          agrega 150 equipos de relleno
//   pnpm sembrar limpiar  los quita
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5436/tareas');

const limpiar = process.argv.includes('limpiar');

if (limpiar) {
  await sql`DELETE FROM tareas  WHERE equipo LIKE 'relleno-%'`;
  await sql`DELETE FROM equipos WHERE slug  LIKE 'relleno-%'`;
  console.log('relleno eliminado.');
} else {
  for (let i = 0; i < 150; i++) {
    const slug = `relleno-${i}`;
    await sql`INSERT INTO equipos (slug, nombre) VALUES (${slug}, ${'Relleno ' + i})
              ON CONFLICT (slug) DO NOTHING`;
    await sql`INSERT INTO tareas (equipo, titulo) VALUES (${slug}, 'tarea de relleno')`;
  }
  console.log('150 equipos de relleno agregados. Ahora el tablero sí se siente.');
}

await sql.end();
