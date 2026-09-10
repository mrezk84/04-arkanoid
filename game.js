// Arkanoid MVP — game logic (see specs/01-mvp-jugable.md)

const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

// Paleta: x/y es el borde superior izquierdo
const paddle = { x: 349, y: 560, w: 102, h: 14, speed: 8 };

// Pelota: x/y es el centro; velocidad constante en px/frame
const ball = { x: 400, y: 300, r: 8, vx: 4, vy: -4 };

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

  drawSprite( ctx, 'paddle', paddle.x, paddle.y, paddle.w, paddle.h );
  drawSprite( ctx, 'ball', ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2 );
}

function frame() {
  updatePaddle();
  updateBall();
  draw();
  requestAnimationFrame( frame );
}

loadSpritesheet( () => {
  requestAnimationFrame( frame );
} );
