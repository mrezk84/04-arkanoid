// Arkanoid MVP — game logic (see specs/01-mvp-jugable.md)

const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

// Estado global de la partida
const state = {
  phase: 'playing', // 'playing' | 'gameover' | 'win'
  score: 0,
  lives: 3,
};

// Velocidad de la pelota en px/frame
const BALL_SPEED = 7.5;

// Paleta: x/y es el borde superior izquierdo
const paddle = { x: 349, y: 560, w: 102, h: 14, speed: 14 };

// Pelota: x/y es el centro; velocidad constante en px/frame
const ball = { x: 400, y: 300, r: 8, vx: BALL_SPEED, vy: -BALL_SPEED };

function resetBall() {
  ball.x = paddle.x + paddle.w / 2;
  ball.y = paddle.y - ball.r;
  ball.vx = BALL_SPEED;
  ball.vy = -BALL_SPEED;
}

// Grilla de bloques: 10 columnas x 6 filas, un color por fila
const BLOCK_COLS = 10;
const BLOCK_ROWS = 6;
const BLOCK_W = 72;
const BLOCK_H = 24;
const BLOCK_MARGIN_X = 40;
const BLOCK_TOP = 60;
const ROW_COLORS = [ 'red', 'hotpink', 'magenta', 'cyan', 'green', 'yellow' ];

const blocks = [];

function buildBlocks() {
  blocks.length = 0;
  for ( let row = 0; row < BLOCK_ROWS; row++ ) {
    for ( let col = 0; col < BLOCK_COLS; col++ ) {
      blocks.push( {
        x: BLOCK_MARGIN_X + col * BLOCK_W,
        y: BLOCK_TOP + row * BLOCK_H,
        w: BLOCK_W,
        h: BLOCK_H,
        color: ROW_COLORS[ row ],
        alive: true,
      } );
    }
  }
}

buildBlocks();

function updateBall() {
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Rebote en paredes
  if ( ball.x - ball.r < 0 ) {
    ball.x = ball.r;
    ball.vx = -ball.vx;
  }
  if ( ball.x + ball.r > canvas.width ) {
    ball.x = canvas.width - ball.r;
    ball.vx = -ball.vx;
  }
  if ( ball.y - ball.r < 0 ) {
    ball.y = ball.r;
    ball.vy = -ball.vy;
  }

  bounceOnPaddle();
  bounceOnBlocks();

  // La pelota cae por abajo: se pierde una vida
  if ( ball.y - ball.r > canvas.height ) {
    state.lives -= 1;
    resetBall();
    if ( state.lives === 0 ) state.phase = 'gameover';
  }
}

function bounceOnBlocks() {
  for ( let i = 0; i < blocks.length; i++ ) {
    const b = blocks[ i ];
    if ( !b.alive ) continue;

    const hit = ball.x + ball.r >= b.x && ball.x - ball.r <= b.x + b.w &&
      ball.y + ball.r >= b.y && ball.y - ball.r <= b.y + b.h;

    if ( hit ) {
      b.alive = false;
      ball.vy = -ball.vy;
      state.score += 10;
      break;
    }
  }

  if ( blocks.every( ( b ) => !b.alive ) ) state.phase = 'win';
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
  }
}

function clampPaddle() {
  if ( paddle.x < 0 ) paddle.x = 0;
  if ( paddle.x > canvas.width - paddle.w ) paddle.x = canvas.width - paddle.w;
}

canvas.addEventListener( 'mousemove', ( e ) => {
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
  if ( isLeftKey( e.code ) ) keys.left = true;
  if ( isRightKey( e.code ) ) keys.right = true;
} );

window.addEventListener( 'keyup', ( e ) => {
  if ( isLeftKey( e.code ) ) keys.left = false;
  if ( isRightKey( e.code ) ) keys.right = false;
} );

function updatePaddle() {
  if ( keys.left ) paddle.x -= paddle.speed;
  if ( keys.right ) paddle.x += paddle.speed;
  clampPaddle();
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );

  for ( let i = 0; i < blocks.length; i++ ) {
    const b = blocks[ i ];
    if ( b.alive ) drawSprite( ctx, 'block_' + b.color, b.x, b.y, b.w, b.h );
  }

  drawSprite( ctx, 'paddle', paddle.x, paddle.y, paddle.w, paddle.h );
  drawSprite( ctx, 'ball', ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2 );

  if ( state.phase === 'playing' ) drawHud();
  if ( state.phase === 'gameover' ) drawOverlay( 'GAME OVER' );
  if ( state.phase === 'win' ) drawOverlay( 'GANASTE' );
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

// Tamaño y separación de cada icono de vida en el HUD
const LIFE_ICON = 16;
const LIFE_GAP = 6;

function drawHud() {
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.textBaseline = 'top';

  ctx.textAlign = 'left';
  ctx.fillText( 'SCORE ' + state.score, 12, 12 );

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

  paddle.x = 349;

  buildBlocks();

  ball.x = 400;
  ball.y = 300;
  ball.vx = BALL_SPEED;
  ball.vy = -BALL_SPEED;
}

canvas.addEventListener( 'click', () => {
  if ( state.phase === 'gameover' || state.phase === 'win' ) resetGame();
} );

function frame() {
  updatePaddle();
  if ( state.phase === 'playing' ) updateBall();
  draw();
  requestAnimationFrame( frame );
}

loadSpritesheet( () => {
  requestAnimationFrame( frame );
} );
