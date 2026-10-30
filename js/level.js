// ============================================================================
// PRINCESS SAVES MARIO — Level System (Level Data + Tile Renderer)
// ============================================================================

var Level = (() => {
    let currentLevel = null;
    let levelIndex = 0;
    let bgColor = GAME.COLORS.SKY;
    let cloudPositions = [];
    let hillPositions = [];
    let bushPositions = [];
    let parallaxOffset = 0;

    // ===================== LEVEL DATA =====================

    // Level data encoded as strings for compactness:
    // Each character maps to a tile ID (see decoder below)
    // Spawn entities are in a separate layer

    const LEVELS = [
        // ====== WORLD 1: MUSHROOM KINGDOM ======
        {
            name: "MUSHROOM KINGDOM",
            subtitle: "Rescue Mission Begins!",
            bgColor: GAME.COLORS.SKY,
            width: 120,
            height: 15,
            tileData: null,  // Will be generated
            spawns: null,
            puzzleAt: 110,   // Column where puzzle door appears
            puzzleType: 'cpu',
        },
        // ====== WORLD 2: UNDERGROUND ======
        {
            name: "UNDERGROUND DEPTHS",
            subtitle: "Deeper into Danger...",
            bgColor: '#000000',
            width: 100,
            height: 15,
            tileData: null,
            spawns: null,
            puzzleAt: 90,
            puzzleType: 'scheduler',
        },
        // ====== WORLD 3: BOWSER'S CASTLE ======
        {
            name: "BOWSER'S CASTLE",
            subtitle: "Mario is Here!",
            bgColor: '#1a0a2e',
            width: 110,
            height: 15,
            tileData: null,
            spawns: null,
            puzzleAt: 94,    // Database Decryption gate guarding Mario
            puzzleType: 'database',
            marioAt: 102,    // Column where Mario is
        },
    ];

    // === PROCEDURAL LEVEL GENERATION ===

    function generateLevel(levelDef, index) {
        const w = levelDef.width;
        const h = levelDef.height;
        const tiles = [];
        const spawns = [];

        // Initialize empty
        for (let r = 0; r < h; r++) {
            tiles.push(new Array(w).fill(TILE.EMPTY));
        }

        if (index === 0) generateWorld1(tiles, spawns, w, h, levelDef);
        else if (index === 1) generateWorld2(tiles, spawns, w, h, levelDef);
        else if (index === 2) generateWorld3(tiles, spawns, w, h, levelDef);

        levelDef.tileData = tiles;
        levelDef.spawns = spawns;
    }

    function generateWorld1(tiles, spawns, w, h, def) {
        const groundRow = h - 2;  // Ground surface row
        const floorRow = h - 1;   // Bottom row

        // Fill ground
        for (let c = 0; c < w; c++) {
            tiles[groundRow][c] = TILE.GROUND;
            tiles[floorRow][c] = TILE.GROUND;
        }

        // Player spawn
        spawns.push({ type: SPAWN.PLAYER, col: 3, row: groundRow - 2 });

        // --- Gaps ---
        const gaps = [
            { start: 18, width: 3 },
            { start: 40, width: 2 },
            { start: 55, width: 4 },
            { start: 78, width: 3 },
            { start: 95, width: 3 },
        ];
        for (const gap of gaps) {
            for (let c = gap.start; c < gap.start + gap.width; c++) {
                tiles[groundRow][c] = TILE.EMPTY;
                tiles[floorRow][c] = TILE.EMPTY;
            }
        }

        // --- Pipes ---
        const pipes = [15, 32, 58, 85];
        for (const pc of pipes) {
            const ph = 2 + Math.floor(Math.random() * 2);
            for (let r = 0; r < ph; r++) {
                const row = groundRow - r - 1;
                if (r === ph - 1) {
                    tiles[row][pc] = TILE.PIPE_TL;
                    tiles[row][pc + 1] = TILE.PIPE_TR;
                } else {
                    tiles[row][pc] = TILE.PIPE_BL;
                    tiles[row][pc + 1] = TILE.PIPE_BR;
                }
            }
            // Piranha plant on some pipes
            if (Math.random() > 0.4) {
                spawns.push({ type: SPAWN.PIRANHA, col: pc, row: groundRow - ph - 1 });
            }
        }

        // --- Question blocks & Bricks ---
        const blockSets = [
            { col: 8, row: groundRow - 4, pattern: [TILE.BRICK, TILE.QUESTION, TILE.BRICK] },
            { col: 22, row: groundRow - 4, pattern: [TILE.QUESTION] },
            { col: 25, row: groundRow - 4, pattern: [TILE.BRICK, TILE.BRICK, TILE.QUESTION, TILE.BRICK, TILE.BRICK] },
            { col: 25, row: groundRow - 8, pattern: [TILE.QUESTION] },
            { col: 35, row: groundRow - 4, pattern: [TILE.QUESTION, TILE.BRICK, TILE.QUESTION] },
            { col: 45, row: groundRow - 5, pattern: [TILE.BRICK, TILE.QUESTION, TILE.BRICK, TILE.QUESTION, TILE.BRICK] },
            { col: 62, row: groundRow - 4, pattern: [TILE.QUESTION, TILE.QUESTION] },
            { col: 70, row: groundRow - 4, pattern: [TILE.BRICK, TILE.BRICK, TILE.BRICK] },
            { col: 70, row: groundRow - 8, pattern: [TILE.BRICK, TILE.QUESTION, TILE.BRICK] },
            { col: 88, row: groundRow - 4, pattern: [TILE.QUESTION, TILE.BRICK, TILE.QUESTION] },
            { col: 100, row: groundRow - 5, pattern: [TILE.BRICK, TILE.BRICK, TILE.BRICK, TILE.BRICK] },
        ];
        for (const bs of blockSets) {
            for (let i = 0; i < bs.pattern.length; i++) {
                tiles[bs.row][bs.col + i] = bs.pattern[i];
            }
        }

        // --- Platforms (floating) ---
        const platforms = [
            { col: 19, row: groundRow - 3, width: 3 },
            { col: 41, row: groundRow - 3, width: 2 },
            { col: 53, row: groundRow - 6, width: 3 },
            { col: 56, row: groundRow - 3, width: 2 },
            { col: 79, row: groundRow - 3, width: 3 },
            { col: 96, row: groundRow - 3, width: 3 },
        ];
        for (const pl of platforms) {
            for (let c = 0; c < pl.width; c++) {
                tiles[pl.row][pl.col + c] = TILE.PLATFORM;
            }
        }

        // --- Stairs (end of level) ---
        for (let step = 0; step < 6; step++) {
            for (let r = 0; r <= step; r++) {
                tiles[groundRow - 1 - r][105 + step] = TILE.HARD_BLOCK;
            }
        }

        // --- Enemies ---
        const goombaPositions = [10, 14, 24, 30, 38, 47, 50, 63, 68, 75, 82, 90, 98, 103];
        for (const gc of goombaPositions) {
            spawns.push({ type: SPAWN.GOOMBA, col: gc, row: groundRow - 1 });
        }
        const koopaPositions = [28, 52, 72, 92];
        for (const kc of koopaPositions) {
            spawns.push({ type: SPAWN.KOOPA, col: kc, row: groundRow - 2 });
        }

        // --- Coins ---
        const coinRows = [
            { row: groundRow - 3, cols: [9, 10, 11, 26, 27, 36, 46, 47, 48, 71, 72, 89, 101, 102, 103] },
            { row: groundRow - 6, cols: [25, 26, 27, 53, 54, 55, 70, 71, 72] },
            { row: groundRow - 1, cols: [5, 6, 7, 33, 34, 66, 67, 84] },
        ];
        for (const cr of coinRows) {
            for (const c of cr.cols) {
                spawns.push({ type: SPAWN.COIN, col: c, row: cr.row });
            }
        }

        // Heart pickups
        spawns.push({ type: SPAWN.HEART, col: 53, row: groundRow - 8 });

        // Puzzle door at end
        if (def.puzzleAt > 0) {
            tiles[groundRow - 1][def.puzzleAt] = TILE.DOOR;
            tiles[groundRow - 2][def.puzzleAt] = TILE.DOOR;
            tiles[groundRow - 3][def.puzzleAt] = TILE.DOOR;
            spawns.push({ type: SPAWN.PUZZLE_DOOR, col: def.puzzleAt, row: groundRow - 3 });
        }

        // Flag/checkpoint
        spawns.push({ type: SPAWN.CHECKPOINT, col: 60, row: groundRow - 1 });
    }

    function generateWorld2(tiles, spawns, w, h, def) {
        const groundRow = h - 2;
        const floorRow = h - 1;

        // Underground: fill top and bottom with bricks
        for (let c = 0; c < w; c++) {
            tiles[0][c] = TILE.UNDERGROUND_BRICK;
            tiles[1][c] = TILE.UNDERGROUND_BRICK;
            tiles[groundRow][c] = TILE.UNDERGROUND_BRICK;
            tiles[floorRow][c] = TILE.UNDERGROUND_BRICK;
        }

        spawns.push({ type: SPAWN.PLAYER, col: 3, row: groundRow - 2 });

        // Create varied terrain with some ceiling blocks
        // Elevated sections
        const elevations = [
            { start: 12, end: 20, height: 4 },
            { start: 30, end: 38, height: 3 },
            { start: 50, end: 58, height: 5 },
            { start: 68, end: 75, height: 4 },
        ];
        for (const el of elevations) {
            for (let c = el.start; c < el.end; c++) {
                for (let r = groundRow - el.height; r < groundRow; r++) {
                    tiles[r][c] = TILE.UNDERGROUND_BRICK;
                }
            }
            // Steps up
            for (let s = 0; s < Math.min(el.height, 3); s++) {
                tiles[groundRow - 1 - s][el.start - 1 - s] = TILE.UNDERGROUND_BRICK;
            }
        }

        // Gaps
        const gaps = [{ start: 22, width: 3 }, { start: 42, width: 2 }, { start: 60, width: 4 }, { start: 80, width: 3 }];
        for (const gap of gaps) {
            for (let c = gap.start; c < gap.start + gap.width; c++) {
                tiles[groundRow][c] = TILE.EMPTY;
                tiles[floorRow][c] = TILE.EMPTY;
            }
        }

        // Floating platforms in gaps
        for (const gap of gaps) {
            tiles[groundRow - 2][gap.start + 1] = TILE.PLATFORM;
            if (gap.width > 2) tiles[groundRow - 2][gap.start + 2] = TILE.PLATFORM;
        }

        // Question and brick blocks
        const blockSets = [
            { col: 7, row: groundRow - 4, pattern: [TILE.QUESTION, TILE.UNDERGROUND_BRICK, TILE.QUESTION] },
            { col: 25, row: groundRow - 4, pattern: [TILE.UNDERGROUND_BRICK, TILE.QUESTION, TILE.UNDERGROUND_BRICK] },
            { col: 35, row: 4, pattern: [TILE.QUESTION] },  // Near ceiling
            { col: 45, row: groundRow - 4, pattern: [TILE.QUESTION, TILE.UNDERGROUND_BRICK, TILE.QUESTION, TILE.UNDERGROUND_BRICK] },
            { col: 63, row: groundRow - 4, pattern: [TILE.UNDERGROUND_BRICK, TILE.UNDERGROUND_BRICK, TILE.QUESTION] },
            { col: 78, row: groundRow - 4, pattern: [TILE.QUESTION, TILE.QUESTION, TILE.QUESTION] },
        ];
        for (const bs of blockSets) {
            for (let i = 0; i < bs.pattern.length; i++) {
                if (tiles[bs.row][bs.col + i] === TILE.EMPTY) {
                    tiles[bs.row][bs.col + i] = bs.pattern[i];
                }
            }
        }

        // Pipes
        const pipes = [10, 40, 65, 83];
        for (const pc of pipes) {
            for (let r = 0; r < 2; r++) {
                const row = groundRow - r - 1;
                tiles[row][pc] = r === 1 ? TILE.PIPE_TL : TILE.PIPE_BL;
                tiles[row][pc + 1] = r === 1 ? TILE.PIPE_TR : TILE.PIPE_BR;
            }
            if (Math.random() > 0.3) {
                spawns.push({ type: SPAWN.PIRANHA, col: pc, row: groundRow - 3 });
            }
        }

        // Enemies
        const goombaPos = [6, 9, 21, 27, 33, 39, 48, 55, 62, 70, 77, 84];
        for (const gc of goombaPos) {
            spawns.push({ type: SPAWN.GOOMBA, col: gc, row: groundRow - 1 });
        }
        const koopaPos = [15, 35, 52, 73];
        for (const kc of koopaPos) {
            spawns.push({ type: SPAWN.KOOPA, col: kc, row: groundRow - 2 });
        }

        // Coins
        const coinCols = [5, 6, 7, 8, 23, 24, 25, 34, 35, 43, 44, 45, 56, 57, 64, 65, 76, 77, 78, 85, 86];
        for (const c of coinCols) {
            spawns.push({ type: SPAWN.COIN, col: c, row: groundRow - 3 });
        }

        spawns.push({ type: SPAWN.HEART, col: 35, row: 3 });

        // Checkpoint
        spawns.push({ type: SPAWN.CHECKPOINT, col: 45, row: groundRow - 1 });

        // Puzzle door
        if (def.puzzleAt > 0) {
            tiles[groundRow - 1][def.puzzleAt] = TILE.DOOR;
            tiles[groundRow - 2][def.puzzleAt] = TILE.DOOR;
            tiles[groundRow - 3][def.puzzleAt] = TILE.DOOR;
            spawns.push({ type: SPAWN.PUZZLE_DOOR, col: def.puzzleAt, row: groundRow - 3 });
        }
    }

    function generateWorld3(tiles, spawns, w, h, def) {
        const groundRow = h - 2;
        const floorRow = h - 1;

        // Castle floor
        for (let c = 0; c < w; c++) {
            tiles[groundRow][c] = TILE.CASTLE_BLOCK;
            tiles[floorRow][c] = TILE.CASTLE_BLOCK;
        }

        // Castle ceiling with battlements
        for (let c = 0; c < w; c++) {
            tiles[0][c] = TILE.CASTLE_BLOCK;
            tiles[1][c] = TILE.CASTLE_BLOCK;
            if (c % 3 === 0) {
                tiles[2][c] = TILE.CASTLE_TOP;
            }
        }

        // Lava pits
        const lavaPits = [
            { start: 15, width: 4 },
            { start: 28, width: 3 },
            { start: 45, width: 5 },
            { start: 62, width: 3 },
            { start: 78, width: 4 },
        ];
        for (const lp of lavaPits) {
            for (let c = lp.start; c < lp.start + lp.width; c++) {
                tiles[groundRow][c] = TILE.LAVA;
                tiles[floorRow][c] = TILE.LAVA;
            }
        }

        // Spikes
        const spikeCols = [20, 21, 35, 36, 52, 53, 70, 71, 85];
        for (const sc of spikeCols) {
            tiles[groundRow - 1][sc] = TILE.SPIKE;
        }

        // Castle walls and platforms
        const walls = [
            { col: 12, height: 5 },
            { col: 25, height: 4 },
            { col: 40, height: 6 },
            { col: 55, height: 4 },
            { col: 72, height: 5 },
            { col: 88, height: 3 },
        ];
        for (const wall of walls) {
            for (let r = 0; r < wall.height; r++) {
                tiles[groundRow - 1 - r][wall.col] = TILE.CASTLE_BLOCK;
            }
        }

        // Bridges over lava
        for (const lp of lavaPits) {
            tiles[groundRow - 3][lp.start] = TILE.BRIDGE;
            tiles[groundRow - 3][lp.start + lp.width - 1] = TILE.BRIDGE;
            for (let c = lp.start; c < lp.start + lp.width; c++) {
                tiles[groundRow - 3][c] = TILE.BRIDGE;
            }
        }

        // Platforms
        const platforms = [
            { col: 16, row: groundRow - 5, width: 3 },
            { col: 30, row: groundRow - 5, width: 3 },
            { col: 48, row: groundRow - 5, width: 2 },
            { col: 58, row: groundRow - 6, width: 3 },
            { col: 75, row: groundRow - 5, width: 3 },
            { col: 82, row: groundRow - 4, width: 2 },
        ];
        for (const pl of platforms) {
            for (let c = 0; c < pl.width; c++) {
                tiles[pl.row][pl.col + c] = TILE.PLATFORM;
            }
        }

        // Castle windows
        for (let c = 5; c < w - 5; c += 8) {
            tiles[3][c] = TILE.CASTLE_WINDOW;
        }

        // Question blocks
        const qBlocks = [
            { col: 8, row: groundRow - 4 },
            { col: 33, row: groundRow - 4 },
            { col: 50, row: groundRow - 4 },
            { col: 68, row: groundRow - 4 },
            { col: 93, row: groundRow - 4 },
        ];
        for (const qb of qBlocks) {
            tiles[qb.row][qb.col] = TILE.QUESTION;
        }

        // Player spawn
        spawns.push({ type: SPAWN.PLAYER, col: 3, row: groundRow - 2 });

        // Enemies — more and tougher
        const goombaPos = [7, 11, 18, 24, 30, 37, 43, 48, 54, 60, 66, 73, 80, 86, 92, 96];
        for (const gc of goombaPos) {
            spawns.push({ type: SPAWN.GOOMBA, col: gc, row: groundRow - 1 });
        }
        const koopaPos = [14, 22, 34, 50, 64, 76, 90];
        for (const kc of koopaPos) {
            spawns.push({ type: SPAWN.KOOPA, col: kc, row: groundRow - 2 });
        }

        // Coins
        for (let c = 4; c < w - 10; c += 3) {
            if (tiles[groundRow - 3][c] === TILE.EMPTY && tiles[groundRow - 1][c] !== TILE.SPIKE) {
                spawns.push({ type: SPAWN.COIN, col: c, row: groundRow - 3 });
            }
        }

        // Hearts
        spawns.push({ type: SPAWN.HEART, col: 58, row: groundRow - 8 });
        spawns.push({ type: SPAWN.HEART, col: 82, row: groundRow - 6 });

        // Checkpoint
        spawns.push({ type: SPAWN.CHECKPOINT, col: 50, row: groundRow - 1 });

        // Database Decryption Puzzle Door guarding Mario
        if (def.puzzleAt > 0) {
            tiles[groundRow - 1][def.puzzleAt] = TILE.DOOR;
            tiles[groundRow - 2][def.puzzleAt] = TILE.DOOR;
            tiles[groundRow - 3][def.puzzleAt] = TILE.DOOR;
            spawns.push({ type: SPAWN.PUZZLE_DOOR, col: def.puzzleAt, row: groundRow - 3 });
        }

        // Mario at end
        if (def.marioAt) {
            spawns.push({ type: SPAWN.MARIO, col: def.marioAt, row: groundRow - 2 });
            // Cage around Mario
            for (let r = groundRow - 4; r <= groundRow - 1; r++) {
                tiles[r][def.marioAt - 1] = TILE.CASTLE_BLOCK;
                tiles[r][def.marioAt + 2] = TILE.CASTLE_BLOCK;
            }
            tiles[groundRow - 4][def.marioAt] = TILE.CASTLE_BLOCK;
            tiles[groundRow - 4][def.marioAt + 1] = TILE.CASTLE_BLOCK;
        }
    }

    // ===================== BACKGROUND GENERATION =====================

    function generateBackground(levelDef) {
        cloudPositions = [];
        hillPositions = [];
        bushPositions = [];

        if (levelDef.bgColor === '#000000') return;  // Underground — no bg decorations

        // Clouds
        for (let i = 0; i < 8; i++) {
            cloudPositions.push({
                x: i * 240 + Math.random() * 100,
                y: 20 + Math.random() * 60,
                size: 1 + Math.floor(Math.random() * 3),
            });
        }

        // Hills
        for (let i = 0; i < 5; i++) {
            hillPositions.push({
                x: i * 400 + Math.random() * 150,
                size: 2 + Math.floor(Math.random() * 2),
            });
        }

        // Bushes
        for (let i = 0; i < 6; i++) {
            bushPositions.push({
                x: i * 350 + 100 + Math.random() * 100,
                size: 1 + Math.floor(Math.random() * 3),
            });
        }
    }

    // ===================== RENDERING =====================

    function renderBackground(ctx) {
        // Sky
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, GAME.CANVAS_WIDTH, GAME.CANVAS_HEIGHT);

        const scrollX = Camera.rawX * 0.3;  // Parallax factor

        // Hills (behind everything)
        for (const hill of hillPositions) {
            const hx = hill.x - scrollX;
            const hy = GAME.CANVAS_HEIGHT - 100;
            const size = hill.size * 60;

            // Wrap around
            let drawX = ((hx % (GAME.CANVAS_WIDTH + 400)) + GAME.CANVAS_WIDTH + 400) % (GAME.CANVAS_WIDTH + 400) - 200;

            ctx.fillStyle = GAME.COLORS.HILL_GREEN;
            ctx.beginPath();
            ctx.arc(drawX + size / 2, hy + 20, size / 2, Math.PI, 0);
            ctx.lineTo(drawX + size, hy + 20);
            ctx.lineTo(drawX, hy + 20);
            ctx.fill();

            ctx.fillStyle = GAME.COLORS.HILL_GREEN_DARK;
            ctx.beginPath();
            ctx.arc(drawX + size / 2, hy + 20, size / 2 - 4, Math.PI, 0);
            ctx.lineTo(drawX + size - 4, hy + 20);
            ctx.lineTo(drawX + 4, hy + 20);
            ctx.fill();
        }

        // Clouds
        for (const cloud of cloudPositions) {
            const cx = cloud.x - scrollX * 0.5;
            let drawX = ((cx % (GAME.CANVAS_WIDTH + 300)) + GAME.CANVAS_WIDTH + 300) % (GAME.CANVAS_WIDTH + 300) - 150;

            ctx.fillStyle = GAME.COLORS.CLOUD_WHITE;
            const size = cloud.size * 20;

            // Fluffy cloud shape
            ctx.beginPath();
            ctx.arc(drawX, cloud.y + size / 2, size / 2, 0, Math.PI * 2);
            ctx.arc(drawX + size * 0.6, cloud.y + size / 3, size / 2.5, 0, Math.PI * 2);
            ctx.arc(drawX + size * 1.1, cloud.y + size / 2, size / 2.2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Bushes (in front of hills, behind tiles)
        for (const bush of bushPositions) {
            const bx = bush.x - scrollX * 0.6;
            const by = GAME.CANVAS_HEIGHT - 105;
            let drawX = ((bx % (GAME.CANVAS_WIDTH + 400)) + GAME.CANVAS_WIDTH + 400) % (GAME.CANVAS_WIDTH + 400) - 200;
            const size = bush.size * 20;

            ctx.fillStyle = GAME.COLORS.BUSH_GREEN;
            ctx.beginPath();
            ctx.arc(drawX, by, size / 2, Math.PI, 0);
            ctx.arc(drawX + size * 0.5, by - 3, size / 2.5, Math.PI, 0);
            ctx.arc(drawX + size, by, size / 2, Math.PI, 0);
            ctx.lineTo(drawX + size + size / 2, by);
            ctx.lineTo(drawX - size / 2, by);
            ctx.fill();
        }
    }

    function renderTiles(ctx, level) {
        const ts = GAME.SCALED_TILE;
        const startCol = Math.max(0, Math.floor(Camera.rawX / ts));
        const endCol = Math.min(level.width - 1, Math.ceil((Camera.rawX + GAME.CANVAS_WIDTH) / ts));
        const startRow = Math.max(0, Math.floor(Camera.rawY / ts));
        const endRow = Math.min(level.height - 1, Math.ceil((Camera.rawY + GAME.CANVAS_HEIGHT) / ts));

        const animFrame = Math.floor(Date.now() / 200) % 4;

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const tile = level.tiles[r][c];
                if (tile === TILE.EMPTY) continue;

                const sx = c * ts - Camera.x;
                const sy = r * ts - Camera.y;

                const sprite = getTileSprite(tile, animFrame);
                if (sprite) {
                    ctx.drawImage(sprite, sx, sy, ts, ts);
                } else {
                    // Fallback colored rectangle
                    ctx.fillStyle = getTileFallbackColor(tile);
                    ctx.fillRect(sx, sy, ts, ts);

                    // Add detail for some tiles
                    if (tile === TILE.QUESTION) {
                        ctx.fillStyle = '#804000';
                        ctx.font = `${ts * 0.5}px "Press Start 2P"`;
                        ctx.textAlign = 'center';
                        ctx.fillText('?', sx + ts / 2, sy + ts * 0.7);
                        ctx.textAlign = 'left';
                    }
                    if (tile === TILE.DOOR) {
                        ctx.strokeStyle = '#ffd700';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(sx + 2, sy + 2, ts - 4, ts - 4);
                        ctx.fillStyle = '#ffd700';
                        ctx.beginPath();
                        ctx.arc(sx + ts * 0.7, sy + ts / 2, 3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        }

        // Draw puzzle gate glowing prompt
        for (const door of puzzleDoors) {
            if (!door.opened && Camera.isVisible(door.x, door.y, door.w, door.h)) {
                const sx = door.x * GAME.SCALE - Camera.x;
                const sy = door.y * GAME.SCALE - Camera.y;
                ctx.save();
                ctx.font = '7px "Press Start 2P"';
                ctx.fillStyle = '#00ffff';
                ctx.textAlign = 'center';
                const pulse = Math.sin(Date.now() / 250) * 3;
                ctx.fillText('⚡ TECH GATE ⚡', sx + (door.w * GAME.SCALE) / 2, sy - 10 + pulse);
                ctx.restore();
            }
        }
    }

    function getTileSprite(tileId, animFrame) {
        if (!Assets.loaded) return null;

        const spriteMap = {
            [TILE.GROUND]: 'ground',
            [TILE.BRICK]: 'brick',
            [TILE.QUESTION]: 'question',
            [TILE.QUESTION_USED]: 'question_used',
            [TILE.HARD_BLOCK]: 'hard_block',
            [TILE.PIPE_TL]: 'pipe_tl',
            [TILE.PIPE_TR]: 'pipe_tr',
            [TILE.PIPE_BL]: 'pipe_bl',
            [TILE.PIPE_BR]: 'pipe_br',
            [TILE.PLATFORM]: 'platform',
            [TILE.CASTLE_BLOCK]: 'castle_block',
            [TILE.CASTLE_WINDOW]: 'castle_window',
            [TILE.CASTLE_TOP]: 'castle_top',
            [TILE.UNDERGROUND_BRICK]: 'underground_brick',
            [TILE.LAVA]: 'lava',
            [TILE.BRIDGE]: 'bridge',
            [TILE.DOOR]: 'door',
            [TILE.FLAG_POLE]: 'flag_pole',
            [TILE.FLAG_TOP]: 'flag_top',
            [TILE.SPIKE]: 'spike',
        };

        const name = spriteMap[tileId];
        if (!name) return null;

        // Animated tiles
        if (tileId === TILE.QUESTION || tileId === TILE.LAVA) {
            return Assets.getFrame(name, animFrame);
        }

        return Assets.get(name);
    }

    function getTileFallbackColor(tile) {
        const colorMap = {
            [TILE.GROUND]: GAME.COLORS.GROUND_BROWN,
            [TILE.BRICK]: GAME.COLORS.BRICK_DARK,
            [TILE.QUESTION]: GAME.COLORS.QUESTION_YELLOW,
            [TILE.QUESTION_USED]: '#604020',
            [TILE.HARD_BLOCK]: '#808080',
            [TILE.PIPE_TL]: GAME.COLORS.PIPE_GREEN,
            [TILE.PIPE_TR]: GAME.COLORS.PIPE_GREEN,
            [TILE.PIPE_BL]: GAME.COLORS.PIPE_GREEN_DARK,
            [TILE.PIPE_BR]: GAME.COLORS.PIPE_GREEN_DARK,
            [TILE.PLATFORM]: '#a06020',
            [TILE.CASTLE_BLOCK]: GAME.COLORS.CASTLE_GRAY,
            [TILE.CASTLE_WINDOW]: GAME.COLORS.CASTLE_DARK,
            [TILE.CASTLE_TOP]: GAME.COLORS.CASTLE_GRAY,
            [TILE.UNDERGROUND_BRICK]: '#2040a0',
            [TILE.LAVA]: GAME.COLORS.LAVA_RED,
            [TILE.BRIDGE]: '#804020',
            [TILE.DOOR]: '#4020a0',
            [TILE.FLAG_POLE]: '#808080',
            [TILE.FLAG_TOP]: '#00a800',
            [TILE.SPIKE]: '#a0a0a0',
        };
        return colorMap[tile] || '#ff00ff';
    }

    // ===================== PUZZLE DOOR MANAGEMENT =====================

    let puzzleDoors = [];

    function findPuzzleDoors(level, spawns) {
        puzzleDoors = [];
        for (const spawn of spawns) {
            if (spawn.type === SPAWN.PUZZLE_DOOR) {
                puzzleDoors.push({
                    col: spawn.col,
                    row: spawn.row,
                    x: spawn.col * GAME.TILE_SIZE,
                    y: spawn.row * GAME.TILE_SIZE,
                    w: GAME.TILE_SIZE,
                    h: GAME.TILE_SIZE * 3,
                    opened: false,
                });
            }
        }
    }

    return {
        get currentLevel() { return currentLevel; },
        get levelIndex() { return levelIndex; },
        get totalLevels() { return LEVELS.length; },
        get puzzleDoors() { return puzzleDoors; },

        init(index) {
            levelIndex = index;
            const levelDef = LEVELS[index];

            // Generate level data if not already generated
            if (!levelDef.tileData) {
                generateLevel(levelDef, index);
            }

            bgColor = levelDef.bgColor;
            generateBackground(levelDef);

            currentLevel = {
                tiles: levelDef.tileData,
                width: levelDef.width,
                height: levelDef.height,
                name: levelDef.name,
                subtitle: levelDef.subtitle,
                puzzleType: levelDef.puzzleType || null,
            };

            // Initialize camera
            Camera.init(levelDef.width, levelDef.height);

            // Clear entities
            Enemies.init();
            Items.init();
            Projectiles.init();
            Particles.clear();

            // Spawn entities
            let playerSpawn = { col: 3, row: 10 };
            for (const spawn of levelDef.spawns) {
                const wx = spawn.col * GAME.TILE_SIZE + 1;
                const wy = spawn.row * GAME.TILE_SIZE;

                switch (spawn.type) {
                    case SPAWN.PLAYER:
                        playerSpawn = spawn;
                        break;
                    case SPAWN.GOOMBA:
                    case SPAWN.KOOPA:
                    case SPAWN.PIRANHA:
                        Enemies.spawn(spawn.type, wx, wy);
                        break;
                    case SPAWN.MARIO:
                        Enemies.spawn(SPAWN.MARIO, wx, wy);
                        break;
                    case SPAWN.COIN:
                        Items.spawn('coin', wx, wy);
                        break;
                    case SPAWN.HEART:
                        Items.spawn('heart', wx, wy);
                        break;
                }
            }

            findPuzzleDoors(currentLevel, levelDef.spawns);

            return {
                playerX: playerSpawn.col * GAME.TILE_SIZE + 1,
                playerY: playerSpawn.row * GAME.TILE_SIZE,
            };
        },

        getLevelDef(index) {
            return LEVELS[index];
        },

        update() {
            // Lava animation is handled in render via Date.now()
        },

        render(ctx) {
            renderBackground(ctx);
            renderTiles(ctx, currentLevel);
        },

        // Check if player is near a puzzle door
        checkPuzzleDoor(playerState) {
            for (const door of puzzleDoors) {
                if (door.opened) continue;
                const dist = Math.abs((playerState.x + playerState.w / 2) - (door.x + door.w / 2));
                if (dist < GAME.TILE_SIZE * 2) {
                    return door;
                }
            }
            return null;
        },

        openDoor(door) {
            door.opened = true;
            // Remove door tiles
            for (let r = door.row; r <= door.row + 2; r++) {
                if (r >= 0 && r < currentLevel.height) {
                    currentLevel.tiles[r][door.col] = TILE.EMPTY;
                }
            }
            Particles.doorSparkle(door.x, door.y, GAME.TILE_SIZE * 3);
            Audio.doorOpen();
        },

        // Regenerate level (for restart)
        regenerate(index) {
            LEVELS[index].tileData = null;
            LEVELS[index].spawns = null;
        },
    };
})();

if (typeof window !== 'undefined') {
    window.Level = Level;
}
