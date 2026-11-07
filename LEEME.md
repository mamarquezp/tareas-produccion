# Tareas Pro · Producción — Semana 17

**Seguridad, observabilidad y rendimiento**
Programación IV · Ing. Rodrigo Rodríguez · USPG

Clase **en línea**. Esta app funciona y también tiene **cinco pecados de
producción**, uno por ronda. Cada ronda es la misma mecánica de siempre: lo ves
en rojo, lo arreglas, lo ves en verde. El juez es `pnpm atacar`.

Cada ronda abre con un **caso real** —una empresa que vivió exactamente ese
fallo— y cierra con la bandera que capturas al corregirlo. Las banderas se
anotan en el marcador que el profe proyecta.

---

## Arranque

```bash
pnpm install
cp .env.ejemplo .env
docker compose up -d          # base, caché y Jaeger (el visor de trazas)
docker compose ps             # las tres en healthy/up
pnpm dev
```

Comprueba que todo responde:

```bash
curl -s localhost:3000/api/salud      # base: arriba, cache: arriba
```

Y abre el visor de trazas en el navegador: <http://localhost:16686> (Jaeger).
Por ahora está vacío; en la ronda 5 lo vas a llenar.

Deja la primera medición del juez a la vista:

```bash
pnpm atacar
```

Cinco rondas en rojo. **No las arregles todavía.** Léelas: son el mapa del día.

---

## Las cinco rondas

| # | Pecado | Dónde se arregla | Caso real |
|---|---|---|---|
| 1 | Broken Access Control (A01) | `app/api/tareas/[id]/route.ts` | First American, 2019 |
| 2 | Sin rate limiting | `lib/limite.ts` + ruta de IA | Dell, 2024 |
| 3 | Injection (A05) | `app/api/buscar/route.ts` | EchoLeak / Copilot, 2025 |
| 4 | Lento: N+1 y sin caché | `lib/cache.ts` + tablero | Cloudflare, nov 2025 |
| 5 | Errores en silencio (A09/A10) | `app/api/exportar` + trazas | Roblox, 2021 |

Tres de los cinco pecados son categorías **con número** del OWASP Top 10:2025.
Los otros dos —límite y caché— no están en la lista, pero son los que separan
una demo de algo que aguanta producción.

### Ronda 1 · La tarea que no es tuya

La ruta `GET /api/tareas/[id]` comprueba que tengas sesión y se queda tranquila.
Nunca comprueba que la tarea sea de tu equipo. Eres Café Luna; la tarea 6 es de
Taller Sur. Pídela:

```bash
curl -s --cookie "equipo=cafe-luna" localhost:3000/api/tareas/6
```

Si la ves, el pecado está vivo. Arréglalo para que el servidor verifique de
quién es cada objeto, en cada consulta.

> **Autenticación ≠ autorización.** Tener sesión válida no te da derecho a algo
> que no es tuyo. Ese fue el error de First American: 885 millones de documentos
> servidos a cualquiera que cambiara un dígito en la URL.

### Ronda 2 · La ruta que cuesta dinero

`POST /api/ia/resumir` "resume" tus tareas con un modelo. El modelo está
simulado; **el costo no**: cada llamada anota centavos en la tabla `gasto_ia`.
No hay límite. Llámala en bucle y mira subir la factura:

```bash
for i in $(seq 1 20); do curl -s -X POST --cookie "equipo=cafe-luna" \
  localhost:3000/api/ia/resumir | grep -o '"facturaAcumuladaCentavos":[0-9]*'; done
```

Completa `lib/limite.ts` y úsalo en la ruta para cortar el abuso con un 429.

> Dell, 2024: según el propio atacante, 5 000 peticiones por minuto durante tres
> semanas contra un endpoint sin límite. 49 millones de registros.

### Ronda 3 · La búsqueda que habla de más

`GET /api/buscar?q=` arma el SQL **pegando texto**. Cierra la comilla y pide de
otra tabla:

```bash
curl -s --cookie "equipo=cafe-luna" \
  "localhost:3000/api/buscar?q=x'%20UNION%20SELECT%200,valor,false%20FROM%20secretos%20--"
```

Si vuelve algo de la tabla `secretos`, la consulta no distingue tu búsqueda del
código. Arréglalo usando la plantilla etiquetada `sql\`...\``, que parametriza.

> Es el mismo problema de la inyección de prompt que vieron en RAG: ni la base
> ni el modelo distinguen de dónde viene cada token cuando mezclas instrucción y
> dato en una sola cadena.

### Ronda 4 · El tablero que tumba la base

`GET /api/tablero` hace una consulta por cada equipo (N+1) y no cachea nada. Con
tres equipos no se nota; agrega relleno y mídelo:

```bash
pnpm sembrar                  # 150 equipos de relleno
curl -s localhost:3000/api/tablero | grep -o '"msDeServidor":[0-9]*'
```

Mata el N+1 con un solo `GROUP BY` y envuelve el resultado en caché
(`lib/cache.ts`). La segunda visita debe venir de caché.

> Cloudflare, nov 2025: una consulta que no filtraba bien generó un archivo que
> duplicó filas y reventó un límite de memoria. Su peor caída desde 2019.

### Ronda 5 · El error que nadie ve

`GET /api/exportar` falla por dentro (una columna no existe) y el `catch`
devuelve 200 con lista vacía. El usuario cree que no tiene tareas. Nadie se
entera.

```bash
curl -s --cookie "equipo=cafe-luna" localhost:3000/api/exportar
```

Dos arreglos: que el error deje de tragarse (responde 500, y registra), y que la
consulta quede envuelta en un span (`lib/trazas.ts`) para que lo veas en Jaeger.

> Roblox, 2021: 73 horas de caída, ~50 de diagnóstico. Postmortem: *"we lacked
> the telemetry data that would have made it easier to figure out what was
> wrong."* La observabilidad no evita el fallo; decide cuánto dura.

---

## Si te atoras

`PISTAS.md` tiene tres pistas por ronda, de menos a más explícita. Ábrelas solo
tras cinco minutos atascado.

**Lo que más se olvida:**
- Ronda 2: el `EXPIRE` va **solo** cuando el contador vale 1. Si lo pones en
  cada llamada, la ventana nunca termina y el límite no sirve.
- Ronda 4: el caché sin TTL es una fuga de datos viejos. Pon un `EX` corto.
- Ronda 5: `console.error` antes del 500. Un 500 sin registro sigue siendo
  silencio para quien está de guardia.

---

## La tarea

Entrega el **sábado 14 de noviembre antes de las 16:00**, sobre tu propio
proyecto:

1. Una ruta tuya con verificación de autorización por objeto, no solo de sesión.
2. Rate limiting con Redis en tu ruta más cara.
3. Caché con TTL en tu consulta más pesada, con la medición antes y después.
4. Un error que hoy se traga tu código, convertido en un 500 registrado.
5. Trazas saliendo a Jaeger, con **una captura del árbol de una petición tuya**.

Lo que leo primero: la captura de Jaeger y la medición de caché antes/después.
