// Arkanoid MVP — game logic (see specs/01-mvp-jugable.md)

const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

// Estado global de la partida
const state = {
  phase: 'playing', // 'playing' | 'levelclear' | 'paused' | 'gameover' | 'win'
  score: 0,
  lives: 3,
  level: 1,         // 1..3
};

// Velocidad de la pelota en px/frame
const BALL_SPEED = 5.5;

// LEVELS, LEVEL_LETTERS, LEVEL_SPEED_STEP y LEVEL_CLEAR_DURATION viven en
// levels.js (cargado antes que este archivo en index.html).
let levelClearStart = 0; // timestamp de rAF al entrar en 'levelclear'

// Sonidos precargados; una instancia por efecto
const SOUNDS = {
  bounce: new Audio( 'assets/sounds/ball-bounce.mp3' ),
  break: new Audio( 'assets/sounds/break-sound.mp3' ),
};
let muted = false;
let audioUnlocked = false;

// Reproduce un efecto reutilizando su instancia Audio: un disparo nuevo
// corta el anterior. Ignora el rechazo de play() (autoplay bloqueado).
function playSound( name ) {
  if ( muted ) return;
  const s = SOUNDS[ name ];
  s.currentTime = 0;
  s.play().catch( () => {} );
}

// Desbloquea el audio en la primera interacción del usuario: un play()/pause()
// silencioso sobre cada Audio sortea el bloqueo de autoplay del navegador.
function unlockAudio() {
  if ( audioUnlocked ) return;
  audioUnlocked = true;
  for ( const name in SOUNDS ) {
    const s = SOUNDS[ name ];
    s.play().then( () => s.pause() ).catch( () => {} );
  }
}

// Paleta: x/y es el borde superior izquierdo
const paddle = { x: 375, y: 560, w: 51, h: 7, speed: 14 };

// Pelota: x/y es el centro; velocidad constante en px/frame
const ball = { x: 400, y: 300, r: 8, vx: BALL_SPEED, vy: -BALL_SPEED };

// Velocidad de la pelota para el nivel n: base * paso ^ (n - 1)
function levelSpeed( n ) {
  return BALL_SPEED * LEVEL_SPEED_STEP ** ( n - 1 );
}

function resetBall() {
  ball.x = paddle.x + paddle.w / 2;
  ball.y = paddle.y - ball.r;
  const speed = levelSpeed( state.level );
  ball.vx = speed;
  ball.vy = -speed;
}

// Grilla de bloques: 10 columnas x 6 filas, un color por fila
const BLOCK_COLS = 10;
const BLOCK_ROWS = 6;
const BLOCK_W = 78;
const BLOCK_H = 28;
const BLOCK_MARGIN_X = ( canvas.width - BLOCK_COLS * BLOCK_W ) / 2;
const BLOCK_TOP = 60;
const ROW_COLORS = [ 'red', 'hotpink', 'magenta', 'cyan', 'green', 'yellow' ];

const blocks = [];

// Explosiones activas; una por bloque roto, se dibujan con drawFrame
const explosions = []; // { x, y, w, h, color, start }

// Reconstruye `blocks` a partir de un layout de texto de LEVELS.
// Recorre como máximo 6 filas y 10 columnas; ignora '.' y caracteres
// que no sean una clave de LEVEL_LETTERS.
function buildBlocks( layout ) {
  blocks.length = 0;
  const rows = Math.min( layout.length, BLOCK_ROWS );
  for ( let row = 0; row < rows; row++ ) {
    const line = layout[ row ];
    const cols = Math.min( line.length, BLOCK_COLS );
    for ( let col = 0; col < cols; col++ ) {
      const color = LEVEL_LETTERS[ line[ col ] ];
      if ( !color ) continue;
      blocks.push( {
        x: BLOCK_MARGIN_X + col * BLOCK_W,
        y: BLOCK_TOP + row * BLOCK_H,
        w: BLOCK_W,
        h: BLOCK_H,
        color: color,
        alive: true,
      } );
    }
  }
}

// Carga el nivel n (1..LEVELS.length): reconstruye los bloques desde su
// layout, fija la velocidad de la pelota del nivel, vacía las explosiones
// y reposiciona la pelota sobre la paleta.
function loadLevel( n ) {
  state.level = n;
  buildBlocks( LEVELS[ n - 1 ] );
  explosions.length = 0;
  resetBall();
}

loadLevel( 1 );

function updateBall( now ) {
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Rebote en paredes
  if ( ball.x - ball.r < 0 ) {
    ball.x = ball.r;
    ball.vx = -ball.vx;
    playSound( 'bounce' );
  }
  if ( ball.x + ball.r > canvas.width ) {
    ball.x = canvas.width - ball.r;
    ball.vx = -ball.vx;
    playSound( 'bounce' );
  }
  if ( ball.y - ball.r < 0 ) {
    ball.y = ball.r;
    ball.vy = -ball.vy;
    playSound( 'bounce' );
  }

  bounceOnPaddle();
  bounceOnBlocks( now );

  // La pelota cae por abajo: se pierde una vida
  if ( ball.y - ball.r > canvas.height ) {
    state.lives -= 1;
    resetBall();
    if ( state.lives === 0 ) state.phase = 'gameover';
  }
}

// Cuando no queda ningún bloque vivo y todas las explosiones terminaron:
// si aún hay niveles por delante, pasa a la fase 'levelclear'; si era el
// último nivel, la partida se gana.
function checkLevelCleared( now ) {
  if ( state.phase !== 'playing' ) return;
  if ( explosions.length > 0 ) return;
  if ( !blocks.every( ( b ) => !b.alive ) ) return;

  if ( state.level < LEVELS.length ) {
    state.phase = 'levelclear';
    levelClearStart = now;
  } else {
    state.phase = 'win';
  }
}

function bounceOnBlocks( now ) {
  for ( let i = 0; i < blocks.length; i++ ) {
    const b = blocks[ i ];
    if ( !b.alive ) continue;

    const hit = ball.x + ball.r >= b.x && ball.x - ball.r <= b.x + b.w &&
      ball.y + ball.r >= b.y && ball.y - ball.r <= b.y + b.h;

    if ( hit ) {
      b.alive = false;
      playSound( 'break' );
      explosions.push( { x: b.x, y: b.y, w: b.w, h: b.h, color: b.color, start: now } );
      ball.vy = -ball.vy;
      state.score += 10;
      break;
    }
  }

  // El cambio de nivel / victoria se posterga hasta que no quede ninguna
  // explosión en curso
  checkLevelCleared( now );
}

// Saca del array las explosiones cuya animación ya terminó
function updateExplosions( now ) {
  for ( let i = explosions.length - 1; i >= 0; i-- ) {
    if ( now - explosions[ i ].start >= EXPLOSION_DURATION ) explosions.splice( i, 1 );
  }

  // Al terminar la última explosión sin bloques vivos, recién ahí se pasa
  // de nivel (o se gana si era el último)
  checkLevelCleared( now );
}

// Ángulo máximo de salida respecto de la vertical, en los bordes de la paleta
const MAX_BOUNCE_ANGLE = Math.PI / 3;

function bounceOnPaddle() {
  const overlapX = ball.x + ball.r >= paddle.x && ball.x - ball.r <= paddle.x + paddle.w;
  const overlapY = ball.y + ball.r >= paddle.y && ball.y - ball.r <= paddle.y + paddle.h;

  if ( ball.vy > 0 && overlapX && overlapY ) {
    const center = paddle.x + paddle.w / 2;
    let hit = ( ball.x - center ) / ( paddle.w / 2 );
    if ( hit < -1 ) hit = -1;
    if ( hit > 1 ) hit = 1;

    const speed = Math.hypot( ball.vx, ball.vy );
    const angle = hit * MAX_BOUNCE_ANGLE;
    ball.vx = speed * Math.sin( angle );
    ball.vy = -speed * Math.cos( angle );
    ball.y = paddle.y - ball.r;
    playSound( 'bounce' );
  }
}

function clampPaddle() {
  if ( paddle.x < 0 ) paddle.x = 0;
  if ( paddle.x > canvas.width - paddle.w ) paddle.x = canvas.width - paddle.w;
}

canvas.addEventListener( 'mousemove', ( e ) => {
  unlockAudio();
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  paddle.x = mouseX - paddle.w / 2;
  clampPaddle();
} );

const keys = { left: false, right: false };

function isLeftKey( code ) {
  return code === 'ArrowLeft' || code === 'KeyA';
}

function isRightKey( code ) {
  return code === 'ArrowRight' || code === 'KeyD';
}

window.addEventListener( 'keydown', ( e ) => {
  unlockAudio();
  if ( e.code === 'KeyM' ) muted = !muted;
  if ( e.code === 'KeyP' || e.code === 'Escape' ) {
    if ( state.phase === 'playing' ) state.phase = 'paused';
    else if ( state.phase === 'paused' ) state.phase = 'playing';
  }
  if ( state.phase === 'paused' ) {
    const n = levelNumberFromKey( e.code );
    if ( n !== null && n <= LEVELS.length ) {
      loadLevel( n );
      state.phase = 'playing';
    }
  }
  if ( isLeftKey( e.code ) ) keys.left = true;
  if ( isRightKey( e.code ) ) keys.right = true;
} );

// Mapea las teclas numéricas (fila superior o numpad) 1-5 al número de nivel
function levelNumberFromKey( code ) {
  const digit = code.match( /^(?:Digit|Numpad)([1-5])$/ );
  return digit ? Number( digit[ 1 ] ) : null;
}

window.addEventListener( 'keyup', ( e ) => {
  if ( isLeftKey( e.code ) ) keys.left = false;
  if ( isRightKey( e.code ) ) keys.right = false;
} );

function updatePaddle() {
  if ( keys.left ) paddle.x -= paddle.speed;
  if ( keys.right ) paddle.x += paddle.speed;
  clampPaddle();
}

// Dibuja cada explosión activa sobre el rect del bloque que la generó
function drawExplosions( now ) {
  for ( let i = 0; i < explosions.length; i++ ) {
    const e = explosions[ i ];
    let idx = Math.floor( ( now - e.start ) / ( EXPLOSION_DURATION / 4 ) );
    if ( idx < 0 ) idx = 0;
    if ( idx > 3 ) idx = 3;
    drawFrame( ctx, EXPLOSION_FRAMES[ e.color ][ idx ], e.x, e.y, e.w, e.h );
  }
}

function draw( now ) {
  ctx.fillStyle = '#000';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );

  for ( let i = 0; i < blocks.length; i++ ) {
    const b = blocks[ i ];
    if ( b.alive ) drawSprite( ctx, 'block_' + b.color, b.x, b.y, b.w, b.h );
  }

  drawExplosions( now );

  drawSprite( ctx, 'paddle', paddle.x, paddle.y, paddle.w, paddle.h );
  drawSprite( ctx, 'ball', ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2 );

  if ( state.phase === 'playing' ) drawHud();
  if ( state.phase === 'levelclear' ) drawOverlay( 'NIVEL ' + ( state.level + 1 ) );
  if ( state.phase === 'paused' ) drawPauseOverlay();
  if ( state.phase === 'gameover' ) drawOverlay( 'GAME OVER' );
  if ( state.phase === 'win' ) drawOverlay( 'COMPLETASTE EL JUEGO' );
}

function drawOverlay( title ) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = '48px monospace';
  ctx.fillText( title, canvas.width / 2, canvas.height / 2 );
}

// Botones del selector de nivel dentro del overlay de pausa; uno por nivel,
// centrados en fila debajo del título 'PAUSA'.
const LEVEL_BUTTON_SIZE = 60;
const LEVEL_BUTTON_GAP = 30;
const LEVEL_BUTTONS = LEVELS.map( ( _, i ) => {
  const n = i + 1;
  const rowWidth = LEVELS.length * LEVEL_BUTTON_SIZE + ( LEVELS.length - 1 ) * LEVEL_BUTTON_GAP;
  const startX = ( canvas.width - rowWidth ) / 2;
  return {
    n: n,
    x: startX + i * ( LEVEL_BUTTON_SIZE + LEVEL_BUTTON_GAP ),
    y: canvas.height / 2 + 60,
    w: LEVEL_BUTTON_SIZE,
    h: LEVEL_BUTTON_SIZE,
  };
} );

const LEVEL_SKIP_LABEL = 'Saltar a nivel:';

// Overlay de pausa: reutiliza el fondo + título de drawOverlay y agrega
// el texto de ayuda y el selector de nivel numerado debajo.
function drawPauseOverlay() {
  drawOverlay( 'PAUSA' );

  ctx.font = '20px monospace';
  ctx.fillText( LEVEL_SKIP_LABEL, canvas.width / 2, canvas.height / 2 + 30 );

  ctx.font = '28px monospace';
  for ( let i = 0; i < LEVEL_BUTTONS.length; i++ ) {
    const btn = LEVEL_BUTTONS[ i ];
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect( btn.x, btn.y, btn.w, btn.h );
    ctx.fillText( String( btn.n ), btn.x + btn.w / 2, btn.y + btn.h / 2 );
  }
}

// Tamaño y separación de cada icono de vida en el HUD
const LIFE_ICON = 16;
const LIFE_GAP = 6;

function drawHud() {
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.textBaseline = 'top';

  ctx.textAlign = 'left';
  ctx.fillText( 'SCORE ' + state.score, 12, 12 );

  ctx.textAlign = 'center';
  ctx.fillText( 'NIVEL ' + state.level, canvas.width / 2, 12 );

  // Vidas: una bola del juego por cada vida restante, en vez de un número
  let x = canvas.width - 12 - LIFE_ICON;
  for ( let i = 0; i < state.lives; i++ ) {
    drawSprite( ctx, 'ball', x, 12, LIFE_ICON, LIFE_ICON );
    x -= LIFE_ICON + LIFE_GAP;
  }

  ctx.textAlign = 'right';
  ctx.fillText( 'VIDAS', x + LIFE_ICON, 12 );
}

function resetGame() {
  state.phase = 'playing';
  state.score = 0;
  state.lives = 3;
  state.level = 1;

  paddle.x = 375;

  loadLevel( 1 );
}

canvas.addEventListener( 'click', ( e ) => {
  unlockAudio();
  if ( state.phase === 'gameover' || state.phase === 'win' ) resetGame();
  if ( state.phase === 'paused' ) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    for ( let i = 0; i < LEVEL_BUTTONS.length; i++ ) {
      const btn = LEVEL_BUTTONS[ i ];
      if ( x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h ) {
        loadLevel( btn.n );
        state.phase = 'playing';
        break;
      }
    }
  }
} );

function frame( now ) {
  updatePaddle();
  if ( state.phase === 'playing' ) updateBall( now );
  updateExplosions( now );

  // Fin del overlay 'NIVEL N': carga el siguiente nivel y vuelve a jugar
  if ( state.phase === 'levelclear' && now - levelClearStart >= LEVEL_CLEAR_DURATION ) {
    loadLevel( state.level + 1 );
    state.phase = 'playing';
  }

  draw( now );
  requestAnimationFrame( frame );
}

loadSpritesheet( () => {
  requestAnimationFrame( frame );
} );
