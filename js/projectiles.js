// ============================================================================
// PRINCESS SAVES MARIO — Projectile System (Heart Blast)
// ============================================================================

var Projectiles = (() => {
    const projectiles = [];

    class HeartBlast {
        constructor(x, y, direction) {
            this.x = x;
            this.y = y;
            this.w = 10;
            this.h = 10;
            this.vx = GAME.PLAYER.BLAST_SPEED * direction;
            this.vy = 0;
            this.direction = direction;
            this.alive = true;
            this.animFrame = 0;
            this.animTimer = 0;
            this.lifetime = 120;  // Max frames alive
        }

        update(level) {
            this.x += this.vx;
            this.y += this.vy;
            this.lifetime--;

            // Animation
            this.animTimer++;
            if (this.animTimer >= 4) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 2;
            }

            // Trail particles
            if (this.animTimer % 2 === 0) {
                Particles.heartTrail(this.x + this.w / 2, this.y + this.h / 2);
            }

            // Check tile collision
            const tile = Physics.getTileAt(level,
                this.x + this.w / 2,
                this.y + this.h / 2
            );
            if (Physics.isSolid(tile)) {
                this.explode();
                return false;
            }

            // Off screen or expired
            if (this.lifetime <= 0 ||
                !Camera.isVisible(this.x, this.y, this.w, this.h)) {
                return false;
            }

            return true;
        }

        render(ctx) {
            const sx = this.x * GAME.SCALE - Camera.x;
            const sy = this.y * GAME.SCALE - Camera.y;

            const sprite = Assets.getFrame('heart_blast', this.animFrame);
            if (sprite) {
                ctx.save();
                if (this.direction === DIR.LEFT) {
                    ctx.translate(sx + this.w * GAME.SCALE, sy);
                    ctx.scale(-1, 1);
                } else {
                    ctx.translate(sx, sy);
                }
                ctx.drawImage(sprite, 0, 0, this.w * GAME.SCALE, this.h * GAME.SCALE);
                ctx.restore();
            } else {
                // Fallback: draw a pink heart shape
                ctx.fillStyle = GAME.COLORS.HEART_RED;
                ctx.beginPath();
                const cx = sx + this.w * GAME.SCALE / 2;
                const cy = sy + this.h * GAME.SCALE / 2;
                const r = this.w * GAME.SCALE / 3;
                ctx.arc(cx - r / 2, cy - r / 2, r, 0, Math.PI * 2);
                ctx.arc(cx + r / 2, cy - r / 2, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        explode() {
            Particles.heartExplosion(this.x + this.w / 2, this.y + this.h / 2);
        }

        checkEnemyHit(enemy) {
            if (!this.alive || !enemy.alive) return false;
            return Physics.aabbOverlap(
                { x: this.x, y: this.y, w: this.w, h: this.h },
                { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h }
            );
        }
    }

    return {
        get projectiles() { return projectiles; },

        init() {
            projectiles.length = 0;
        },

        fireHeartBlast(x, y, direction) {
            projectiles.push(new HeartBlast(x, y, direction));
        },

        update(level) {
            for (let i = projectiles.length - 1; i >= 0; i--) {
                if (!projectiles[i].update(level)) {
                    projectiles.splice(i, 1);
                }
            }
        },

        render(ctx) {
            projectiles.forEach(p => p.render(ctx));
        },

        // Check projectile collisions with enemies
        checkEnemyCollisions(enemies, player) {
            for (let i = projectiles.length - 1; i >= 0; i--) {
                const proj = projectiles[i];
                for (const enemy of enemies) {
                    if (enemy.alive && proj.checkEnemyHit(enemy)) {
                        enemy.kill(false);
                        proj.explode();
                        projectiles.splice(i, 1);
                        player.addScore(enemy.score);
                        Particles.enemyDefeat(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
                        Audio.enemyHit();
                        break;
                    }
                }
            }
        },

        clear() {
            projectiles.length = 0;
        },
    };
})();

if (typeof window !== 'undefined') {
    window.Projectiles = Projectiles;
}
