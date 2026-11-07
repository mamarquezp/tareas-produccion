// ═══════════════════════════════════════════════════════════════════════════
//  El juez del taller.
//
//    pnpm atacar
//
//  Corre las cinco comprobaciones contra TU copia local (http://localhost:3000)
//  y te dice, ronda por ronda, si el pecado sigue presente (ROJO) o si ya lo
//  corregiste (VERDE). No ataca nada de nadie: es un verificador de tu propia
//  aplicación en tu propia máquina, igual que `pnpm medir` de la semana pasada.
//
//  La mecánica es la misma de siempre: lo ves en rojo, lo arreglas, lo ves en
//  verde. Cuando una ronda pasa de roja a verde, el juez te entrega la bandera
//  de esa ronda para que la anotes en el marcador.
// ═══════════════════════════════════════════════════════════════════════════

const BASE = process.env.BASE ?? 'http://localhost:3000';

// Una "sesión" de Café Luna: la cookie que lleva el navegador del equipo.
const COMO_CAFE_LUNA = { cookie: 'equipo=cafe-luna' };

const BANDERAS = {
  1: 'USPG{IDOR-TAREA-AJENA}',
  2: 'USPG{SIN-LIMITE-FACTURA-SUBE}',
  3: 'USPG{INYECCION-TABLA-SECRETOS}',
  4: 'USPG{TABLERO-LENTO-SIN-CACHE}',
  5: 'USPG{ERROR-TRAGADO-EN-SILENCIO}',
};

const pintar = (verde, texto) =>
  `${verde ? '\x1b[32m  VERDE' : '\x1b[31m  ROJO '}\x1b[0m  ${texto}`;

async function pedir(ruta, opts = {}) {
  const r = await fetch(BASE + ruta, { ...opts, headers: { ...COMO_CAFE_LUNA, ...(opts.headers ?? {}) } });
  const texto = await r.text();
  let cuerpo = null;
  try { cuerpo = JSON.parse(texto); } catch { /* no era JSON */ }
  return { status: r.status, texto, cuerpo };
}

// ── Ronda 1 · Broken Access Control ─────────────────────────────────────────
// Café Luna pide una tarea que es de Taller Sur. Si la ve, el control de
// acceso no existe. Corregido: el servidor responde 403 o 404 a la tarea ajena.
async function ronda1() {
  // Las tareas 1..3 son de Café Luna; la 6 es de Taller Sur.
  const propia = await pedir('/api/tareas/1');
  const ajena = await pedir('/api/tareas/6');

  const veLaPropia = propia.status === 200;
  const veLaAjena = ajena.status === 200 && ajena.cuerpo?.tarea?.equipo === 'taller-sur';

  if (!veLaPropia) return { ok: false, nota: 'la app no responde a una tarea propia — ¿está levantada?' };
  if (veLaAjena) return { ok: false, nota: 'Café Luna está viendo la tarea 6, que es de Taller Sur.' };
  return { ok: true, nota: 'la tarea ajena ya responde 403/404; la propia sigue abierta.' };
}

// ── Ronda 2 · Abuso sin límite ──────────────────────────────────────────────
// Diez llamadas seguidas a la ruta que cuesta dinero. Si las diez pasan, no
// hay límite. Corregido: a partir de cierto número responde 429.
async function ronda2() {
  let pasaron = 0, hubo429 = false;
  for (let i = 0; i < 10; i++) {
    const r = await pedir('/api/ia/resumir', { method: 'POST' });
    if (r.status === 200) pasaron++;
    else if (r.status === 429) hubo429 = true;
  }
  if (pasaron === 10 && !hubo429) return { ok: false, nota: 'las 10 llamadas de pago pasaron sin un solo 429.' };
  if (!hubo429) return { ok: false, nota: `pasaron ${pasaron} y ninguna devolvió 429.` };
  return { ok: true, nota: 'la ruta empezó a responder 429 antes de la décima llamada.' };
}

// ── Ronda 3 · Injection ─────────────────────────────────────────────────────
// Se cierra la comilla del término de búsqueda y se pide de otra tabla. Si la
// respuesta trae la bandera de la tabla `secretos`, la consulta se armó pegando
// texto. Corregido: el término se trata como dato y no como SQL.
async function ronda3() {
  const carga = `x' UNION SELECT 0, valor, false FROM secretos WHERE clave='bandera_sql' --`;
  const r = await pedir('/api/buscar?q=' + encodeURIComponent(carga));
  const filtro = r.texto.includes('INYECCION-TABLA-SECRETOS');
  if (filtro) return { ok: false, nota: 'la búsqueda devolvió una fila de la tabla secretos.' };
  return { ok: true, nota: 'el término ya se trata como dato: no se puede saltar a otra tabla.' };
}

// ── Ronda 4 · Rendimiento ───────────────────────────────────────────────────
// Dos visitas al tablero. La primera puede ser lenta; la segunda, si hay caché,
// debe venir marcada desdeCache:true y bajar de golpe el tiempo de servidor.
async function ronda4() {
  const a = await pedir('/api/tablero');
  const b = await pedir('/api/tablero');
  const msA = a.cuerpo?.msDeServidor ?? 9999;
  const msB = b.cuerpo?.msDeServidor ?? 9999;
  const cacheada = b.cuerpo?.desdeCache === true;
  if (!cacheada && msB > 50) return { ok: false, nota: `la segunda visita tardó ${msB} ms y no vino de caché.` };
  return { ok: true, nota: `la segunda visita vino de caché (${msA} ms → ${msB} ms).` };
}

// ── Ronda 5 · Errores en silencio ───────────────────────────────────────────
// La ruta de exportar falla por dentro (columna inexistente). Mientras devuelva
// 200 con lista vacía, el error se está tragando. Corregido: responde 500 — un
// error honesto que un humano y una alerta pueden ver.
async function ronda5() {
  const r = await pedir('/api/exportar');
  const silencioso = r.status === 200 && Array.isArray(r.cuerpo?.filas) && r.cuerpo.filas.length === 0;
  if (silencioso) return { ok: false, nota: 'la exportación devolvió 200 con lista vacía: el error se tragó.' };
  if (r.status >= 500) return { ok: true, nota: 'la exportación ahora falla con 500 visible, como debe ser.' };
  if (r.status === 200 && r.cuerpo?.filas?.length > 0) return { ok: true, nota: 'la exportación ya funciona de verdad.' };
  return { ok: false, nota: `respuesta inesperada (status ${r.status}).` };
}

const RONDAS = [
  ['1 · Broken Access Control  (A01)', ronda1],
  ['2 · Abuso sin límite       (rate limiting)', ronda2],
  ['3 · Injection              (A05)', ronda3],
  ['4 · Rendimiento            (caché / N+1)', ronda4],
  ['5 · Errores en silencio    (A09 / A10)', ronda5],
];

console.log(`\n  Verificando ${BASE} como Café Luna\n`);

let verdes = 0;
for (let i = 0; i < RONDAS.length; i++) {
  const [titulo, fn] = RONDAS[i];
  let res;
  try { res = await fn(); }
  catch (e) { res = { ok: false, nota: 'no se pudo comprobar: ' + (e?.message ?? e) }; }
  console.log(pintar(res.ok, titulo));
  console.log('          ' + res.nota);
  if (res.ok) { verdes++; console.log('          bandera: ' + BANDERAS[i + 1]); }
  console.log('');
}

console.log(`  ${verdes} de 5 corregidas.\n`);
if (verdes < 5) {
  console.log('  Las rondas en rojo todavía tienen el pecado. Arréglalo y vuelve a correr.\n');
  process.exit(1);
}
console.log('  Las cinco en verde. Tu copia ya se porta como código de producción.\n');
