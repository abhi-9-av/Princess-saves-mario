// ============================================================================
// PRINCESS SAVES MARIO — Constants & Configuration
// ============================================================================

var GAME = {
    // Display
    TILE_SIZE: 16,
    SCALE: 3,
    get SCALED_TILE() { return this.TILE_SIZE * this.SCALE; },
    CANVAS_WIDTH: 816,   // 17 tiles wide
    CANVAS_HEIGHT: 480,  // 10 tiles high
    TARGET_FPS: 60,
    get DT() { return 1 / this.TARGET_FPS; },

    // Physics
    GRAVITY: 0.6,
    MAX_FALL_SPEED: 12,
    FRICTION: 0.85,

    // Player
    PLAYER: {
        SPEED: 1.6,
        JUMP_FORCE: -8.8,
        FLOAT_GRAVITY: 0.16,     // Reduced gravity while floating
        JUMP_CUT_MULTIPLIER: 0.5, // Variable jump height
        MAX_SPEED: 1.6,
        ACCELERATION: 0.18,
        DECELERATION: 0.35,
        WIDTH: 14,
        HEIGHT: 24,
        MAX_LIVES: 3,
        INVINCIBLE_TIME: 90,     // Frames of invincibility after hit
        PUNCH_RANGE: 20,
        PUNCH_DAMAGE: 1,
        BLAST_SPEED: 5.5,
        BLAST_DAMAGE: 1,
        BLAST_COOLDOWN: 20,      // Frames between blasts
    },

    // Enemies
    ENEMY: {
        GOOMBA: {
            SPEED: 0.6,
            WIDTH: 14,
            HEIGHT: 14,
            SCORE: 100,
        },
        KOOPA: {
            SPEED: 0.5,
            WIDTH: 14,
            HEIGHT: 22,
            SHELL_SPEED: 3.5,
            SCORE: 200,
        },
        PIRANHA: {
            WIDTH: 14,
            HEIGHT: 22,
            EMERGE_SPEED: 0.5,
            SCORE: 150,
        },
    },

    // Items
    COIN_SCORE: 50,
    COIN_TIME_BONUS: 1,  // Seconds added per coin

    // Timer
    STAGE_TIME: 60,  // Seconds per stage

    // Level
    LEVEL_COLS: 200,  // Max level width in tiles
    LEVEL_ROWS: 15,   // Level height in tiles

    // Colors
    COLORS: {
        SKY: '#5c94fc',
        SKY_UNDERGROUND: '#000000',
        SKY_CASTLE: '#1a0a2e',
        GROUND_BROWN: '#c84c0c',
        GROUND_TAN: '#fcb870',
        BRICK_DARK: '#a0340c',
        BRICK_LIGHT: '#dc7c34',
        QUESTION_YELLOW: '#fcbc3c',
        QUESTION_ORANGE: '#e09020',
        PIPE_GREEN: '#30a030',
        PIPE_GREEN_LIGHT: '#60d060',
        PIPE_GREEN_DARK: '#207820',
        PEACH_DRESS: '#ff69b4',
        PEACH_DRESS_DARK: '#d84890',
        PEACH_HAIR: '#ffd700',
        PEACH_SKIN: '#fcc8a8',
        PEACH_CROWN: '#ffd700',
        GOOMBA_BROWN: '#a04000',
        GOOMBA_TAN: '#d8a068',
        KOOPA_GREEN: '#30a030',
        KOOPA_SHELL: '#20802c',
        COIN_GOLD: '#fcbc3c',
        COIN_SHINE: '#fcfc9c',
        HEART_RED: '#ff2060',
        HEART_PINK: '#ff80a0',
        CLOUD_WHITE: '#fcfcfc',
        HILL_GREEN: '#80d010',
        HILL_GREEN_DARK: '#00a800',
        BUSH_GREEN: '#388c38',
        CASTLE_GRAY: '#b8b8b8',
        CASTLE_DARK: '#787878',
        HUD_WHITE: '#ffffff',
        HUD_SHADOW: '#000000',
        LAVA_RED: '#e02020',
        LAVA_ORANGE: '#fc6c24',
        WATER_BLUE: '#3070ec',
    },
};

// Tile type IDs
var TILE = {
    EMPTY: 0,
    GROUND: 1,
    BRICK: 2,
    QUESTION: 3,
    QUESTION_USED: 4,
    PIPE_TL: 5,    // Pipe top-left
    PIPE_TR: 6,    // Pipe top-right
    PIPE_BL: 7,    // Pipe body-left
    PIPE_BR: 8,    // Pipe body-right
    HARD_BLOCK: 9,
    CLOUD_TL: 10,
    CLOUD_TC: 11,
    CLOUD_TR: 12,
    CLOUD_BL: 13,
    CLOUD_BC: 14,
    CLOUD_BR: 15,
    HILL_TOP: 16,
    HILL_LEFT: 17,
    HILL_RIGHT: 18,
    HILL_FILL: 19,
    BUSH_LEFT: 20,
    BUSH_CENTER: 21,
    BUSH_RIGHT: 22,
    PLATFORM: 23,     // Floating semi-solid platform
    CASTLE_BLOCK: 24,
    CASTLE_WINDOW: 25,
    CASTLE_TOP: 26,
    LAVA: 27,
    BRIDGE: 28,
    DOOR: 29,         // Puzzle door / exit
    FLAG_POLE: 30,
    FLAG_TOP: 31,
    UNDERGROUND_BRICK: 32,
    SPIKE: 33,
    INVISIBLE: 34,    // Invisible block (becomes visible when hit)
};

// Entity spawn type IDs (placed in a separate spawn layer)
var SPAWN = {
    PLAYER: 'P',
    MARIO: 'M',       // Rescue target
    GOOMBA: 'G',
    KOOPA: 'K',
    PIRANHA: 'R',
    COIN: 'C',
    HEART: 'H',       // Extra life
    PUZZLE_DOOR: 'D',  // Tech puzzle gate
    CHECKPOINT: 'F',   // Flag checkpoint
    MOVING_PLATFORM: 'V', // Vertically moving platform
};

// Game states
var STATE = {
    LOADING: 'loading',
    TITLE: 'title',
    PLAYING: 'playing',
    PAUSED: 'paused',
    PUZZLE: 'puzzle',
    DYING: 'dying',
    GAME_OVER: 'gameover',
    VICTORY: 'victory',
    LEVEL_INTRO: 'level_intro',
    LEVEL_CLEAR: 'level_clear',
};

// Direction constants
var DIR = {
    LEFT: -1,
    RIGHT: 1,
    UP: -1,
    DOWN: 1,
    NONE: 0,
};

// Input action names
var ACTION = {
    LEFT: 'left',
    RIGHT: 'right',
    UP: 'up',
    DOWN: 'down',
    JUMP: 'jump',
    PUNCH: 'punch',
    BLAST: 'blast',
    INTERACT: 'interact',
    PAUSE: 'pause',
    CONFIRM: 'confirm',
};

// Expose all to global window and globalThis scope
if (typeof globalThis !== 'undefined') {
    globalThis.GAME = GAME;
    globalThis.TILE = TILE;
    globalThis.SPAWN = SPAWN;
    globalThis.STATE = STATE;
    globalThis.DIR = DIR;
    globalThis.ACTION = ACTION;
}
if (typeof window !== 'undefined') {
    window.GAME = GAME;
    window.TILE = TILE;
    window.SPAWN = SPAWN;
    window.STATE = STATE;
    window.DIR = DIR;
    window.ACTION = ACTION;
}
