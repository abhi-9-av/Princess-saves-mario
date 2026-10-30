// ============================================================================
// PRINCESS SAVES MARIO — Programmatic Pixel Art Assets
// ============================================================================

var Assets = (() => {
    const sprites = {};
    let loaded = false;

    // Helper to create an offscreen canvas with pixel-grid drawing
    function createOffscreen(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        return { canvas, ctx };
    }

    // Draw a pixel grid using a palette map and ASCII array
    function drawPixelArt(ctx, x, y, rows, palette, scale = 1) {
        for (let r = 0; r < rows.length; r++) {
            const line = rows[r];
            for (let c = 0; c < line.length; c++) {
                const char = line[c];
                if (char !== ' ' && char !== '.' && palette[char]) {
                    ctx.fillStyle = palette[char];
                    ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
                }
            }
        }
    }

    // ---------------------------------------------------------
    // GENERATORS
    // ---------------------------------------------------------

    // TILES (16x16)
    function generateTileSprites() {
        const T = GAME.COLORS;

        // 1. Ground Tile
        const { canvas: ground, ctx: gCtx } = createOffscreen(16, 16);
        gCtx.fillStyle = T.GROUND_BROWN;
        gCtx.fillRect(0, 0, 16, 16);
        // Mortar lines & highlights
        gCtx.fillStyle = T.GROUND_TAN;
        gCtx.fillRect(0, 0, 16, 1);
        gCtx.fillRect(0, 7, 16, 1);
        gCtx.fillRect(0, 15, 16, 1);
        gCtx.fillRect(7, 0, 1, 7);
        gCtx.fillRect(0, 8, 1, 7);
        gCtx.fillRect(11, 8, 1, 7);
        // Bevel shadows
        gCtx.fillStyle = '#6e2704';
        gCtx.fillRect(0, 6, 16, 1);
        gCtx.fillRect(0, 14, 16, 1);
        gCtx.fillRect(6, 1, 1, 6);
        gCtx.fillRect(10, 8, 1, 6);
        sprites.ground = ground;

        // 2. Brick Tile
        const { canvas: brick, ctx: bCtx } = createOffscreen(16, 16);
        bCtx.fillStyle = T.BRICK_DARK;
        bCtx.fillRect(0, 0, 16, 16);
        bCtx.fillStyle = T.BRICK_LIGHT;
        bCtx.fillRect(0, 0, 7, 3);
        bCtx.fillRect(8, 0, 8, 3);
        bCtx.fillRect(0, 4, 3, 3);
        bCtx.fillRect(4, 4, 7, 3);
        bCtx.fillRect(12, 4, 4, 3);
        bCtx.fillRect(0, 8, 7, 3);
        bCtx.fillRect(8, 8, 8, 3);
        bCtx.fillRect(0, 12, 5, 3);
        bCtx.fillRect(6, 12, 7, 3);
        bCtx.fillRect(14, 12, 2, 3);
        bCtx.fillStyle = '#421405'; // Dark mortar
        bCtx.fillRect(0, 3, 16, 1);
        bCtx.fillRect(0, 7, 16, 1);
        bCtx.fillRect(0, 11, 16, 1);
        bCtx.fillRect(0, 15, 16, 1);
        bCtx.fillRect(7, 0, 1, 4);
        bCtx.fillRect(3, 4, 1, 4);
        bCtx.fillRect(11, 4, 1, 4);
        bCtx.fillRect(7, 8, 1, 4);
        bCtx.fillRect(5, 12, 1, 4);
        bCtx.fillRect(13, 12, 1, 4);
        sprites.brick = brick;

        // 3. Question Blocks (Frames 0, 1)
        const qFrames = [];
        for (let f = 0; f < 2; f++) {
            const { canvas: qCan, ctx: qCtx } = createOffscreen(16, 16);
            qCtx.fillStyle = f === 0 ? T.QUESTION_YELLOW : '#fde06a';
            qCtx.fillRect(0, 0, 16, 16);
            qCtx.fillStyle = T.QUESTION_ORANGE;
            qCtx.strokeRect(0.5, 0.5, 15, 15);
            // Corner bolts
            qCtx.fillStyle = '#4a2400';
            qCtx.fillRect(1, 1, 1, 1);
            qCtx.fillRect(14, 1, 1, 1);
            qCtx.fillRect(1, 14, 1, 1);
            qCtx.fillRect(14, 14, 1, 1);
            // '?' symbol
            const qChar = [
                "  XXXX  ",
                " X    X ",
                "    XX  ",
                "   XX   ",
                "   XX   ",
                "        ",
                "   XX   "
            ];
            drawPixelArt(qCtx, 4, 4, qChar, { 'X': '#642200' });
            qFrames.push(qCan);
        }
        sprites.question = qFrames;

        // 4. Used Question Block
        const { canvas: qUsed, ctx: quCtx } = createOffscreen(16, 16);
        quCtx.fillStyle = '#8b6946';
        quCtx.fillRect(0, 0, 16, 16);
        quCtx.fillStyle = '#593b22';
        quCtx.strokeRect(0.5, 0.5, 15, 15);
        quCtx.fillRect(1, 1, 2, 2);
        quCtx.fillRect(13, 1, 2, 2);
        quCtx.fillRect(1, 13, 2, 2);
        quCtx.fillRect(13, 13, 2, 2);
        sprites.question_used = qUsed;

        // 5. Hard Block
        const { canvas: hBlock, ctx: hCtx } = createOffscreen(16, 16);
        hCtx.fillStyle = '#9e9e9e';
        hCtx.fillRect(0, 0, 16, 16);
        hCtx.fillStyle = '#ffffff';
        hCtx.fillRect(1, 1, 14, 1);
        hCtx.fillRect(1, 1, 1, 14);
        hCtx.fillStyle = '#424242';
        hCtx.fillRect(1, 14, 15, 1);
        hCtx.fillRect(14, 1, 1, 14);
        hCtx.fillStyle = '#616161';
        hCtx.fillRect(3, 3, 10, 10);
        sprites.hard_block = hBlock;

        // 6. Pipes (TL, TR, BL, BR)
        // Top Left
        const { canvas: ptl, ctx: ptlCtx } = createOffscreen(16, 16);
        ptlCtx.fillStyle = T.PIPE_GREEN;
        ptlCtx.fillRect(0, 0, 16, 16);
        ptlCtx.fillStyle = T.PIPE_GREEN_LIGHT;
        ptlCtx.fillRect(2, 0, 4, 16);
        ptlCtx.fillStyle = T.PIPE_GREEN_DARK;
        ptlCtx.fillRect(0, 0, 2, 16);
        ptlCtx.fillRect(0, 14, 16, 2);
        sprites.pipe_tl = ptl;

        // Top Right
        const { canvas: ptr, ctx: ptrCtx } = createOffscreen(16, 16);
        ptrCtx.fillStyle = T.PIPE_GREEN;
        ptrCtx.fillRect(0, 0, 16, 16);
        ptrCtx.fillStyle = T.PIPE_GREEN_LIGHT;
        ptrCtx.fillRect(1, 0, 2, 16);
        ptrCtx.fillStyle = T.PIPE_GREEN_DARK;
        ptrCtx.fillRect(10, 0, 6, 16);
        ptrCtx.fillRect(0, 14, 16, 2);
        sprites.pipe_tr = ptr;

        // Body Left
        const { canvas: pbl, ctx: pblCtx } = createOffscreen(16, 16);
        pblCtx.fillStyle = T.PIPE_GREEN;
        pblCtx.fillRect(2, 0, 14, 16);
        pblCtx.fillStyle = T.PIPE_GREEN_LIGHT;
        pblCtx.fillRect(4, 0, 4, 16);
        pblCtx.fillStyle = T.PIPE_GREEN_DARK;
        pblCtx.fillRect(2, 0, 2, 16);
        sprites.pipe_bl = pbl;

        // Body Right
        const { canvas: pbr, ctx: pbrCtx } = createOffscreen(16, 16);
        pbrCtx.fillStyle = T.PIPE_GREEN;
        pbrCtx.fillRect(0, 0, 14, 16);
        pbrCtx.fillStyle = T.PIPE_GREEN_LIGHT;
        pbrCtx.fillRect(1, 0, 2, 16);
        pbrCtx.fillStyle = T.PIPE_GREEN_DARK;
        pbrCtx.fillRect(10, 0, 4, 16);
        sprites.pipe_br = pbr;

        // 7. Platform (One-way bridge / wood)
        const { canvas: plat, ctx: platCtx } = createOffscreen(16, 16);
        platCtx.fillStyle = '#cf8544';
        platCtx.fillRect(0, 0, 16, 6);
        platCtx.fillStyle = '#f7b06d';
        platCtx.fillRect(0, 0, 16, 2);
        platCtx.fillStyle = '#613207';
        platCtx.fillRect(0, 5, 16, 1);
        platCtx.fillRect(3, 2, 1, 3);
        platCtx.fillRect(11, 2, 1, 3);
        sprites.platform = plat;

        // 8. Castle Blocks
        const { canvas: cBlk, ctx: cCtx } = createOffscreen(16, 16);
        cCtx.fillStyle = '#7a7a85';
        cCtx.fillRect(0, 0, 16, 16);
        cCtx.fillStyle = '#9e9ea8';
        cCtx.fillRect(0, 0, 16, 1);
        cCtx.fillRect(0, 8, 16, 1);
        cCtx.fillStyle = '#41414a';
        cCtx.fillRect(0, 7, 16, 1);
        cCtx.fillRect(0, 15, 16, 1);
        cCtx.fillRect(7, 0, 1, 8);
        cCtx.fillRect(15, 8, 1, 8);
        sprites.castle_block = cBlk;

        // Castle Window
        const { canvas: cWin, ctx: cwCtx } = createOffscreen(16, 16);
        cwCtx.drawImage(cBlk, 0, 0);
        cwCtx.fillStyle = '#110524';
        cwCtx.fillRect(4, 3, 8, 10);
        cwCtx.fillStyle = '#ff4400';
        cwCtx.fillRect(7, 6, 2, 4); // Torch glow inside window
        sprites.castle_window = cWin;

        // Castle Top (Battlement)
        const { canvas: cTop, ctx: ctCtx } = createOffscreen(16, 16);
        ctCtx.fillStyle = '#7a7a85';
        ctCtx.fillRect(0, 6, 16, 10);
        ctCtx.fillRect(0, 0, 6, 6);
        ctCtx.fillRect(10, 0, 6, 6);
        ctCtx.fillStyle = '#9e9ea8';
        ctCtx.fillRect(0, 0, 6, 1);
        ctCtx.fillRect(10, 0, 6, 1);
        sprites.castle_top = cTop;

        // 9. Underground Brick (Dark Blue)
        const { canvas: uBrk, ctx: ubCtx } = createOffscreen(16, 16);
        ubCtx.fillStyle = '#183863';
        ubCtx.fillRect(0, 0, 16, 16);
        ubCtx.fillStyle = '#2b65ab';
        ubCtx.fillRect(0, 0, 15, 2);
        ubCtx.fillStyle = '#0a1729';
        ubCtx.fillRect(0, 14, 16, 2);
        ubCtx.fillRect(7, 2, 2, 12);
        sprites.underground_brick = uBrk;

        // 10. Lava (2 Frames)
        const lavaFrames = [];
        for (let f = 0; f < 2; f++) {
            const { canvas: lv, ctx: lvCtx } = createOffscreen(16, 16);
            lvCtx.fillStyle = '#c71500';
            lvCtx.fillRect(0, 0, 16, 16);
            lvCtx.fillStyle = '#ff7b00';
            lvCtx.fillRect(0, f === 0 ? 0 : 2, 16, 4);
            lvCtx.fillStyle = '#ffe600';
            lvCtx.fillRect(f === 0 ? 2 : 6, f === 0 ? 1 : 3, 5, 2);
            lvCtx.fillRect(f === 0 ? 10 : 1, f === 0 ? 2 : 1, 4, 2);
            lavaFrames.push(lv);
        }
        sprites.lava = lavaFrames;

        // 11. Bridge
        const { canvas: brg, ctx: brCtx } = createOffscreen(16, 16);
        brCtx.fillStyle = '#8f4f18';
        brCtx.fillRect(0, 0, 16, 6);
        brCtx.fillStyle = '#f0a354';
        brCtx.fillRect(0, 0, 16, 1);
        brCtx.fillStyle = '#421f03';
        brCtx.fillRect(0, 5, 16, 1);
        brCtx.fillRect(4, 0, 1, 6);
        brCtx.fillRect(12, 0, 1, 6);
        sprites.bridge = brg;

        // 12. Tech Puzzle Door
        const { canvas: door, ctx: dCtx } = createOffscreen(16, 16);
        dCtx.fillStyle = '#22223b';
        dCtx.fillRect(0, 0, 16, 16);
        dCtx.fillStyle = '#4a4e69';
        dCtx.strokeRect(1.5, 1.5, 13, 13);
        // Circuit lines
        dCtx.fillStyle = '#00ffcc';
        dCtx.fillRect(4, 4, 8, 2);
        dCtx.fillRect(8, 4, 2, 8);
        dCtx.fillRect(4, 10, 8, 2);
        dCtx.fillStyle = '#ffd700';
        dCtx.fillRect(7, 7, 4, 3);
        sprites.door = door;

        // 13. Spikes
        const { canvas: spk, ctx: spCtx } = createOffscreen(16, 16);
        const spikeRows = [
            "                ",
            "                ",
            "                ",
            "                ",
            "    X      X    ",
            "   XXX    XXX   ",
            "   XXX    XXX   ",
            "  XXXXX  XXXXX  ",
            "  XXXXX  XXXXX  ",
            " XXXXXXX XXXXXXX",
            " XXXXXXX XXXXXXX",
            "XXXXXXXXXXXXXXXX",
            "XXXXXXXXXXXXXXXX",
            "XXXXXXXXXXXXXXXX",
            "XXXXXXXXXXXXXXXX",
            "XXXXXXXXXXXXXXXX"
        ];
        drawPixelArt(spCtx, 0, 0, spikeRows, { 'X': '#cccccc' });
        spCtx.fillStyle = '#888888';
        spCtx.fillRect(0, 14, 16, 2);
        sprites.spike = spk;
    }

    // PRINCESS PEACH SPRITES (16x24)
    function generatePeachSprites() {
        const pal = {
            'C': GAME.COLORS.PEACH_CROWN,
            'H': GAME.COLORS.PEACH_HAIR,
            'S': GAME.COLORS.PEACH_SKIN,
            'D': GAME.COLORS.PEACH_DRESS,
            'K': GAME.COLORS.PEACH_DRESS_DARK,
            'W': '#ffffff',
            'B': '#1a1a2e',
            'E': '#3b92f7', // Blue eyes
            'R': '#ff2060'  // Ruby gem
        };

        // Base Peach layout pattern (16 cols x 24 rows)
        // Idle Frame 0
        const idle0 = [
            "     C R C      ",
            "    HHHHHHH     ",
            "   HHHHHHHHH    ",
            "   HHSSESSHH    ",
            "   HHSSESSHH    ",
            "   HHSSBSSHH    ",
            "    HSSSSH      ",
            "    HDDDDH      ",
            "   HDDDDDDH     ",
            "  HHDDDDDDHH    ",
            "  H WDDDDW H    ",
            "  S DDDDDD S    ",
            "   KDDDDDDK     ",
            "  KKDDDDDDKK    ",
            "  KKDDDDDDKK    ",
            "  DDDDDDDDDD    ",
            " DDDDDDDDDDDD   ",
            " DDDDDDDDDDDD   ",
            "DDDDDDDDDDDDDD  ",
            "DDDDDDDDDDDDDD  ",
            "KKKKKKKKKKKKKK  ",
            " KKKKKKKKKKKK   ",
            "   SSS  SSS     ",
            "  WWWW  WWWW    "
        ];

        // Idle Frame 1 (subtle breath/sway)
        const idle1 = [
            "     C R C      ",
            "    HHHHHHH     ",
            "   HHHHHHHHH    ",
            "   HHSSESSHH    ",
            "   HHSSESSHH    ",
            "   HHSSBSSHH    ",
            "    HSSSSH      ",
            "    HDDDDH      ",
            "   HDDDDDDH     ",
            "  HHDDDDDDHH    ",
            "  H WDDDDW H    ",
            "  S DDDDDD S    ",
            "   KDDDDDDK     ",
            "  KKDDDDDDKK    ",
            "  KKDDDDDDKK    ",
            "  DDDDDDDDDD    ",
            " DDDDDDDDDDDD   ",
            " DDDDDDDDDDDD   ",
            " DDDDDDDDDDDD   ",
            "DDDDDDDDDDDDDD  ",
            "KKKKKKKKKKKKKK  ",
            " KKKKKKKKKKKK   ",
            "   SSS  SSS     ",
            "  WWWW  WWWW    "
        ];

        const { canvas: pIdle0, ctx: pi0Ctx } = createOffscreen(16, 24);
        drawPixelArt(pi0Ctx, 0, 0, idle0, pal);
        const { canvas: pIdle1, ctx: pi1Ctx } = createOffscreen(16, 24);
        drawPixelArt(pi1Ctx, 0, 0, idle1, pal);
        sprites.peach_idle = [pIdle0, pIdle1];

        // Run Frames (4 frames)
        const runFrames = [];
        for (let i = 0; i < 4; i++) {
            const { canvas: rc, ctx: rCtx } = createOffscreen(16, 24);
            const rData = [...idle0];
            // Leg & dress motion shift
            if (i === 1) {
                rData[22] = " SSSS           ";
                rData[23] = "WWWW            ";
            } else if (i === 3) {
                rData[22] = "          SSSS  ";
                rData[23] = "          WWWW  ";
            }
            drawPixelArt(rCtx, 0, 0, rData, pal);
            runFrames.push(rc);
        }
        sprites.peach_run = runFrames;

        // Jump Frame
        const { canvas: jCan, ctx: jCtx } = createOffscreen(16, 24);
        const jumpData = [...idle0];
        jumpData[10] = " S WDDDDW S     ";
        jumpData[11] = " S DDDDDD S     ";
        jumpData[22] = "  SSS           ";
        jumpData[23] = " WWWW           ";
        drawPixelArt(jCtx, 0, 0, jumpData, pal);
        sprites.peach_jump = jCan;

        // Fall / Float Frame (umbrella dress billowing out wide)
        const { canvas: fCan, ctx: fCtx } = createOffscreen(16, 24);
        const floatData = [...idle0];
        floatData[18] = "DDDDDDDDDDDDDDDD";
        floatData[19] = "DDDDDDDDDDDDDDDD";
        floatData[20] = "KKKKKKKKKKKKKKKK";
        floatData[21] = " KKKKKKKKKKKKKK ";
        drawPixelArt(fCtx, 0, 0, floatData, pal);
        sprites.peach_fall = fCan;

        // Punch Frame (fist extended forward)
        const { canvas: pnCan, ctx: pnCtx } = createOffscreen(16, 24);
        const punchData = [...idle0];
        punchData[10] = "   WDDDDW       ";
        punchData[11] = "  SDDDDDD SSSSS ";
        punchData[12] = "   KDDDDDDK     ";
        drawPixelArt(pnCtx, 0, 0, punchData, pal);
        sprites.peach_punch = pnCan;

        // Heart Blast Frame (hands emitting magic)
        const { canvas: blCan, ctx: blCtx } = createOffscreen(16, 24);
        const blastData = [...idle0];
        blastData[9]  = "  HHDDDDDDHH R  ";
        blastData[10] = "  H WDDDDW SWRW ";
        blastData[11] = "  S DDDDDD  R   ";
        drawPixelArt(blCtx, 0, 0, blastData, pal);
        sprites.peach_blast = blCan;

        // Hurt Frame
        const { canvas: htCan, ctx: htCtx } = createOffscreen(16, 24);
        const hurtData = [...idle0];
        hurtData[3] = "   HHSSXXSHH    ";
        hurtData[4] = "   HHSSXXSHH    ";
        hurtData[5] = "   HHSS  SSHH   ";
        drawPixelArt(htCtx, 0, 0, hurtData, { ...pal, 'X': '#ff0033' });
        sprites.peach_hurt = htCan;

        // Interact Frame
        const { canvas: inCan, ctx: inCtx } = createOffscreen(16, 24);
        const interactData = [...idle0];
        interactData[9]  = "  HHDDDDDDHH    ";
        interactData[10] = "    WDDDDW SSSS ";
        interactData[11] = "   DDDDDD  SSSS ";
        drawPixelArt(inCtx, 0, 0, interactData, pal);
        sprites.peach_interact = inCan;
    }

    // MARIO CAPTURED (16x24)
    function generateMarioSprites() {
        const mPal = {
            'R': '#e52521', // Red cap/shirt
            'B': '#0026a3', // Blue overalls
            'Y': '#fcc082', // Skin
            'H': '#6b3300', // Hair/mustache
            'W': '#ffffff', // Gloves
            'G': '#f0d000', // Yellow buttons
            'C': '#69748c'  // Cage / ropes
        };

        const mIdle0 = [
            "    RRRRRRR     ",
            "   RRRRRRRRRR   ",
            "   HHHYYHY      ",
            "  HYHYYYHYYY    ",
            "  HYHYYYHYYY    ",
            "  HYYHYYYY      ",
            "   YYYYYYYY     ",
            "    HHHHHH      ",
            "   RRBRRRBRR    ",
            "  RRRBRRRBRRR   ",
            "  RRRBBBBBRRR   ",
            " CCCCCCCCCCCCCC ",
            " CW WGBBGW  WC  ",
            " C   BBBB    C  ",
            " C  BBBBBB   C  ",
            " C  BBBBBB   C  ",
            " CCCCCCCCCCCCCC ",
            " C  BB  BB   C  ",
            " C  BB  BB   C  ",
            " C  BB  BB   C  ",
            " C HHH  HHH  C  ",
            " C HHH  HHH  C  ",
            " CCCCCCCCCCCCCC ",
            "                "
        ];

        const mIdle1 = [...mIdle0];
        mIdle1[11] = "  CCCCCCCCCCCC  ";

        const { canvas: m0, ctx: m0Ctx } = createOffscreen(16, 24);
        drawPixelArt(m0Ctx, 0, 0, mIdle0, mPal);
        const { canvas: m1, ctx: m1Ctx } = createOffscreen(16, 24);
        drawPixelArt(m1Ctx, 0, 0, mIdle1, mPal);
        sprites.mario_captured = [m0, m1];
    }

    // ENEMIES (Goomba, Koopa, Piranha)
    function generateEnemySprites() {
        // 1. Goomba (16x14)
        const gPal = {
            'B': GAME.COLORS.GOOMBA_BROWN,
            'T': GAME.COLORS.GOOMBA_TAN,
            'W': '#ffffff',
            'K': '#000000'
        };

        const g0 = [
            "     BBBBBB     ",
            "   BBBBBBBBBB   ",
            "  BBBBBBBBBBBB  ",
            " BBBBBBBBBBBBBB ",
            "BBBWKBBBBBBKWBBB",
            "BBBWKBBBBBBKWBBB",
            "BBBWKBBBBBBKWBBB",
            " BBBTTTTTTTTBBB ",
            "   TTTTTTTTTT   ",
            "   TTTTTTTTTT   ",
            "  KKKKKK  KKKK  ",
            " KKKKKKK  KKKKK ",
            " KKKKKK    KKKK ",
            "                "
        ];

        const g1 = [
            "     BBBBBB     ",
            "   BBBBBBBBBB   ",
            "  BBBBBBBBBBBB  ",
            " BBBBBBBBBBBBBB ",
            "BBBWKBBBBBBKWBBB",
            "BBBWKBBBBBBKWBBB",
            "BBBWKBBBBBBKWBBB",
            " BBBTTTTTTTTBBB ",
            "   TTTTTTTTTT   ",
            "   TTTTTTTTTT   ",
            "   KKKK  KKKKKK ",
            "  KKKKK  KKKKKKK",
            "  KKKK    KKKKK ",
            "                "
        ];

        // Goomba Flat (Stomped)
        const gFlat = [
            "                ",
            "                ",
            "                ",
            "                ",
            "                ",
            "                ",
            "                ",
            "     BBBBBB     ",
            "  BBBBBBBBBBBB  ",
            " BBBBBBBBBBBBBB ",
            "BBBWKBBBBBBKWBBB",
            " BBBTTTTTTTTBBB ",
            "  KKKKKKKKKKKK  ",
            "  KKKKKKKKKKKK  "
        ];

        const { canvas: gCan0, ctx: gCtx0 } = createOffscreen(16, 14);
        drawPixelArt(gCtx0, 0, 0, g0, gPal);
        const { canvas: gCan1, ctx: gCtx1 } = createOffscreen(16, 14);
        drawPixelArt(gCtx1, 0, 0, g1, gPal);
        sprites.goomba_walk = [gCan0, gCan1];

        const { canvas: gfCan, ctx: gfCtx } = createOffscreen(16, 14);
        drawPixelArt(gfCtx, 0, 0, gFlat, gPal);
        sprites.goomba_flat = [gfCan];

        // 2. Koopa Troopa (16x22)
        const kPal = {
            'G': GAME.COLORS.KOOPA_GREEN,
            'S': GAME.COLORS.KOOPA_SHELL,
            'Y': '#ffe090',
            'W': '#ffffff',
            'K': '#000000',
            'O': '#fc9838'
        };

        const kWalk0 = [
            "      GGGG      ",
            "    GGGGGGGG    ",
            "   GGGWKGGWKGG  ",
            "   GGGWKGGWKGG  ",
            "   GGGGGGGGGG   ",
            "    YYYYYYYY    ",
            "      YYYY      ",
            "    SSSSSSSS    ",
            "   SSSSSSSSSS   ",
            "  SSWWSSSSWWSS  ",
            "  SSWWSSSSWWSS  ",
            "  SSSSSSSSSSSS  ",
            "  SSSSSSSSSSSS  ",
            "  SSWWSSSSWWSS  ",
            "   SSSSSSSSSS   ",
            "    SSSSSSSS    ",
            "    YYYYYYYY    ",
            "     YY  YY     ",
            "    OOO  OOO    ",
            "   OOOO  OOOO   ",
            "   OOOO  OOOO   ",
            "                "
        ];

        const kWalk1 = [...kWalk0];
        kWalk1[18] = "   OOO    OOO   ";
        kWalk1[19] = "  OOOO    OOOO  ";

        const { canvas: k0Can, ctx: k0Ctx } = createOffscreen(16, 22);
        drawPixelArt(k0Ctx, 0, 0, kWalk0, kPal);
        const { canvas: k1Can, ctx: k1Ctx } = createOffscreen(16, 22);
        drawPixelArt(k1Ctx, 0, 0, kWalk1, kPal);
        sprites.koopa_walk = [k0Can, k1Can];

        // Koopa Shell (16x14)
        const shell0 = [
            "     SSSSSS     ",
            "   SSSSSSSSSS   ",
            "  SSSSSSSSSSSS  ",
            " SSSWWSSSSWWSSS ",
            " SSSWWSSSSWWSSS ",
            " SSSSSSSSSSSSSS ",
            " SSSSSSSSSSSSSS ",
            " SSSWWSSSSWWSSS ",
            " SSSWWSSSSWWSSS ",
            "  SSSSSSSSSSSS  ",
            "   SSSSSSSSSS   ",
            "    WWWWWWWW    ",
            "    WWWWWWWW    ",
            "                "
        ];
        const shell1 = [...shell0];
        shell1[3] = " SSSSSSWWSSSSSS ";
        shell1[4] = " SSSSSSWWSSSSSS ";

        const { canvas: sh0, ctx: sh0Ctx } = createOffscreen(16, 14);
        drawPixelArt(sh0Ctx, 0, 0, shell0, kPal);
        const { canvas: sh1, ctx: sh1Ctx } = createOffscreen(16, 14);
        drawPixelArt(sh1Ctx, 0, 0, shell1, kPal);
        sprites.koopa_shell = [sh0, sh1];

        // 3. Piranha Plant (16x22)
        const pPal = {
            'R': '#e52521',
            'W': '#ffffff',
            'G': '#00a800',
            'Y': '#005800'
        };

        const pir0 = [
            "     RRRRRR     ",
            "   RRRRWRRRRR   ",
            "  RRRRWWWRRRRR  ",
            " RRRRRRWRRRRRRR ",
            " RRRWWRRRRRWWRR ",
            " RWWWWWWWWWWWRR ",
            "  WWWWWWWWWWW   ",
            "   WWWWWWWWW    ",
            "   WWWWWWWWW    ",
            "  RWWWWWWWWWW   ",
            " RRRWWWRRRRRWRR ",
            "  RRRRRRRRRRRR  ",
            "   RRRRRRRRRR   ",
            "     GGGGGG     ",
            "     GGYYGG     ",
            "     GGYYGG     ",
            "    GGGGGGGG    ",
            "    GG GG GG    ",
            "     G GG G     ",
            "       GG       ",
            "       GG       ",
            "       GG       "
        ];

        const pir1 = [...pir0];
        pir1[7] = "    WW   WW     ";
        pir1[8] = "    WW   WW     ";

        const { canvas: pi0, ctx: pCtx0 } = createOffscreen(16, 22);
        drawPixelArt(pCtx0, 0, 0, pir0, pPal);
        const { canvas: pi1, ctx: pCtx1 } = createOffscreen(16, 22);
        drawPixelArt(pCtx1, 0, 0, pir1, pPal);
        sprites.piranha = [pi0, pi1];
    }

    // ITEMS & UI
    function generateItemAndUISprites() {
        // 1. Spinning Coin (4 Frames, 16x16)
        const coinFrames = [];
        const cPal = {
            'G': GAME.COLORS.COIN_GOLD,
            'S': GAME.COLORS.COIN_SHINE,
            'D': '#b87800',
            'K': '#000000'
        };

        const cF0 = [
            "     GGGGGG     ",
            "   GGSSSSSSGG   ",
            "  GGSSGGGGDDGG  ",
            " GGSSGG  GGDDGG ",
            " GGSSGG  GGDDGG ",
            "GGSSGG    GGDDGG",
            "GGSSGG    GGDDGG",
            "GGSSGG    GGDDGG",
            "GGSSGG    GGDDGG",
            "GGSSGG    GGDDGG",
            " GGSSGG  GGDDGG ",
            " GGSSGG  GGDDGG ",
            "  GGSSGGGGDDGG  ",
            "   GGDDDDDDGG   ",
            "     GGGGGG     ",
            "                "
        ];

        const cF1 = [
            "      GGGG      ",
            "    GGSSSSGG    ",
            "   GGSSGGDDGG   ",
            "  GGSSG  GDDGG  ",
            "  GGSSG  GDDGG  ",
            "  GGSSG  GDDGG  ",
            "  GGSSG  GDDGG  ",
            "  GGSSG  GDDGG  ",
            "  GGSSG  GDDGG  ",
            "  GGSSG  GDDGG  ",
            "  GGSSG  GDDGG  ",
            "  GGSSG  GDDGG  ",
            "   GGSSGGDDGG   ",
            "    GGDDDDGG    ",
            "      GGGG      ",
            "                "
        ];

        const cF2 = [
            "       GG       ",
            "      GSSG      ",
            "      GSSG      ",
            "      GSSG      ",
            "      GSSG      ",
            "      GSSG      ",
            "      GSSG      ",
            "      GSSG      ",
            "      GSSG      ",
            "      GSSG      ",
            "      GSSG      ",
            "      GSSG      ",
            "      GSSG      ",
            "      GDDG      ",
            "       GG       ",
            "                "
        ];

        [cF0, cF1, cF2, cF1].forEach(art => {
            const { canvas, ctx } = createOffscreen(16, 16);
            drawPixelArt(ctx, 0, 0, art, cPal);
            coinFrames.push(canvas);
        });
        sprites.coin = coinFrames;

        // 2. Extra Life Heart Item (16x16, 2 frames)
        const hPal = {
            'R': GAME.COLORS.HEART_RED,
            'P': GAME.COLORS.HEART_PINK,
            'W': '#ffffff',
            'D': '#9e002d'
        };

        const h0 = [
            "                ",
            "   RRRR  RRRR   ",
            "  RWWPPRRPPPPR  ",
            " RWWPPPRRPPPPPR ",
            " RWPPPPPPPPPPPR ",
            " RPPPPPPPPPPPPR ",
            "  RPPPPPPPPPPR  ",
            "  RPPPPPPPPPPR  ",
            "   RPPPPPPPPR   ",
            "    RPPPPPPPR   ",
            "     RPPPPPR    ",
            "      RPPPR     ",
            "       RPR      ",
            "        R       ",
            "                ",
            "                "
        ];

        const h1 = [
            "   RRRR  RRRR   ",
            "  RWWPPRRPPPPR  ",
            " RWWPPPRRPPPPPR ",
            " RWPPPPPPPPPPPR ",
            " RPPPPPPPPPPPPR ",
            " RPPPPPPPPPPPPR ",
            "  RPPPPPPPPPPR  ",
            "  RPPPPPPPPPPR  ",
            "   RPPPPPPPPR   ",
            "    RPPPPPPPR   ",
            "     RPPPPPR    ",
            "      RPPPR     ",
            "       RPR      ",
            "        R       ",
            "                ",
            "                "
        ];

        const hFrames = [];
        [h0, h1].forEach(art => {
            const { canvas, ctx } = createOffscreen(16, 16);
            drawPixelArt(ctx, 0, 0, art, hPal);
            hFrames.push(canvas);
        });
        sprites.heart_item = hFrames;

        // 3. Heart Blast Projectile (12x12, 2 frames)
        const bPal = {
            'R': GAME.COLORS.HEART_RED,
            'W': '#ffffff',
            'P': '#ff80df'
        };
        const hb0 = [
            "  RR  RR    ",
            " RWWPPRPPR  ",
            " RWPPPPPPR  ",
            "  RPPPPPPR  ",
            "   RPPPPR   ",
            "    RPPR    ",
            "     RR     ",
            "  W      W  ",
            "    W  W    ",
            "      W     ",
            "            ",
            "            "
        ];
        const hb1 = [
            "  RR  RR    ",
            " RWWPPRPPR  ",
            " RWPPPPPPR  ",
            "  RPPPPPPR  ",
            "   RPPPPR   ",
            "    RPPR    ",
            "     RR     ",
            "            ",
            "   W    W   ",
            "     WW     ",
            "   W    W   ",
            "            "
        ];
        const hbFrames = [];
        [hb0, hb1].forEach(art => {
            const { canvas, ctx } = createOffscreen(12, 12);
            drawPixelArt(ctx, 0, 0, art, bPal);
            hbFrames.push(canvas);
        });
        sprites.heart_blast = hbFrames;

        // 4. UI Icons
        // Life icon (Peach face, 12x12)
        const { canvas: lIco, ctx: lCtx } = createOffscreen(12, 12);
        lCtx.fillStyle = GAME.COLORS.PEACH_HAIR;
        lCtx.fillRect(1, 1, 10, 10);
        lCtx.fillStyle = GAME.COLORS.PEACH_SKIN;
        lCtx.fillRect(3, 3, 6, 6);
        lCtx.fillStyle = GAME.COLORS.PEACH_CROWN;
        lCtx.fillRect(4, 0, 4, 2);
        lCtx.fillStyle = '#ff2060';
        lCtx.fillRect(5, 0, 2, 1);
        lCtx.fillStyle = '#0066ff';
        lCtx.fillRect(4, 4, 1, 2);
        lCtx.fillRect(7, 4, 1, 2);
        sprites.life_icon = lIco;

        // Coin Icon (10x10)
        const { canvas: cIco, ctx: ciCtx } = createOffscreen(10, 10);
        ciCtx.fillStyle = GAME.COLORS.COIN_GOLD;
        ciCtx.fillRect(1, 0, 8, 10);
        ciCtx.fillRect(0, 1, 10, 8);
        ciCtx.fillStyle = GAME.COLORS.COIN_SHINE;
        ciCtx.fillRect(2, 2, 2, 6);
        sprites.coin_icon = cIco;

        // Clock Icon (10x10)
        const { canvas: clkIco, ctx: clkCtx } = createOffscreen(10, 10);
        clkCtx.fillStyle = '#ffffff';
        clkCtx.beginPath();
        clkCtx.arc(5, 5, 4.5, 0, Math.PI * 2);
        clkCtx.fill();
        clkCtx.strokeStyle = '#000000';
        clkCtx.lineWidth = 1;
        clkCtx.stroke();
        clkCtx.beginPath();
        clkCtx.moveTo(5, 2);
        clkCtx.lineTo(5, 5);
        clkCtx.lineTo(7, 5);
        clkCtx.stroke();
        sprites.clock_icon = clkIco;
    }

    return {
        get loaded() { return loaded; },
        get sprites() { return sprites; },

        init() {
            generateTileSprites();
            generatePeachSprites();
            generateMarioSprites();
            generateEnemySprites();
            generateItemAndUISprites();
            loaded = true;
            return true;
        },

        get(name) {
            return sprites[name] || null;
        },

        getFrame(name, frameIndex = 0) {
            const sprite = sprites[name];
            if (!sprite) return null;
            if (Array.isArray(sprite)) {
                return sprite[Math.abs(frameIndex) % sprite.length];
            }
            return sprite;
        }
    };
})();

if (typeof window !== 'undefined') {
    window.Assets = Assets;
}
