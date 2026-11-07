# Pistas

Ábrelas solo tras cinco minutos atascado. El punto no es llegar primero: es
entender por qué el agujero era un agujero.

---

## Ronda 1 · Broken Access Control

<details><summary>Pista 1 · Qué compara la ruta y qué le falta comparar</summary>

La consulta filtra por `id`. Mira la cookie: ya sabes de qué equipo es quien
pide. Nunca cruzas esas dos cosas.
</details>

<details><summary>Pista 2 · Dónde ponerlo</summary>

En el `WHERE`, no en un `if` después. Si filtras en la consulta, la tarea ajena
simplemente no vuelve, y respondes 404 — a un extraño no se le confirma ni que
el objeto existe.
</details>

<details><summary>Pista 3 · La línea</summary>

```sql
WHERE id = ${n}
  AND equipo = ${equipo}
```
</details>

---

## Ronda 2 · Rate limiting

<details><summary>Pista 1 · Las dos órdenes de Redis</summary>

`INCR` cuenta y devuelve el número nuevo. `EXPIRE` pone el reloj. Las dos sobre
la misma clave, una por identificador.
</details>

<details><summary>Pista 2 · El error que todos cometen</summary>

Si pones `EXPIRE` en cada llamada, reinicias la ventana cada vez y el límite no
llega nunca. Ponlo **solo** cuando `INCR` devolvió 1 (la primera de la ventana).
</details>

<details><summary>Pista 3 · La función y su uso</summary>

```ts
const n = await redis.incr(clave);
if (n === 1) await redis.expire(clave, ventanaSeg);
return n <= limite;
```
y en la ruta, antes de gastar:
```ts
if (!(await dentroDelLimite(equipo, 5, 60)))
  return NextResponse.json({ error: '...' }, { status: 429 });
```
</details>

---

## Ronda 3 · Injection

<details><summary>Pista 1 · Por qué la comilla rompe todo</summary>

La consulta es un string donde tu `q` se pega en medio. Una comilla en `q`
cierra la cadena del programador y lo que sigue se vuelve SQL.
</details>

<details><summary>Pista 2 · La herramienta correcta ya está importada</summary>

No uses `sqlPeligroso`. Usa `sql\`...\`` con el valor entre `${}`: eso lo manda
como parámetro, aparte de la consulta.
</details>

<details><summary>Pista 3 · La forma</summary>

```ts
const filas = await sql`
  SELECT id, titulo, hecha FROM tareas
   WHERE equipo = ${equipo}
     AND titulo ILIKE ${'%' + q + '%'}
   ORDER BY id`;
```
</details>

---

## Ronda 4 · Caché y N+1

<details><summary>Pista 1 · Cuenta las consultas</summary>

Pon `?debug` mental: ¿cuántas veces le hablas a la base para armar el tablero?
Una por equipo, más una. Con 150 equipos son 151 idas a la base por visita.
</details>

<details><summary>Pista 2 · Las dos mitades</summary>

(a) Una sola consulta con `LEFT JOIN` + `GROUP BY` reemplaza las 151. (b) El
caché evita repetir ese trabajo en cada visita; la clave del TTL es que sea
corto, no que no exista.
</details>

<details><summary>Pista 3 · El caché</summary>

```ts
const guardado = await redis.get(clave);
if (guardado) return { valor: JSON.parse(guardado), desdeCache: true };
const valor = await calcular();
await redis.set(clave, JSON.stringify(valor), 'EX', ttlSeg);
return { valor, desdeCache: false };
```
Y quita el `pg_sleep`: estaba solo para que sintieras el N+1.
</details>

---

## Ronda 5 · Errores en silencio

<details><summary>Pista 1 · Qué hace el catch</summary>

Mira el `catch`: devuelve 200 con `filas: []`. Para quien llama, eso es
indistinguible de "no hay tareas". El error desapareció.
</details>

<details><summary>Pista 2 · Dos cosas, no una</summary>

(a) Deja de mentir: registra el error y responde 500. (b) Envuelve la consulta
en un span (`conSpan` de `lib/trazas.ts`) para verlo en Jaeger.
</details>

<details><summary>Pista 3 · El arreglo</summary>

```ts
} catch (e) {
  console.error('fallo al exportar:', e);
  return NextResponse.json({ ok: false, error: 'no se pudo exportar' }, { status: 500 });
}
```
Para verlo en Jaeger, envuelve el `await sql\`...\`` dentro de
`conSpan('exportar', async () => { ... })` y recarga <http://localhost:16686>.
</details>
