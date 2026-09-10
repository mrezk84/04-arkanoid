# SPEC 02 — Animación de destrucción de bloques

> **Status:** Draft
> **Depends on:** SPEC 01
> **Date:** 2026-09-10
> **Objective:** Al romper un bloque, reproducir sobre su lugar la animación de explosión de 4 frames del spritesheet usando `drawFrame` y `EXPLOSION_FRAMES`, sin cambiar la física ni la colisión.

---

## Scope

**In:**

- Nuevo array `explosions` en memoria dentro de `game.js`, en paralelo a `blocks`.
- Al marcar un bloque como `alive = false` (impacto de la pelota), encolar una explosión con la posición, tamaño y color de ese bloque.
- Dibujar cada explosión con `drawFrame( ctx, frame, x, y, w, h )` sobre el mismo rectángulo que ocupaba el bloque (72×24).
- El frame a mostrar se elige por color con `EXPLOSION_FRAMES[ color ]` (array de 4 frames) según el tiempo transcurrido, usando `EXPLOSION_DURATION` como duración total de la animación.
- Varias explosiones activas al mismo tiempo, cada una con su propio tiempo de inicio.
- Cada explosión se elimina del array cuando su animación termina.
- El bucle `frame()` pasa a recibir el timestamp de `requestAnimationFrame` para medir el tiempo de las animaciones.
- El overlay de victoria (`phase = 'win'`) se posterga hasta que no quede ninguna explosión activa.
- `resetGame()` vacía el array `explosions`.

**Out of scope (for future specs):**

- Sonido de rotura de bloque (`assets/sounds/break-sound.mp3`).
- Animación o efecto al perder una vida, al rebotar, o en game over.
- Partículas, sacudida de pantalla (screen shake) o cualquier efecto que no sea el sprite de explosión.
- Bloques con varios golpes de resistencia (la explosión seguiría disparándose con un solo golpe).
- Power-ups y cápsulas que caen.
- Cambiar la duración o el número de frames de la animación (se usan los valores de `assets/spritesheet.js` tal cual).

---

## Data model

Se agrega una estructura nueva en memoria dentro de `game.js`. No hay persistencia. El objeto `block` no cambia.

```js
// Explosiones activas; una por bloque roto, se dibujan con drawFrame
const explosions = []; // { x, y, w, h, color, start }
```

- `x`, `y`, `w`, `h`: el rectángulo del bloque que se rompió (mismos valores que tenía el bloque).
- `color`: el color del bloque (`'red'`, `'hotpink'`, `'magenta'`, `'cyan'`, `'green'`, `'yellow'`); es una clave válida de `EXPLOSION_FRAMES`.
- `start`: timestamp en milisegundos (el que entrega `requestAnimationFrame`) del frame en que se rompió el bloque.

Convenciones:

- La animación dura `EXPLOSION_DURATION` ms en total, repartida en los 4 frames de `EXPLOSION_FRAMES[ color ]`.
- Índice de frame: `Math.floor( ( now - start ) / ( EXPLOSION_DURATION / 4 ) )`, recortado al rango `[ 0, 3 ]`.
- Una explosión está terminada cuando `now - start >= EXPLOSION_DURATION`; en ese momento se saca del array.
- Los 6 colores de fila del SPEC 01 existen como clave en `EXPLOSION_FRAMES`, así que no hace falta ningún mapeo ni color de respaldo.

---

## Implementation plan

1. En `game.js`, declarar `const explosions = [];` junto al resto del estado. Test manual: la página sigue cargando y jugando igual, sin errores en consola.
2. Cambiar `frame()` para recibir el timestamp de `requestAnimationFrame` (`function frame( now ) { ... requestAnimationFrame( frame ); }`) y pasar ese `now` a las funciones que lo necesiten. Test manual: el juego corre igual que antes.
3. En `bounceOnBlocks()`, al hacer `b.alive = false`, encolar `explosions.push( { x: b.x, y: b.y, w: b.w, h: b.h, color: b.color, start: now } )`. Requiere que `bounceOnBlocks` reciba `now`. Test manual: romper un bloque no cambia nada visible todavía, sin errores.
4. Nueva función `updateExplosions( now )` que recorre `explosions` y elimina las que cumplen `now - e.start >= EXPLOSION_DURATION`. Llamarla desde `frame()` en cada iteración (también fuera de `phase === 'playing'`, para que las explosiones terminen de reproducirse en la transición a victoria). Test manual: sin cambios visibles, el array no crece indefinidamente (verificable en consola).
5. Nueva función `drawExplosions( now )` que, por cada explosión, calcula el índice de frame `[ 0, 3 ]` y llama `drawFrame( ctx, EXPLOSION_FRAMES[ e.color ][ idx ], e.x, e.y, e.w, e.h )`. Llamarla desde `draw()` después de dibujar los bloques y antes de la paleta y la pelota. Test manual: al romper un bloque se ve la animación de explosión de 4 frames en su lugar y luego desaparece.
6. Postergar la victoria: en `bounceOnBlocks()`, cambiar la condición de `phase = 'win'` para que solo se dispare cuando no queden bloques vivos **y** `explosions.length === 0`; además, en `frame()` o `updateExplosions()`, pasar a `phase = 'win'` cuando la última explosión se elimina y no queda ningún bloque vivo. Test manual: al romper el último bloque, la pelota sigue un instante, se ve la última explosión completa y recién después aparece el overlay de "GANASTE".
7. En `resetGame()`, agregar `explosions.length = 0`. Test manual: ganar o perder, hacer clic en el overlay, y empezar una partida nueva sin explosiones fantasma.

---

## Acceptance criteria

- [ ] `index.html` abre y se juega sin errores en consola.
- [ ] Al romper un bloque se reproduce en su posición la animación de explosión de 4 frames.
- [ ] La explosión se dibuja con `drawFrame` y `EXPLOSION_FRAMES`, no con formas dibujadas a mano.
- [ ] La explosión ocupa el mismo rectángulo que ocupaba el bloque (72×24).
- [ ] El color de la explosión coincide con el color del bloque roto.
- [ ] La explosión desaparece sola al terminar la animación (`EXPLOSION_DURATION`).
- [ ] Romper varios bloques casi a la vez muestra varias explosiones en paralelo, cada una con su propio tiempo.
- [ ] La pelota rebota y sigue su curso en el mismo frame del impacto, sin esperar a la animación.
- [ ] El score sigue subiendo 10 puntos por bloque en el momento del impacto.
- [ ] Al romper el último bloque, el overlay de victoria aparece recién cuando la última explosión terminó.
- [ ] Después de reiniciar la partida no queda ninguna explosión de la partida anterior.

---

## Decisions

- **Sí:** array `explosions` separado de `blocks`. La explosión es solo visual; mantener la colisión y el conteo de bloques intactos evita tocar la física del SPEC 01.
- **No:** campos `exploding` / `explStart` en el objeto bloque. Obligaría a mantener el bloque "medio vivo" en el array y a filtrar en cada colisión y en el conteo de victoria.
- **Sí:** el bloque deja de existir para colisiones en el mismo impacto (comportamiento actual). El usuario lo pidió explícitamente.
- **Sí:** explosiones en paralelo, cada una con su `start`. El usuario lo pidió explícitamente.
- **Sí:** dibujar la explosión exactamente sobre el rect del bloque, sin agrandarla ni centrarla con desborde. Es lo más simple y predecible; no pisa bloques vecinos.
- **Sí:** postergar el overlay de victoria hasta que no quede ninguna explosión activa. Deja ver la animación del último bloque completa.
- **Sí:** usar el timestamp de `requestAnimationFrame` como reloj. Ya lo provee el bucle; evita sumar `performance.now()` por separado.
- **Sí:** usar `EXPLOSION_DURATION` y los 4 frames de `EXPLOSION_FRAMES` tal como están en `assets/spritesheet.js`. No se ajustan tiempos ni cantidad de frames.
- **No:** sonido de rotura. El usuario lo dejó fuera; va en un spec de audio aparte.
- **No:** efectos extra (partículas, screen shake). Fuera de alcance; este spec es solo el sprite de explosión.

---

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `updateExplosions` solo corre en `phase === 'playing'` y las explosiones quedan congeladas al pasar a victoria. | El plan llama a `updateExplosions` y `drawExplosions` siempre, no solo en `'playing'`. |
| Al ganar, si la victoria se dispara solo en `bounceOnBlocks`, nunca se re-evalúa porque `updateBall` deja de correr y `explosions` no se vacía. | El paso 6 también pasa a `'win'` desde `updateExplosions` cuando se elimina la última explosión sin bloques vivos. |
| `drawFrame` es no-op hasta que carga el spritesheet; una explosión encolada muy temprano no se vería. | El bucle ya arranca dentro del callback de `loadSpritesheet` (SPEC 01), así que el sheet siempre está cargado. |
| Con la victoria pospuesta, la pelota podría romper otro bloque en esos ~150 ms. | Es un solo nivel y al no quedar bloques vivos no hay nada más que romper; la pelota solo rebota en paredes y paleta. |

---

## What is **not** in this spec

- Sonido de rotura de bloque.
- Efectos de partículas o sacudida de pantalla.
- Animaciones para perder una vida, rebotar, game over o victoria.
- Bloques de múltiple golpe.
- Power-ups y cápsulas.
- Cambios a la duración o cantidad de frames de la animación.

Cada uno de esos, si entra, va en su propio spec.
