# SPEC 01 — MVP jugable de Arkanoid

> **Status:** aprobado
> **Depends on:** —
> **Date:** 2026-09-09
> **Objective:** Implementar un Arkanoid jugable de un solo nivel en canvas 800×600 con paleta, pelota, 60 bloques, 3 vidas, score y overlays de game over y victoria.

---

## Scope

**In:**

- `index.html`, `game.js` y `styles.css` nuevos en la raíz del proyecto, sin dependencias ni build.
- Canvas de 800×600 px con fondo negro.
- Carga del spritesheet vía `loadSpritesheet` antes del primer frame; todo el dibujo pasa por `drawSprite`.
- Paleta controlada por mouse **y** por teclado (flechas y `A`/`D`) a la vez, sin salirse del canvas.
- Una pelota con rebote simple y física predecible (velocidad constante en píxeles/frame).
- Rebote de la pelota en pared izquierda, pared derecha y techo.
- Rebote de la pelota en la paleta, con ángulo dependiente del punto de impacto sobre la paleta.
- Grilla fija de 60 bloques, 10 columnas × 6 filas, un color por fila.
- Cada bloque se rompe con un impacto, desaparece y suma 10 puntos.
- HUD durante el juego con score actual y 3 vidas.
- Al caer la pelota por abajo: se pierde una vida y la pelota se reposiciona sobre la paleta.
- Al llegar a 0 vidas: overlay de game over.
- Al romper los 60 bloques: overlay de victoria.
- Reinicio de partida haciendo clic sobre el overlay de game over o de victoria.
- La pelota arranca en movimiento al cargar la página (sin pantalla previa de "clic para empezar").

**Out of scope (for future specs):**

- Power-ups y cápsulas que caen.
- Animación de explosión de bloques (`drawFrame` / `EXPLOSION_FRAMES`).
- Sonido (rebote y rotura de bloque).
- Varios niveles y progresión entre niveles.
- Bloques con más de un golpe de resistencia.
- Récord persistente en `localStorage`.
- Estado de pausa dedicado.
- Aumento de velocidad de la pelota con el tiempo.
- Versión mobile / controles táctiles.

---

## Data model

Estructuras nuevas, todas en memoria dentro de `game.js`. No hay persistencia.

```js
// Estado global de la partida
const state = {
  phase: 'playing',      // 'playing' | 'gameover' | 'win'
  score: 0,              // +10 por bloque
  lives: 3,
};

// Paleta
const paddle = { x: 349, y: 560, w: 102, h: 14, speed: 8 }; // x = borde izquierdo

// Pelota
const ball = { x: 400, y: 300, r: 8, vx: 4, vy: -4 }; // px/frame, velocidad constante

// Bloque (60 en un array plano)
// { x, y, w, h, color, alive }
const blocks = []; // color por fila, de arriba a abajo:
//   fila 0: 'red', 1: 'hotpink', 2: 'magenta', 3: 'cyan', 4: 'green', 5: 'yellow'
```

Convenciones:

- Origen de coordenadas: esquina superior izquierda del canvas.
- `x`/`y` de paleta y bloque son el borde superior izquierdo; `x`/`y` de la pelota es el centro.
- Velocidades en píxeles por frame; el bucle usa `requestAnimationFrame`.
- Nombres de sprite: `'paddle'`, `'ball'`, `'block_<color>'` (`red`, `yellow`, `cyan`, `magenta`, `hotpink`, `green`, `gray`).
- Layout de bloques: área desde `y = 60`, márgenes laterales de 40 px, ancho útil 720 px → bloque de 72×24 con 0 px de separación (ajustable en implementación, no es criterio de aceptación mientras entren 10×6 dentro del canvas).

---

## Implementation plan

1. Crear `index.html` con un `<canvas id="game" width="800" height="600">`, incluir `assets/spritesheet.js`, `game.js` y `styles.css`. Crear `styles.css` con fondo de página y canvas centrado. Test manual: abrir en el navegador, se ve el canvas negro sin errores en consola.
2. En `game.js`: obtener el contexto 2D, llamar a `loadSpritesheet` y, en su callback, arrancar un bucle `requestAnimationFrame` que pinta el fondo negro cada frame. Test manual: canvas negro estable, sin errores.
3. Dibujar la paleta con `drawSprite(ctx, 'paddle', ...)` en su posición inicial. Test manual: se ve la paleta cerca del borde inferior.
4. Input de mouse: `mousemove` sobre el canvas mueve `paddle.x` (centrado en el cursor), con clamp a `[0, 800 - paddle.w]`. Test manual: la paleta sigue el mouse y no se sale.
5. Input de teclado: `keydown`/`keyup` para flechas y `A`/`D` mueven `paddle.x` por frame con la misma restricción de clamp. Test manual: la paleta se mueve con el teclado y no se sale.
6. Dibujar y mover la pelota: se dibuja con `drawSprite(ctx, 'ball', ...)`, arranca en movimiento al cargar, posición += velocidad cada frame. Test manual: la pelota se mueve al cargar la página.
7. Rebote en paredes: invertir `vx` al tocar izquierda o derecha, invertir `vy` al tocar el techo. Test manual: la pelota rebota en las 3 paredes.
8. Rebote en la paleta: al solaparse pelota y paleta con la pelota bajando, invertir `vy` y ajustar `vx` según la distancia del impacto al centro de la paleta. Test manual: la pelota rebota en la paleta y cambia de dirección.
9. Construir el array de 60 bloques (10×6) con color por fila y dibujarlos con `drawSprite(ctx, 'block_<color>', ...)`. Test manual: se ven 60 bloques en 10 columnas y 6 filas.
10. Colisión pelota-bloque: al impactar un bloque `alive`, marcarlo como no vivo, invertir `vy` y sumar 10 a `state.score`. Test manual: al tocar un bloque desaparece.
11. HUD: dibujar el texto del score y las 3 vidas sobre el canvas durante `phase === 'playing'`. Test manual: score y vidas visibles y el score sube de a 10.
12. Pérdida de vida: si la pelota cruza el borde inferior, `state.lives -= 1` y reposicionar la pelota sobre la paleta con velocidad hacia arriba. Test manual: cae la pelota, baja una vida, la pelota vuelve sobre la paleta.
13. Game over: si `state.lives === 0`, pasar a `phase = 'gameover'`, congelar la simulación y dibujar el overlay de game over. Test manual: al agotar las vidas aparece el overlay.
14. Victoria: si no queda ningún bloque `alive`, pasar a `phase = 'win'`, congelar la simulación y dibujar el overlay de victoria. Test manual: al romper todos los bloques aparece el overlay.
15. Reinicio: un `click` sobre el canvas mientras `phase` es `'gameover'` o `'win'` reinicia `state`, paleta, pelota y bloques a sus valores iniciales y vuelve a `phase = 'playing'`. Test manual: clic en el overlay y empieza una partida nueva.

---

## Acceptance criteria

- [x] `index.html` abre en el navegador sin ningún error en consola.
- [x] El canvas mide 800×600 px y tiene fondo negro.
- [x] El paddle se mueve con el mouse sin salirse del canvas.
- [x] El paddle se mueve con <-> sin salirse del canvas.
- [x] La pelota arranca moviéndose al cargar la página.
- [x] La pelota rebota en las 3 paredes: izquierda, derecha y techo.
- [x] La pelota rebota en la paddle.
- [x] Se dibujan 60 bloques (10×6) con sus colores por fila.
- [ ] Al tocar un bloque, el bloque desaparece y el score sube 10 puntos.
- [ ] El score se muestra en el HUD durante el juego.
- [ ] Las 3 vidas se muestran en el HUD durante el juego.
- [ ] Al caer la pelota se pierde una vida y la pelota se reposiciona sobre la paleta.
- [ ] Al llegar a 0 vidas aparece el overlay de game over.
- [ ] Al romper todos los bloques aparece el overlay de victoria.
- [ ] Un clic sobre el overlay de game over o de victoria reinicia la partida.

---

## Decisions

- **Sí:** un solo `game.js` con todo el juego. Es un MVP zero-dependencias; separar en módulos ES agrega archivos y `type="module"` sin beneficio ahora.
- **Sí:** `index.html` + `game.js` + `styles.css` en la raíz. Coincide con "abrir el archivo de entrada en el navegador" del README.
- **Sí:** grilla fija de 10×6 = 60 bloques. El usuario la definió como suficiente para el MVP.
- **Sí:** canvas 800×600. Definido por el usuario; el spritesheet se escala al dibujar, no condiciona el tamaño del canvas.
- **Sí:** todos los bloques se rompen de un golpe. Sin estado de resistencia por color.
- **Sí:** color de bloque por fila, solo estético.
- **Sí:** mouse y teclado activos a la vez. El usuario eligió "ambos".
- **Sí:** rebote en la paleta con ángulo según punto de impacto. Es la física esperada de Arkanoid y evita que la pelota quede en un loop vertical.
- **Sí:** la pelota arranca en movimiento al cargar. No hay estado "ready" ni "clic para empezar".
- **Sí:** score solo de sesión, mostrado en el HUD. Los criterios de aceptación no piden récord.
- **No:** récord persistente en `localStorage`. Va en un spec futuro si se pide.
- **No:** power-ups. Abren demasiado alcance (cápsulas que caen, colisión con paleta, efectos temporizados); spec aparte.
- **No:** animación de explosión al romper bloque. El usuario la dejó fuera del MVP; el bloque simplemente desaparece.
- **No:** sonido. El usuario no quiere audio en este MVP.
- **No:** varios niveles. Un solo nivel definido explícitamente.
- **No:** estado de pausa. Solo overlays de game over y victoria.
- **No:** aumento de velocidad de la pelota. Física predecible y constante.

---

## Risks

| Riesgo | Mitigación |
| --- | --- |
| La pelota queda en un rebote casi vertical y el nivel se vuelve tedioso. | El rebote en la paleta ajusta `vx` según el punto de impacto; se puede fijar un `vx` mínimo. |
| Túnel: con velocidad alta la pelota atraviesa un bloque o la paleta entre frames. | Velocidad inicial moderada (~4 px/frame) y colisión por solapamiento de rectángulos, no por punto exacto. |
| `drawSprite` es no-op hasta que carga el spritesheet y se ve un canvas negro unos ms. | El bucle sólo arranca dentro del callback de `loadSpritesheet`. |
| Doble input (mouse + teclado) compitiendo por `paddle.x` en el mismo frame. | El teclado aplica un delta y el mouse fija la posición; el último evento del frame manda, con clamp siempre al final. |

---

## What is **not** in this spec

- Power-ups y cápsulas.
- Animación de explosión de bloques.
- Sonido.
- Varios niveles y progresión.
- Bloques de múltiple golpe.
- Récord persistente en `localStorage`.
- Pausa.
- Versión mobile / táctil.

Cada uno de esos, si entra, va en su propio spec.
