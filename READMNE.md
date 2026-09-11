# Juego de Arkanoid

Juego de Arkanoid/Breakout hecho con HTML, CSS y JavaScript puro, **cero dependencias**, para jugar directamente en el navegador.

## Cómo correrlo

1. Cloná o descargá el repo.
2. Abrí `index.html` directo en el navegador **o** serví la carpeta con un servidor estático, por ejemplo:
   ```
   python3 -m http.server
   ```
3. Si usaste el servidor, entrá a `http://localhost:8000` en el navegador.
4. El juego arranca solo, en el nivel 1, apenas termina de cargar el spritesheet.

## Cómo jugar

1. Movés la paleta con el mouse, o con las flechas `←`/`→` (también `A`/`D`).
2. La pelota rebota sola contra paredes, paleta y bloques; cada bloque roto suma 10 puntos y dispara una animación de explosión.
3. Si la pelota cae por debajo de la paleta perdés una vida (arrancás con 3); al llegar a 0 aparece `GAME OVER`.
4. Al limpiar todos los bloques de un nivel aparece brevemente el cartel `NIVEL N` y arranca el siguiente automáticamente; al limpiar el nivel 5 aparece `COMPLETASTE EL JUEGO`.
5. `P` o `Escape` pausan y reanudan la partida en cualquier momento.
6. En pausa se muestra un selector de nivel: hacé clic en uno de los botones `1`-`5`, o apretá esa tecla numérica, para saltar directo a ese nivel (conserva el score y las vidas actuales).
7. `M` silencia/reactiva el sonido (rebote y rotura de bloques).
8. Con `GAME OVER` o `COMPLETASTE EL JUEGO` en pantalla, un clic sobre el canvas reinicia la partida desde el nivel 1 con score 0 y 3 vidas.

## Niveles

Cada nivel tiene su propio layout de bloques y una pelota más rápida que el anterior (multiplicador sobre la velocidad base):

| Nivel | Layout | Velocidad |
| --- | --- | --- |
| 1 | Parrilla completa 10×6, un color por fila | 1x |
| 2 | Pirámide descentrada | 1.1x |
| 3 | Tablero de ajedrez | 1.2x |
| 4 | Filas con huecos | 1.33x |
| 5 | Marco más cruz central | 1.46x |

## Estado del proyecto

El MVP jugable está implementado, junto con animación de destrucción de bloques, 5 niveles con dificultad creciente, sonido y pausa con selector de nivel. El desarrollo sigue un flujo spec-driven: cada feature se documenta primero en `specs/` (ver `CLAUDE.md` para el detalle del workflow) y después se implementa.

## Estructura

- `index.html` — el canvas del juego y la carga de scripts.
- `styles.css` — estilos mínimos para centrar el canvas.
- `levels.js` — definición de los layouts y velocidades de cada nivel.
- `game.js` — toda la lógica del juego (estado, física, dibujo, sonido).
- `assets/` — spritesheet, helper de renderizado (`spritesheet.js`) y sonidos.
- `specs/` — especificaciones de cada feature, en el formato del flujo spec-driven.
