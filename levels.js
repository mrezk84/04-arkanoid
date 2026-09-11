// Niveles del juego (ver specs/03-niveles-y-sonido.md).
// Variables globales, sin módulos; se carga antes de game.js.

// Layout de cada nivel: una letra por color, '.' = hueco.
// R red, P hotpink, M magenta, C cyan, G green, Y yellow.
// Hasta 6 filas de hasta 10 columnas; caracteres sobrantes se ignoran.
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
  [ // nivel 4: dos columnas verticales separadas, un color por columna
    'RR......YY',
    'RR......YY',
    'RR......YY',
    'RR......YY',
    'RR......YY',
    'RR......YY',
  ],
  [ // nivel 5: cruz centrada, un color por brazo
    '...MMMM...',
    '...MMMM...',
    'CCCCGGCCCC',
    'CCCCGGCCCC',
    '...PPPP...',
    '...PPPP...',
  ],
];

const LEVEL_LETTERS = { R: 'red', P: 'hotpink', M: 'magenta', C: 'cyan', G: 'green', Y: 'yellow' };
const LEVEL_SPEED_STEP = 1.15;     // +15% de velocidad por nivel superado
const LEVEL_CLEAR_DURATION = 1000; // ms que dura el overlay 'NIVEL N'
