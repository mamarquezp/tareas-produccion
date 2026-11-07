export const dynamic = 'force-dynamic';

const RUTAS: [string, string][] = [
  ['GET  /api/tareas/[id]', 'Ronda 1 · no comprueba de quién es la tarea'],
  ['POST /api/ia/resumir', 'Ronda 2 · cuesta dinero y no tiene límite'],
  ['GET  /api/buscar?q=', 'Ronda 3 · arma el SQL pegando texto'],
  ['GET  /api/tablero', 'Ronda 4 · N+1 y sin caché'],
  ['GET  /api/salud', 'comprueba base y caché'],
];

export default function Inicio() {
  return (
    <main>
      <h1>Tareas Pro · Producción</h1>
      <p className="sub">Semana 17 · Seguridad, observabilidad y rendimiento</p>

      <div className="tarjeta">
        <p>
          Esta aplicación funciona. También tiene <strong>cinco pecados de producción</strong>,
          uno por ronda. El juez es <code>pnpm atacar</code>.
        </p>
        {RUTAS.map(([r, d]) => (
          <div className="ruta" key={r}>
            <code>{r}</code>
            <span className="sub">{d}</span>
          </div>
        ))}
      </div>

      <div className="tarjeta">
        <p className="mal">El quinto pecado no tiene ruta propia.</p>
        <p className="sub">
          Es que cuando algo falla aquí dentro, nadie se entera. Esa es la ronda 5.
        </p>
      </div>
    </main>
  );
}
