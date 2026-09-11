# SPEC 03 — Niveles y sonido

> **Status:** Draft
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-09-11
> **Objective:** Agregar 3 niveles con layouts de bloques distintos entre sí (tablero de ajedrez, muro con hueco y rombo, todos con varios colores) y velocidad de pelota creciente, reproducir `ball-bounce.mp3` en rebotes y `break-sound.mp3` al romper un bloque con mute por tecla `M`, pausar el juego con `P` o `Escape` mostrando un selector de nivel con botones numerados, y mostrar `COMPLETASTE EL JUEGO` al terminar el nivel 3.

---

## Scope

**In:**

- Array `LEVELS` en `game.js` con 3 niveles, cada uno un array de hasta 6 strings de hasta 10 caracteres (una letra por color, `.` = hueco).
- Función `loadLevel( n )` que reconstruye `blocks` a partir de `LEVELS[ n - 1 ]`, fija la velocidad de la pelota del nivel, vacía `explosions` y reposiciona la pelota sobre la paleta.
- Campo `state.level` (`1`, `2`, `3`).
- Velocidad de la pelota por nivel: `BALL_SPEED` base del nivel 1, multiplicada por `LEVEL_SPEED_STEP` una vez por cada nivel superado.
- Nueva fase `state.phase = 'levelclear'`: overlay breve `NIVEL N` entre un nivel y el siguiente, con la simulación congelada, que dura `LEVEL_CLEAR_DURATION` ms y luego pasa al siguiente nivel.
- Al limpiar el nivel 3 se mantiene el overlay `GANASTE` actual; el clic reinicia desde el nivel 1.
- Score y vidas se conservan entre niveles; se reinician sólo al empezar una partida nueva.
- HUD muestra `NIVEL N` además de score y vidas.
- Objeto `SOUNDS` con dos instancias `Audio` precargadas: `bounce` (`assets/sounds/ball-bounce.mp3`) y `break` (`assets/sounds/break-sound.mp3`).
- `playSound( name )`: si no está muteado, hace `currentTime = 0` y `play()` sobre la instancia, ignorando el rechazo de la promesa.
- `bounce` suena en el rebote contra pared izquierda, pared derecha, techo y paleta.
- `break` suena al destruir un bloque.
- Mute: la tecla `M` alterna `muted` (arranca con sonido, sin persistencia, sin indicador en el HUD).
- Desbloqueo de audio: en el primer `mousemove`, `keydown` o `click` se hace un `play()`/`pause()` silencioso sobre cada `Audio` para sortear el bloqueo de autoplay del navegador.
- Los 3 layouts definitivos de `LEVELS`: nivel 1 tablero de ajedrez multicolor, nivel 2 muro con un hueco central rodeado de bloques de varios colores, nivel 3 rombo/diamante; cada uno combina varias de las 6 letras de color.
- Overlay de victoria con el texto `COMPLETASTE EL JUEGO` (reemplaza a `GANASTE`); el resto del comportamiento (clic reinicia desde el nivel 1) no cambia.
- Nueva fase `state.phase = 'paused'`: la tecla `P` o la tecla `Escape` (cualquiera de las dos, no una combinación) alterna entre `'playing'` y `'paused'`; en cualquier otra fase esas teclas no hacen nada. Congelada igual que `'levelclear'`/`'gameover'`/`'win'`: `updateBall` no corre mientras `state.phase === 'paused'`.
- Overlay de pausa: texto `PAUSA` y 3 botones numerados (`1`, `2`, `3`), uno por nivel.
- Clic sobre un botón numerado durante la pausa: llama `loadLevel( n )` para ese nivel (reconstruye bloques con su layout y fija su velocidad), conserva `score` y `lives`, y vuelve a `state.phase = 'playing'`.

**Out of scope (for future specs):**

- Más de 3 niveles, editor de niveles o carga de niveles desde archivo externo.
- Bloques grises indestructibles o bloques de varios golpes.
- Sonido de rebote en un bloque que se rompe (ese impacto sólo dispara `break`).
- Sonido de pérdida de vida, game over, victoria, cambio de nivel, pausa o selección de nivel.
- Música de fondo.
- Indicador visual de mute en el HUD y persistencia de la preferencia de mute.
- Récord persistente, mostrar el score final en el overlay de victoria.
- Bonus de score por terminar un nivel o por vidas restantes.
- Pantalla previa de "clic para empezar" (el arranque en movimiento del SPEC 01 no cambia).
- Aumento de velocidad de la pelota dentro de un mismo nivel.
- Pausar (o abrir el selector de nivel) durante `'levelclear'`, `'gameover'` o `'win'`.
- Indicador de qué nivel está actualmente activo dentro del selector (resaltar el botón del nivel en curso).
- Persistir el nivel elegido entre recargas de página.
- Combinación simultánea de `P` + `Escape` como gesto distinto a cualquiera de las dos por separado.

---

## Data model

Todo en memoria dentro de `game.js`. No hay persistencia.

```js
// state gana un campo de nivel; 'levelclear' y 'paused' son fases nuevas
const state = {
  phase: 'playing', // 'playing' | 'levelclear' | 'paused' | 'gameover' | 'win'
  score: 0,
  lives: 3,
  level: 1,         // 1..3
};

// Layout de cada nivel: letra por color, '.' = hueco
// R red, P hotpink, M magenta, C cyan, G green, Y yellow
const LEVELS = [
  [ // nivel 1: tablero de ajedrez multicolor, sin huecos
    'RCRCRCRCRC',
    'CRCRCRCRCR',
    'YMYMYMYMYM',
    'MYMYMYMYMY',
    'GPGPGPGPGP',
    'PGPGPGPGPG',
  ],
  [ // nivel 2: muro con hueco central (3 filas x 4 columnas), colores en diagonal
    'RYMCGPRYMC',
    'YM....PRYM',
    'MC....GPRY',
    'CG....RYMC',
    'GPRYMCGPRY',
    'PRYMCGPRYM',
  ],
  [ // nivel 3: rombo/diamante, un color por anillo
    '....RR....',
    '...YYYY...',
    '..MMMMMM..',
    '..CCCCCC..',
    '...GGGG...',
    '....PP....',
  ],
];

const LEVEL_LETTERS = { R: 'red', P: 'hotpink', M: 'magenta', C: 'cyan', G: 'green', Y: 'yellow' };
const LEVEL_SPEED_STEP = 1.15;     // +15% de velocidad por nivel superado
const LEVEL_CLEAR_DURATION = 1000; // ms que dura el overlay 'NIVEL N'

// Sonidos precargados; una instancia por efecto
const SOUNDS = {
  bounce: new Audio( 'assets/sounds/ball-bounce.mp3' ),
  break: new Audio( 'assets/sounds/break-sound.mp3' ),
};
let muted = false;
let audioUnlocked = false;
let levelClearStart = 0; // timestamp de requestAnimationFrame al entrar en 'levelclear'

// Botones del selector de nivel dentro del overlay de pausa; { n, x, y, w, h }
const LEVEL_BUTTONS = [ /* 3 rectángulos fijos, uno por nivel, centrados debajo de 'PAUSA' */ ];
```

Convenciones:

- La grilla sigue siendo 10 columnas × 6 filas como máximo, con el mismo origen que el SPEC 01: `x = BLOCK_MARGIN_X + col * BLOCK_W`, `y = BLOCK_TOP + row * BLOCK_H`, bloque de 72×24.
- Fila `row` = string `row` del layout; columna `col` = carácter `col` de ese string. Un carácter `.` o ausente no genera bloque.
- Cada letra del layout es una clave de `LEVEL_LETTERS`; el valor es un color válido de `ROW_COLORS` y de `EXPLOSION_FRAMES`.
- Velocidad del nivel `n`: `BALL_SPEED * LEVEL_SPEED_STEP ** ( n - 1 )`. `resetBall()` usa esa velocidad, no `BALL_SPEED` fijo.
- `playSound` reutiliza la misma instancia `Audio` por efecto; un disparo nuevo corta el anterior (`currentTime = 0`).
- El objeto `block` no cambia respecto del SPEC 01; el array `explosions` no cambia respecto del SPEC 02.
- `P` y `Escape` sólo tienen efecto en las fases `'playing'` y `'paused'`; en `'levelclear'`, `'gameover'` o `'win'` se ignoran.
- El clic sobre un botón de `LEVEL_BUTTONS` sólo se evalúa cuando `state.phase === 'paused'`; en las demás fases el handler de `click` sigue su lógica actual (reinicio en `'gameover'`/`'win'`).

---

## Implementation plan

1. En `game.js`, agregar `state.level = 1`, las constantes `LEVELS` (con los 3 layouts reales), `LEVEL_LETTERS`, `LEVEL_SPEED_STEP` y `LEVEL_CLEAR_DURATION`. Todavía nada las usa. Test manual: la página carga y se juega igual, sin errores en consola.
2. Reescribir `buildBlocks()` como `buildBlocks( layout )` que recorre las filas y columnas del `layout` y hace `push` de un bloque por cada carácter presente en `LEVEL_LETTERS`. Test manual: con `buildBlocks( LEVELS[ 0 ] )` se ve el layout del nivel 1 en pantalla.
3. Agregar `levelSpeed( n )` que devuelve `BALL_SPEED * LEVEL_SPEED_STEP ** ( n - 1 )` y hacer que `resetBall()` use `levelSpeed( state.level )` para `vx`/`vy`. Test manual: el nivel 1 se juega a la velocidad de siempre.
4. Agregar `loadLevel( n )`: setea `state.level = n`, llama `buildBlocks( LEVELS[ n - 1 ] )`, hace `explosions.length = 0` y `resetBall()`. Llamarla una vez al iniciar el archivo en lugar del `buildBlocks()` suelto. Test manual: arranca en el nivel 1 igual que antes.
5. En `resetGame()`, reemplazar `buildBlocks()` + reset de pelota por `state.level = 1` y `loadLevel( 1 )`; mantener el reset de `score`, `lives` y `paddle.x`. Test manual: ganar o perder, clic en el overlay, empieza en el nivel 1 con score 0 y 3 vidas.
6. Introducir la fase `'levelclear'`. En `updateExplosions( now )` y `bounceOnBlocks( now )`, cuando no queden bloques vivos y `explosions.length === 0`: si `state.level < LEVELS.length`, pasar a `state.phase = 'levelclear'` y guardar `levelClearStart = now`; si es el último nivel, pasar a `state.phase = 'win'` como hasta ahora. Test manual: al limpiar el nivel 1 el juego se congela (sin overlay todavía).
7. En `frame( now )`, cuando `state.phase === 'levelclear'` y `now - levelClearStart >= LEVEL_CLEAR_DURATION`, llamar `loadLevel( state.level + 1 )` y volver a `state.phase = 'playing'`. En `draw()`, dibujar el overlay `NIVEL N` (reusando `drawOverlay`) mientras `state.phase === 'levelclear'`, con `N = state.level + 1`. Test manual: al limpiar el nivel 1 aparece `NIVEL 2` ~1 s, luego se carga el nivel 2 y la pelota sale desde la paleta.
8. En `drawHud()`, agregar el texto `NIVEL ` + `state.level` (centrado arriba). Test manual: el HUD muestra el número de nivel y cambia al avanzar.
9. Verificar el nivel 3: al limpiarlo aparece `GANASTE` y el clic reinicia desde el nivel 1. Test manual: pasar los 3 niveles seguidos.
10. Agregar `SOUNDS`, `muted`, `audioUnlocked` y `playSound( name )` (retorna temprano si `muted`; `s.currentTime = 0; s.play().catch( () => {} )`). Test manual: sin cambios audibles todavía, sin errores.
11. Agregar `unlockAudio()` que, si `!audioUnlocked`, marca `audioUnlocked = true` y hace `play().then( pausar ).catch( () => {} )` sobre cada `Audio`. Llamarla desde los handlers de `mousemove`, `keydown` y `click` del canvas/ventana. Test manual: mover el mouse una vez no produce error en consola.
12. Llamar `playSound( 'bounce' )` en los 3 rebotes de pared de `updateBall()` y en el rebote de `bounceOnPaddle()`. Test manual: se escucha el rebote contra paredes y paleta.
13. Llamar `playSound( 'break' )` dentro de `bounceOnBlocks()` en el mismo `if ( hit )` donde se marca `b.alive = false`. Test manual: se escucha el sonido al romper un bloque.
14. Agregar en `keydown` el toggle: si `e.code === 'KeyM'`, `muted = !muted`. Test manual: con `M` se corta y se reactiva todo el audio.

---

## Acceptance criteria

- [ ] `index.html` abre y se juega sin errores en consola.
- [ ] El juego arranca en el nivel 1 y el HUD muestra `NIVEL 1`.
- [ ] Cada uno de los 3 niveles tiene un layout de bloques distinto al de los otros dos.
- [ ] Al limpiar todos los bloques de un nivel que no es el último, aparece el overlay `NIVEL N` con el número del nivel siguiente.
- [ ] El overlay `NIVEL N` se muestra alrededor de 1 segundo y luego el juego continúa solo, sin necesidad de clic.
- [ ] Tras el overlay, el nivel siguiente se carga con su propio layout y la pelota reaparece sobre la paleta.
- [ ] La velocidad de la pelota en el nivel 2 es mayor que en el nivel 1, y en el nivel 3 mayor que en el 2.
- [ ] El score y las vidas se conservan al pasar de un nivel al siguiente.
- [ ] Al limpiar el nivel 3 aparece el overlay `GANASTE`.
- [ ] Un clic sobre el overlay `GANASTE` reinicia la partida en el nivel 1 con score 0 y 3 vidas.
- [ ] El overlay de la animación de destrucción (SPEC 02) termina de reproducirse antes de que aparezca el overlay `NIVEL N` o `GANASTE`.
- [ ] Al rebotar contra la pared izquierda, derecha o el techo se reproduce `ball-bounce.mp3`.
- [ ] Al rebotar contra la paleta se reproduce `ball-bounce.mp3`.
- [ ] Al romper un bloque se reproduce `break-sound.mp3`.
- [ ] Romper un bloque no reproduce `ball-bounce.mp3` en ese mismo impacto.
- [ ] La tecla `M` silencia todos los sonidos; volver a pulsar `M` los reactiva.
- [ ] El juego arranca con el sonido activado.
- [ ] Tras la primera interacción del usuario (mover el mouse, una tecla o un clic) los sonidos se escuchan sin que el navegador los bloquee.

---

## Decisions

- **Sí:** niveles como array `LEVELS` de layouts de texto en `game.js`. Es zero-dependencias, legible y no obliga a cargar un archivo externo ni a parsear formatos.
- **Sí:** una letra por color y `.` para hueco. Deja ver el layout de un vistazo dentro del código.
- **Sí:** 3 niveles fijos. El usuario lo definió así; alcanza para cerrar la implementación.
- **Sí:** la velocidad sube por nivel con `LEVEL_SPEED_STEP` (+15%). El usuario pidió que la velocidad suba por nivel; un multiplicador único es predecible y fácil de ajustar.
- **No:** velocidad creciente dentro de un mismo nivel. El usuario marcó también "solo cambia el layout"; la única variación intra-partida es el salto entre niveles.
- **No:** bloques grises indestructibles. El usuario no los eligió; entrarían en un spec aparte con layouts que los contemplen.
- **Sí:** fase `'levelclear'` con overlay breve y auto-avance. El usuario eligió el overlay `NIVEL N` sin clic.
- **Sí:** reusar `drawOverlay` para `NIVEL N`. Ya centra y pinta el texto; no hace falta otra función.
- **Sí:** score y vidas se conservan entre niveles. Elección explícita del usuario.
- **Sí:** al pasar el nivel 3 se mantiene `GANASTE` y el clic reinicia desde el nivel 1. Elección explícita del usuario; no se toca el flujo de reinicio del SPEC 01.
- **No:** score final en el overlay de victoria ni bonus por nivel. Fuera de alcance.
- **Sí:** una instancia `Audio` por efecto, reiniciando `currentTime`. El usuario lo eligió; es lo más simple y para estos efectos cortos el corte del sonido previo no molesta.
- **Sí:** precargar y desbloquear el audio en la primera interacción. El usuario lo eligió; evita el bloqueo de autoplay sin agregar pantalla previa.
- **Sí:** ignorar el rechazo de `play()` con `.catch( () => {} )`. Antes del desbloqueo el navegador rechaza la promesa y no debe romper el frame.
- **Sí:** mute con tecla `M`, sin persistencia ni indicador. Elección explícita del usuario.
- **No:** pantalla de "clic para empezar". Cambiaría el arranque en movimiento fijado en el SPEC 01.
- **No:** sonidos de game over, victoria, cambio de nivel o pérdida de vida. Sólo los dos mp3 que ya están en `assets/sounds/`.

---

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El navegador bloquea `play()` hasta la primera interacción y los primeros rebotes salen mudos. | `unlockAudio()` en el primer `mousemove`/`keydown`/`click`; los rebotes antes de tocar nada son pocos y se aceptan mudos. |
| Al pasar de nivel, si el chequeo de "sin bloques vivos" corre antes de que terminen las explosiones, el overlay `NIVEL N` tapa la animación del SPEC 02. | La condición exige `explosions.length === 0`, igual que la victoria del SPEC 02; el overlay recién se dispara cuando no queda ninguna explosión. |
| En `'levelclear'` la simulación sigue corriendo y la pelota rompe algo o cae. | `frame()` sólo llama `updateBall` en `phase === 'playing'`; `'levelclear'` congela la pelota igual que los overlays de game over y victoria. |
| Un layout con más de 6 filas o más de 10 columnas dibuja bloques fuera del canvas o pisa el HUD. | `buildBlocks( layout )` recorre como máximo 6 filas y 10 columnas; los caracteres sobrantes se ignoran. Los 3 layouts de `LEVELS` respetan ese límite. |
| `LEVEL_SPEED_STEP` acumulado deja la pelota tan rápida que hace túnel a través de bloques o paleta. | Con 3 niveles el factor máximo es `1.15 ** 2 ≈ 1.32`; la colisión por solapamiento de rectángulos del SPEC 01 tolera ese rango. |

---

## What is **not** in this spec

- Más de 3 niveles, editor de niveles o carga desde archivo externo.
- Bloques grises indestructibles o de varios golpes.
- Sonido de rebote en el impacto que rompe un bloque.
- Sonidos de game over, victoria, cambio de nivel o pérdida de vida; música de fondo.
- Indicador de mute en el HUD y persistencia de la preferencia.
- Score final en el overlay de victoria y bonus de score por nivel o por vidas.
- Pantalla previa de "clic para empezar".
- Aumento de velocidad de la pelota dentro de un mismo nivel.

Cada uno de esos, si entra, va en su propio spec.
