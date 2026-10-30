// ============================================================================
// PRINCESS SAVES MARIO — Physics & Collision System
// ============================================================================

var Physics = (() => {
    // Solid tile check — returns true if a tile ID is solid (blocks movement)
    function isSolid(tileId) {
        return tileId === TILE.GROUND ||
               tileId === TILE.BRICK ||
               tileId === TILE.QUESTION ||
               tileId === TILE.QUESTION_USED ||
               tileId === TILE.HARD_BLOCK ||
               tileId === TILE.PIPE_TL ||
               tileId === TILE.PIPE_TR ||
               tileId === TILE.PIPE_BL ||
               tileId === TILE.PIPE_BR ||
               tileId === TILE.CASTLE_BLOCK ||
               tileId === TILE.CASTLE_WINDOW ||
               tileId === TILE.CASTLE_TOP ||
               tileId === TILE.UNDERGROUND_BRICK ||
               tileId === TILE.BRIDGE ||
               tileId === TILE.DOOR ||
               tileId === TILE.INVISIBLE;
    }

    // One-way platform check (can stand on but pass through from below/sides)
    function isPlatform(tileId) {
        return tileId === TILE.PLATFORM;
    }

    // Hazard check
    function isHazard(tileId) {
        return tileId === TILE.LAVA ||
               tileId === TILE.SPIKE;
    }

    // Get tile at world pixel coordinates from a level's tile data
    function getTileAt(level, worldX, worldY) {
        const col = Math.floor(worldX / GAME.TILE_SIZE);
        const row = Math.floor(worldY / GAME.TILE_SIZE);
        if (col < 0 || col >= level.width || row < 0 || row >= level.height) {
            // Out of bounds — treat bottom as pit, sides as walls
            if (row >= level.height) return -1;  // Pit
            return TILE.EMPTY;
        }
        return level.tiles[row][col];
    }

    // Set tile at position
    function setTileAt(level, worldX, worldY, tileId) {
        const col = Math.floor(worldX / GAME.TILE_SIZE);
        const row = Math.floor(worldY / GAME.TILE_SIZE);
        if (col >= 0 && col < level.width && row >= 0 && row < level.height) {
            level.tiles[row][col] = tileId;
        }
    }

    // AABB overlap check
    function aabbOverlap(a, b) {
        return a.x < b.x + b.w &&
               a.x + a.w > b.x &&
               a.y < b.y + b.h &&
               a.y + a.h > b.y;
    }

    // AABB overlap amount (for penetration resolution)
    function aabbPenetration(a, b) {
        const overlapX = Math.min(a.x + a.w - b.x, b.x + b.w - a.x);
        const overlapY = Math.min(a.y + a.h - b.y, b.y + b.h - a.y);
        return { x: overlapX, y: overlapY };
    }

    // Resolve entity against tile collisions
    // entity needs: x, y, w, h, vx, vy, onGround
    function resolveEntityTiles(entity, level) {
        entity.onGround = false;
        entity.hitCeiling = false;
        entity.hitWall = false;
        entity.onPlatform = false;

        const ts = GAME.TILE_SIZE;

        // --- Horizontal movement ---
        entity.x += entity.vx;

        // Check horizontal tile collisions
        const startRow = Math.floor(entity.y / ts);
        const endRow = Math.floor((entity.y + entity.h - 1) / ts);
        const checkCol = entity.vx > 0
            ? Math.floor((entity.x + entity.w - 1) / ts)
            : Math.floor(entity.x / ts);

        for (let row = startRow; row <= endRow; row++) {
            const tile = getTileAt(level, checkCol * ts + ts / 2, row * ts + ts / 2);
            if (isSolid(tile)) {
                if (entity.vx > 0) {
                    entity.x = checkCol * ts - entity.w;
                } else if (entity.vx < 0) {
                    entity.x = (checkCol + 1) * ts;
                }
                entity.vx = 0;
                entity.hitWall = true;
                break;
            }
        }

        // --- Vertical movement ---
        entity.y += entity.vy;

        // Check vertical tile collisions
        const startCol = Math.floor(entity.x / ts);
        const endCol = Math.floor((entity.x + entity.w - 1) / ts);
        const checkRow = entity.vy > 0
            ? Math.floor((entity.y + entity.h - 1) / ts)
            : Math.floor(entity.y / ts);

        for (let col = startCol; col <= endCol; col++) {
            const tile = getTileAt(level, col * ts + ts / 2, checkRow * ts + ts / 2);

            if (isSolid(tile)) {
                if (entity.vy > 0) {
                    // Landing on top
                    entity.y = checkRow * ts - entity.h;
                    entity.vy = 0;
                    entity.onGround = true;
                } else if (entity.vy < 0) {
                    // Hit ceiling
                    entity.y = (checkRow + 1) * ts;
                    entity.vy = 0;
                    entity.hitCeiling = true;

                    // Check if it's a question block — bump it
                    if (tile === TILE.QUESTION) {
                        setTileAt(level, col * ts + ts / 2, checkRow * ts + ts / 2, TILE.QUESTION_USED);
                        // Spawn coin above
                        if (typeof Items !== 'undefined') {
                            Items.spawnBumpCoin(col * ts + ts / 2, checkRow * ts - ts);
                        }
                        Audio.coin();
                    }
                }
                break;
            }

            // Platform (one-way) — only solid from above when falling
            if (isPlatform(tile) && entity.vy > 0) {
                const platformTop = checkRow * ts;
                const entityBottom = entity.y + entity.h;
                const prevBottom = entityBottom - entity.vy;

                if (prevBottom <= platformTop + 2) {
                    entity.y = platformTop - entity.h;
                    entity.vy = 0;
                    entity.onGround = true;
                    entity.onPlatform = true;
                    break;
                }
            }

            // Hazard check
            if (isHazard(tile) && entity.vy >= 0) {
                entity.hitHazard = true;
            }
        }

        // Check for pit (fell below level)
        if (entity.y > level.height * ts + ts * 2) {
            entity.inPit = true;
        }

        // Check hazard at feet
        const feetTile = getTileAt(level, entity.x + entity.w / 2, entity.y + entity.h + 1);
        if (isHazard(feetTile)) {
            entity.hitHazard = true;
        }
    }

    // Apply gravity to an entity
    function applyGravity(entity, gravityMult = 1.0) {
        entity.vy += GAME.GRAVITY * gravityMult;
        if (entity.vy > GAME.MAX_FALL_SPEED) {
            entity.vy = GAME.MAX_FALL_SPEED;
        }
    }

    return {
        isSolid,
        isPlatform,
        isHazard,
        getTileAt,
        setTileAt,
        aabbOverlap,
        aabbPenetration,
        resolveEntityTiles,
        applyGravity,

        // Get entity AABB
        getAABB(entity) {
            return {
                x: entity.x,
                y: entity.y,
                w: entity.w,
                h: entity.h,
            };
        },

        // Check entity-to-entity collision
        checkEntityCollision(a, b) {
            return aabbOverlap(
                { x: a.x, y: a.y, w: a.w, h: a.h },
                { x: b.x, y: b.y, w: b.w, h: b.h }
            );
        },

        // Check if entity A is stomping entity B (A is above and falling)
        isStomping(a, b) {
            return a.vy > 0 &&
                   a.y + a.h - a.vy <= b.y + 4 &&
                   a.x + a.w > b.x &&
                   a.x < b.x + b.w;
        },
    };
})();

if (typeof window !== 'undefined') {
    window.Physics = Physics;
}
