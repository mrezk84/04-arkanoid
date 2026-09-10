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

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );

  drawSprite( ctx, 'paddle', paddle.x, paddle.y, paddle.w, paddle.h );
}

function frame() {
  draw();
  requestAnimationFrame( frame );
}

loadSpritesheet( () => {
  requestAnimationFrame( frame );
} );
