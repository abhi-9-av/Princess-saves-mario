// ============================================================================
// PRINCESS SAVES MARIO — Enemy System
// ============================================================================

var Enemies = (() => {
    let enemies = [];
    const TYPES = GAME.ENEMY;

    class Enemy {
        constructor(type, x, y) {
            this.type = type;
            this.x = x;
            this.y = y;
            this.vx = 0;
            this.vy = 0;
            this.w = type.WIDTH;
            this.h = type.HEIGHT;
            this.speed = type.SPEED;
            this.score = type.SCORE;
            this.alive = true;
            this.active = true;
            this.facing = DIR.LEFT;
            this.onGround = false;
            this.hitWall = false;
            this.hitCeiling = false;
            this.hitHazard = false;
            this.onPlatform = false;
            this.inPit = false;
            this.animFrame = 0;
            this.animTimer = 0;
            this.deathTimer = 0;
            this.stompFlat = false;  // For Goomba stomp animation
        }

        update(level) {
            if (!this.alive) {
                this.deathTimer++;
                if (this.stompFlat) {
                    return this.deathTimer < 30;  // Stay flat briefly
                }
                // Fall off screen
                this.vy += GAME.GRAVITY;
                this.y += this.vy;
                return this.deathTimer < 60;
            }

            // Animation
            this.animTimer++;
            if (this.animTimer >= 10) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 2;
            }

            return true;
        }

        render(ctx) {
            if (!Camera.isVisible(this.x, this.y, this.w, this.h)) return;

            const sx = this.x * GAME.SCALE - Camera.x;
            const sy = this.y * GAME.SCALE - Camera.y;

            ctx.save();
            if (this.facing === DIR.RIGHT) {
                ctx.translate(sx + this.w * GAME.SCALE, sy);
                ctx.scale(-1, 1);
            } else {
                ctx.translate(sx, sy);
            }

            const sprite = this.getSprite();
            if (sprite) {
                const offsetX = -(sprite.width * GAME.SCALE - this.w * GAME.SCALE) / 2;
                const offsetY = -(sprite.height * GAME.SCALE - this.h * GAME.SCALE);

                if (!this.alive && !this.stompFlat) {
                    // Death flip
                    ctx.translate(this.w * GAME.SCALE / 2, this.h * GAME.SCALE / 2);
                    ctx.scale(1, -1);
                    ctx.translate(-this.w * GAME.SCALE / 2, -this.h * GAME.SCALE / 2);
                }

                ctx.drawImage(sprite, offsetX, offsetY,
                    sprite.width * GAME.SCALE, sprite.height * GAME.SCALE);
            }

            ctx.restore();
        }

        getSprite() { return null; }

        kill(stomped = false) {
            this.alive = false;
            this.deathTimer = 0;
            if (stomped) {
                this.stompFlat = true;
            } else {
                this.vy = -5;
            }
        }
    }

    // --- GOOMBA ---
    class Goomba extends Enemy {
        constructor(x, y) {
            super(TYPES.GOOMBA, x, y);
            this.vx = -this.speed;
            this.facing = DIR.LEFT;
        }

        update(level) {
            if (!super.update(level)) return false;
            if (!this.alive) return true;

            // Move horizontally
            this.vx = this.speed * this.facing;

            // Apply gravity
            Physics.applyGravity(this);

            // Resolve collisions
            Physics.resolveEntityTiles(this, level);

            // Reverse direction on wall hit
            if (this.hitWall) {
                this.facing *= -1;
            }

            // Check for edge (don't walk off platforms)
            if (this.onGround) {
                const aheadX = this.x + (this.facing === DIR.RIGHT ? this.w + 2 : -2);
                const belowTile = Physics.getTileAt(level, aheadX, this.y + this.h + 2);
                if (!Physics.isSolid(belowTile) && !Physics.isPlatform(belowTile)) {
                    this.facing *= -1;
                }
            }

            if (this.inPit) return false;
            return true;
        }

        getSprite() {
            if (this.stompFlat) {
                return Assets.getFrame('goomba_flat', 0);
            }
            return Assets.getFrame('goomba_walk', this.animFrame);
        }
    }

    // --- KOOPA ---
    class Koopa extends Enemy {
        constructor(x, y) {
            super(TYPES.KOOPA, x, y);
            this.vx = -this.speed;
            this.facing = DIR.LEFT;
            this.isShell = false;
            this.shellMoving = false;
        }

        update(level) {
            if (!super.update(level)) return false;
            if (!this.alive && !this.isShell) return true;

            if (this.isShell) {
                if (this.shellMoving) {
                    this.vx = TYPES.KOOPA.SHELL_SPEED * this.facing;
                } else {
                    this.vx = 0;
                }
            } else {
                this.vx = this.speed * this.facing;
            }

            Physics.applyGravity(this);
            Physics.resolveEntityTiles(this, level);

            if (this.hitWall) {
                this.facing *= -1;
            }

            // Edge detection (only when walking, not shell)
            if (this.onGround && !this.isShell) {
                const aheadX = this.x + (this.facing === DIR.RIGHT ? this.w + 2 : -2);
                const belowTile = Physics.getTileAt(level, aheadX, this.y + this.h + 2);
                if (!Physics.isSolid(belowTile) && !Physics.isPlatform(belowTile)) {
                    this.facing *= -1;
                }
            }

            if (this.inPit) return false;
            return true;
        }

        getSprite() {
            if (this.isShell) {
                return Assets.getFrame('koopa_shell', this.shellMoving ? this.animFrame : 0);
            }
            return Assets.getFrame('koopa_walk', this.animFrame);
        }

        stomp() {
            if (!this.isShell) {
                // Become shell
                this.isShell = true;
                this.shellMoving = false;
                this.h = TYPES.GOOMBA.HEIGHT;  // Shell is shorter
                this.alive = true;
                this.stompFlat = false;
            } else if (!this.shellMoving) {
                // Kick shell
                this.shellMoving = true;
            } else {
                // Stop shell
                this.shellMoving = false;
            }
        }

        kill(stomped = false) {
            if (stomped) {
                this.stomp();
            } else {
                super.kill(false);
            }
        }
    }

    // --- PIRANHA PLANT ---
    class PiranhaPlant extends Enemy {
        constructor(x, y) {
            super(TYPES.PIRANHA, x, y);
            this.baseY = y;
            this.emergeOffset = 0;
            this.emergeDir = -1;  // -1 = going up, 1 = going down
            this.waitTimer = 0;
            this.maxEmerge = 20;
        }

        update(level) {
            if (!super.update(level)) return false;
            if (!this.alive) return true;

            if (this.waitTimer > 0) {
                this.waitTimer--;
                return true;
            }

            this.emergeOffset += TYPES.PIRANHA.EMERGE_SPEED * this.emergeDir;

            if (this.emergeOffset <= -this.maxEmerge) {
                this.emergeOffset = -this.maxEmerge;
                this.emergeDir = 1;
                this.waitTimer = 60;
            } else if (this.emergeOffset >= 0) {
                this.emergeOffset = 0;
                this.emergeDir = -1;
                this.waitTimer = 40;
            }

            this.y = this.baseY + this.emergeOffset;
            return true;
        }

        getSprite() {
            return Assets.getFrame('piranha', this.animFrame);
        }
    }

    // --- Mario (rescue target, not an enemy but placed in level) ---
    class Mario {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.w = 14;
            this.h = 24;
            this.animFrame = 0;
            this.animTimer = 0;
            this.rescued = false;
        }

        update() {
            this.animTimer++;
            if (this.animTimer >= 20) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 2;
            }
        }

        render(ctx) {
            if (!Camera.isVisible(this.x, this.y, this.w, this.h)) return;

            const sx = this.x * GAME.SCALE - Camera.x;
            const sy = this.y * GAME.SCALE - Camera.y;

            const sprite = Assets.getFrame('mario_captured', this.animFrame);
            if (sprite) {
                const offsetX = -(sprite.width * GAME.SCALE - this.w * GAME.SCALE) / 2;
                const offsetY = -(sprite.height * GAME.SCALE - this.h * GAME.SCALE);
                ctx.drawImage(sprite, sx + offsetX, sy + offsetY,
                    sprite.width * GAME.SCALE, sprite.height * GAME.SCALE);
            }

            // Floating rescue prompt
            if (!this.rescued) {
                ctx.save();
                ctx.font = '7px "Press Start 2P"';
                ctx.fillStyle = '#ffff00';
                ctx.textAlign = 'center';
                const bob = Math.sin(Date.now() / 200) * 3;
                ctx.fillText('PRESS [C] TO RESCUE!', sx + (this.w * GAME.SCALE) / 2, sy - 14 + bob);
                ctx.restore();
            }
        }
    }

    return {
        enemies,
        mario: null,

        init() {
            enemies = [];
            this.enemies = enemies;
            this.mario = null;
        },

        spawn(type, x, y) {
            let enemy;
            switch (type) {
                case SPAWN.GOOMBA:
                    enemy = new Goomba(x, y);
                    break;
                case SPAWN.KOOPA:
                    enemy = new Koopa(x, y);
                    break;
                case SPAWN.PIRANHA:
                    enemy = new PiranhaPlant(x, y);
                    break;
                case SPAWN.MARIO:
                    this.mario = new Mario(x, y);
                    return;
                default:
                    return;
            }
            enemies.push(enemy);
        },

        update(level) {
            for (let i = enemies.length - 1; i >= 0; i--) {
                if (!enemies[i].update(level)) {
                    enemies.splice(i, 1);
                }
            }
            if (this.mario) {
                this.mario.update();
            }
        },

        render(ctx) {
            enemies.forEach(e => e.render(ctx));
            if (this.mario) {
                this.mario.render(ctx);
            }
        },

        // Check collisions with player
        checkPlayerCollisions(player) {
            const pState = player.state;
            if (pState.isDying) return;

            const punchBox = player.getPunchBox();

            for (const enemy of enemies) {
                if (!enemy.alive) {
                    // Check shell collision
                    if (enemy instanceof Koopa && enemy.isShell && enemy.shellMoving) {
                        if (Physics.checkEntityCollision(pState, enemy)) {
                            if (!pState.isInvincible) {
                                player.takeDamage();
                            }
                        }
                        // Shell hits other enemies
                        for (const other of enemies) {
                            if (other !== enemy && other.alive && Physics.checkEntityCollision(enemy, other)) {
                                other.kill(false);
                                player.addScore(other.score);
                                Particles.enemyDefeat(other.x + other.w / 2, other.y + other.h / 2);
                                Audio.enemyHit();
                            }
                        }
                    }
                    continue;
                }

                if (!Physics.checkEntityCollision(pState, enemy)) {
                    // Check punch
                    if (punchBox && Physics.aabbOverlap(punchBox, enemy)) {
                        enemy.kill(false);
                        player.addScore(enemy.score);
                        Particles.enemyDefeat(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
                        Audio.enemyHit();
                    }
                    continue;
                }

                // Collision with enemy!
                if (!(enemy instanceof PiranhaPlant) && Physics.isStomping(pState, enemy)) {
                    // Stomp!
                    enemy.kill(true);
                    pState.vy = -7;  // Bounce
                    player.addScore(enemy.score);
                    Particles.enemyDefeat(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
                    Audio.stomp();
                } else if (!pState.isInvincible) {
                    // Take damage
                    player.takeDamage();
                }
            }

            // Mario rescue check
            if (this.mario && !this.mario.rescued) {
                if (Physics.checkEntityCollision(pState, this.mario)) {
                    pState.nearMario = true;
                    if (pState.isInteracting || Input.gesture.interacting) {
                        this.mario.rescued = true;
                        return 'rescued';
                    }
                } else {
                    pState.nearMario = false;
                }
            }

            return null;
        },

        // Check if any enemy is near a position (for activating piranha plants only near player)
        getEnemiesNear(x, y, radius) {
            return enemies.filter(e =>
                e.alive &&
                Math.abs(e.x - x) < radius &&
                Math.abs(e.y - y) < radius
            );
        },
    };
})();

if (typeof window !== 'undefined') {
    window.Enemies = Enemies;
}
