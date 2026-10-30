// ============================================================================
// PRINCESS SAVES MARIO — Player Controller (Princess Peach)
// ============================================================================

var Player = (() => {
    const P = GAME.PLAYER;

    const state = {
        x: 0, y: 0,
        w: P.WIDTH, h: P.HEIGHT,
        vx: 0, vy: 0,
        facing: DIR.RIGHT,
        onGround: false,
        hitCeiling: false,
        hitWall: false,
        hitHazard: false,
        onPlatform: false,
        inPit: false,

        // State
        lives: P.MAX_LIVES,
        score: 0,
        coins: 0,
        isJumping: false,
        isFloating: false,
        isPunching: false,
        isBlasting: false,
        isInteracting: false,
        isDying: false,
        isInvincible: false,
        invincibleTimer: 0,
        punchTimer: 0,
        blastCooldown: 0,
        animFrame: 0,
        animTimer: 0,
        jumpHeld: false,     // For variable-height jump
        coyoteTime: 0,       // Frames since leaving ground (for coyote time jump)
        jumpBufferTime: 0,   // Frames since jump was pressed (for jump buffering)
        wasOnGround: false,
        deathTimer: 0,
        checkpointX: 0,
        checkpointY: 0,

        // For interaction detection
        nearDoor: null,
        nearMario: false,
    };

    function reset(x, y) {
        state.x = x;
        state.y = y;
        state.vx = 0;
        state.vy = 0;
        state.facing = DIR.RIGHT;
        state.onGround = false;
        state.isJumping = false;
        state.isFloating = false;
        state.isPunching = false;
        state.isBlasting = false;
        state.isInteracting = false;
        state.isDying = false;
        state.isInvincible = false;
        state.invincibleTimer = 0;
        state.punchTimer = 0;
        state.blastCooldown = 0;
        state.animFrame = 0;
        state.animTimer = 0;
        state.jumpHeld = false;
        state.coyoteTime = 0;
        state.jumpBufferTime = 0;
        state.hitHazard = false;
        state.inPit = false;
        state.nearDoor = null;
        state.nearMario = false;
    }

    function fullReset(x, y) {
        reset(x, y);
        state.lives = P.MAX_LIVES;
        state.score = 0;
        state.coins = 0;
        state.checkpointX = x;
        state.checkpointY = y;
    }

    function update(level) {
        if (state.isDying) {
            state.deathTimer++;
            state.vy += GAME.GRAVITY * 0.5;
            state.y += state.vy;
            return;
        }

        // --- Horizontal Movement ---
        let moveDir = 0;
        const leftDown = Input.isDown(ACTION.LEFT);
        const rightDown = Input.isDown(ACTION.RIGHT);
        if (leftDown && !rightDown) moveDir = -1;
        else if (rightDown && !leftDown) moveDir = 1;
        else moveDir = 0; // If both or neither are down, stop dead!

        if (moveDir !== 0) {
            state.vx += moveDir * P.ACCELERATION;
            state.facing = moveDir;
            // Clamp speed
            if (Math.abs(state.vx) > P.MAX_SPEED) {
                state.vx = P.MAX_SPEED * moveDir;
            }
        } else {
            // Immediate crisp deceleration to 0
            if (Math.abs(state.vx) <= P.DECELERATION) {
                state.vx = 0;
            } else {
                state.vx -= Math.sign(state.vx) * P.DECELERATION;
            }
        }

        // --- Jump (with coyote time + jump buffering) ---
        if (state.onGround) {
            state.coyoteTime = 6;  // 6 frames of coyote time
            state.isJumping = false;
            state.isFloating = false;
        } else {
            if (state.coyoteTime > 0) state.coyoteTime--;
        }

        const jumpPressed = Input.isPressed(ACTION.JUMP);
        const jumpDown = Input.isDown(ACTION.JUMP);

        if (jumpPressed) {
            state.jumpBufferTime = 10;  // 10 frames of jump buffer
        } else if (jumpDown && state.onGround) {
            // Finger held raised or Space held while landing: immediately buffer jump!
            state.jumpBufferTime = 6;
        } else {
            if (state.jumpBufferTime > 0) state.jumpBufferTime--;
        }

        // Execute jump
        if (state.jumpBufferTime > 0 && state.coyoteTime > 0) {
            state.vy = P.JUMP_FORCE;
            state.isJumping = true;
            state.jumpHeld = true;
            state.coyoteTime = 0;
            state.jumpBufferTime = 0;
            state.onGround = false;
            Audio.jump();
            Particles.dust(state.x + state.w / 2, state.y + state.h);
        }

        // Variable jump height — cut short only if jump released while still rising fast
        if (state.isJumping && !jumpDown && state.vy < -3.0) {
            state.vy *= P.JUMP_CUT_MULTIPLIER;
            state.isJumping = false;
        }

        // Floating (hold jump while falling)
        state.isFloating = !state.onGround && state.vy > 0 && jumpDown;
        if (state.isFloating && (state.animTimer % 4 === 0)) {
            Particles.floatSparkle(state.x + state.w / 2, state.y + state.h - 2);
        }

        // Apply gravity
        const gravMult = state.isFloating ? P.FLOAT_GRAVITY / GAME.GRAVITY : 1.0;
        Physics.applyGravity(state, gravMult);

        // --- Resolve tile collisions ---
        const wasOnGround = state.onGround;
        Physics.resolveEntityTiles(state, level);

        // Landing effects
        if (state.onGround && !wasOnGround && state.vy === 0) {
            Particles.dust(state.x + state.w / 2, state.y + state.h, -state.facing);
        }

        // --- Punching ---
        if (state.punchTimer > 0) {
            state.punchTimer--;
            if (state.punchTimer === 0) state.isPunching = false;
        }

        if (Input.isPressed(ACTION.PUNCH) && !state.isPunching) {
            state.isPunching = true;
            state.punchTimer = 12;  // Punch duration in frames
            Audio.punch();
        }

        // --- Heart Blast ---
        if (state.blastCooldown > 0) state.blastCooldown--;

        if (Input.isPressed(ACTION.BLAST) && state.blastCooldown === 0) {
            state.isBlasting = true;
            state.blastCooldown = P.BLAST_COOLDOWN;
            // Fire projectile
            Projectiles.fireHeartBlast(
                state.x + (state.facing === DIR.RIGHT ? state.w : 0),
                state.y + state.h / 2 - 4,
                state.facing
            );
            Audio.blast();
            setTimeout(() => { state.isBlasting = false; }, 150);
        }

        // --- Interaction ---
        state.isInteracting = Input.isDown(ACTION.INTERACT);

        // --- Invincibility ---
        if (state.invincibleTimer > 0) {
            state.invincibleTimer--;
            if (state.invincibleTimer === 0) {
                state.isInvincible = false;
            }
        }

        // --- Animation ---
        state.animTimer++;
        if (state.animTimer >= 6) {
            state.animTimer = 0;
            state.animFrame++;
        }

        // --- Hazard/Pit check ---
        if (state.hitHazard) {
            takeDamage();
            state.hitHazard = false;
        }

        if (state.inPit) {
            die();
            state.inPit = false;
        }
    }

    function takeDamage() {
        if (state.isInvincible || state.isDying) return;
        state.lives--;
        Audio.hurt();
        Camera.shake(6, 15);
        Particles.playerHurt(state.x + state.w / 2, state.y + state.h / 2);

        if (state.lives <= 0) {
            die();
        } else {
            state.isInvincible = true;
            state.invincibleTimer = P.INVINCIBLE_TIME;
            // Knockback
            state.vy = -5;
            state.vx = -state.facing * 3;
        }
    }

    function die() {
        if (state.isDying) return;
        state.isDying = true;
        state.vy = -8;
        state.vx = 0;
        state.deathTimer = 0;
        Audio.die();
    }

    function addScore(points) {
        state.score += points;
    }

    function addCoin() {
        state.coins++;
        state.score += GAME.COIN_SCORE;
    }

    function addLife() {
        if (state.lives < P.MAX_LIVES) {
            state.lives++;
            Audio.powerUp();
        }
    }

    function render(ctx) {
        // Invincibility blink
        if (state.isInvincible && state.invincibleTimer % 4 < 2) return;
        if (state.isDying && state.deathTimer > 90) return;

        const sx = state.x * GAME.SCALE - Camera.x;
        const sy = state.y * GAME.SCALE - Camera.y;

        // Determine sprite to use
        let spriteName;
        if (state.isDying) {
            spriteName = 'peach_hurt';
        } else if (state.isPunching) {
            spriteName = 'peach_punch';
        } else if (state.isBlasting) {
            spriteName = 'peach_blast';
        } else if (state.isInteracting) {
            spriteName = 'peach_interact';
        } else if (!state.onGround) {
            spriteName = state.vy < 0 ? 'peach_jump' : 'peach_fall';
        } else if (Math.abs(state.vx) > 0.5) {
            spriteName = 'peach_run';
        } else {
            spriteName = 'peach_idle';
        }

        const sprite = Assets.getFrame(spriteName, state.animFrame);
        if (!sprite) return;

        ctx.save();
        // Flip sprite based on facing direction
        if (state.facing === DIR.LEFT) {
            ctx.translate(sx + state.w * GAME.SCALE, sy);
            ctx.scale(-1, 1);
        } else {
            ctx.translate(sx, sy);
        }

        // Draw sprite scaled
        // Center the sprite horizontally since sprite may be wider than hitbox
        const offsetX = -(sprite.width * GAME.SCALE - state.w * GAME.SCALE) / 2;
        const offsetY = -(sprite.height * GAME.SCALE - state.h * GAME.SCALE);
        ctx.drawImage(sprite, offsetX, offsetY, sprite.width * GAME.SCALE, sprite.height * GAME.SCALE);

        ctx.restore();

        // Punch effect
        if (state.isPunching && state.punchTimer > 6) {
            const px = state.facing === DIR.RIGHT
                ? sx + state.w * GAME.SCALE
                : sx - P.PUNCH_RANGE * GAME.SCALE;
            ctx.fillStyle = 'rgba(255, 105, 180, 0.4)';
            ctx.fillRect(px, sy + 4 * GAME.SCALE, P.PUNCH_RANGE * GAME.SCALE, 12 * GAME.SCALE);
        }
    }

    function getPunchBox() {
        if (!state.isPunching || state.punchTimer <= 6) return null;
        const px = state.facing === DIR.RIGHT
            ? state.x + state.w
            : state.x - P.PUNCH_RANGE;
        return {
            x: px,
            y: state.y + 4,
            w: P.PUNCH_RANGE,
            h: 12,
        };
    }

    return {
        state,
        reset,
        fullReset,
        update,
        render,
        takeDamage,
        die,
        addScore,
        addCoin,
        addLife,
        getPunchBox,
    };
})();

if (typeof window !== 'undefined') {
    window.Player = Player;
}
