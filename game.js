// Arkanoid MVP — game logic (see specs/01-mvp-jugable.md)

const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

// Paleta: x/y es el borde superior izquierdo
const paddle = { x: 349, y: 560, w: 102, h: 14, speed: 8 };

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
}

function frame() {
  updatePaddle();
  draw();
  requestAnimationFrame( frame );
}

loadSpritesheet( () => {
  requestAnimationFrame( frame );
} );
