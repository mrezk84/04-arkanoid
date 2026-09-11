// Niveles del juego (ver specs/03-niveles-y-sonido.md).
// Variables globales, sin módulos; se carga antes de game.js.

// Layout de cada nivel: una letra por color, '.' = hueco.
// R red, P hotpink, M magenta, C cyan, G green, Y yellow.
// Hasta 6 filas de hasta 10 columnas; caracteres sobrantes se ignoran.
const LEVELS = [
  [ // nivel 1: parrilla completa 10x6, un color por fila
    'RRRRRRRRRR',
    'PPPPPPPPPP',
    'MMMMMMMMMM',
    'CCCCCCCCCC',
    'GGGGGGGGGG',
    'YYYYYYYYYY',
  ],
  [ // nivel 2: pirámide descentrada (vértice corrido hacia la izquierda)
    '...RR.....',
    '..RRRR....',
    '..YYYYYY..',
    '.YYYYYYYY.',
    '.GGGGGGGGG',
    'GGGGGGGGGG',
  ],
  [ // nivel 3: tablero de ajedrez, celda a celda
    'CMCMCMCMCM',
    'MCMCMCMCMC',
    'CMCMCMCMCM',
    'MCMCMCMCMC',
    'CMCMCMCMCM',
    'MCMCMCMCMC',
  ],
  [ // nivel 4: filas con huecos, un color por fila
    'RRR.RRR.RR',
    'PP.PPP.PPP',
    'MMM.MM.MMM',
    'CC.CCC.CCC',
    'GGG.GG.GGG',
    'YY.YYY.YYY',
  ],
  [ // nivel 5: marco + cruz central
    'MMMMMMMMMM',
    'M...YY...M',
    'YYYYYYYYYY',
    'YYYYYYYYYY',
    'M...YY...M',
    'MMMMMMMMMM',
  ],
];

const LEVEL_LETTERS = { R: 'red', P: 'hotpink', M: 'magenta', C: 'cyan', G: 'green', Y: 'yellow' };

// Multiplicador de velocidad de la pelota por nivel (índice 0 = nivel 1).
// Valores fijos pedidos por el usuario, no una progresión geométrica.
const LEVEL_SPEED_MULTIPLIERS = [ 1, 1.1, 1.2, 1.33, 1.46 ];
const LEVEL_CLEAR_DURATION = 1000; // ms que dura el overlay 'NIVEL N'
