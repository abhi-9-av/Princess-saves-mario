// ============================================================================
// PRINCESS SAVES MARIO — Particle Effects System
// ============================================================================

var Particles = (() => {
    const particles = [];

    class Particle {
        constructor(x, y, opts = {}) {
            this.x = x;
            this.y = y;
            this.vx = opts.vx || (Math.random() - 0.5) * 4;
            this.vy = opts.vy || -Math.random() * 4 - 1;
            this.life = opts.life || 30;
            this.maxLife = this.life;
            this.size = opts.size || 2;
            this.color = opts.color || '#ffffff';
            this.gravity = opts.gravity !== undefined ? opts.gravity : 0.15;
            this.shrink = opts.shrink !== undefined ? opts.shrink : true;
            this.fade = opts.fade !== undefined ? opts.fade : true;
            this.shape = opts.shape || 'square'; // 'square', 'circle', 'star'
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += this.gravity;
            this.life--;
            return this.life > 0;
        }

        render(ctx) {
            const progress = 1 - this.life / this.maxLife;
            const alpha = this.fade ? (1 - progress) : 1;
            const size = this.shrink ? this.size * (1 - progress * 0.5) : this.size;

            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;

            const sx = this.x * GAME.SCALE - Camera.x;
            const sy = this.y * GAME.SCALE - Camera.y;
            const ss = size * GAME.SCALE;

            if (this.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(sx, sy, ss / 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.shape === 'star') {
                ctx.fillRect(sx - ss / 2, sy - 1, ss, 2);
                ctx.fillRect(sx - 1, sy - ss / 2, 2, ss);
            } else {
                ctx.fillRect(sx - ss / 2, sy - ss / 2, ss, ss);
            }
            ctx.globalAlpha = 1;
        }
    }

    return {
        get count() { return particles.length; },

        update() {
            for (let i = particles.length - 1; i >= 0; i--) {
                if (!particles[i].update()) {
                    particles.splice(i, 1);
                }
            }
        },

        render(ctx) {
            particles.forEach(p => p.render(ctx));
        },

        clear() {
            particles.length = 0;
        },

        // Add a single particle
        add(x, y, opts) {
            if (particles.length < 500) {  // Cap for performance
                particles.push(new Particle(x, y, opts));
            }
        },

        // === Preset Effects ===

        // Peach parasol float sparkle
        floatSparkle(x, y) {
            particles.push(new Particle(x + (Math.random() - 0.5) * 12, y, {
                vx: (Math.random() - 0.5) * 0.8,
                vy: 0.2 + Math.random() * 0.4,
                life: 14,
                size: 2,
                color: Math.random() > 0.5 ? '#ff80df' : '#ffffff',
                gravity: -0.02,
                shape: 'star',
            }));
        },

        // Coin collect sparkle
        coinCollect(x, y) {
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                particles.push(new Particle(x, y, {
                    vx: Math.cos(angle) * 2,
                    vy: Math.sin(angle) * 2 - 1,
                    life: 20,
                    size: 2,
                    color: i % 2 === 0 ? GAME.COLORS.COIN_GOLD : GAME.COLORS.COIN_SHINE,
                    gravity: 0.05,
                    shape: 'star',
                }));
            }
        },

        // Enemy defeat poof
        enemyDefeat(x, y) {
            for (let i = 0; i < 12; i++) {
                particles.push(new Particle(x, y, {
                    vx: (Math.random() - 0.5) * 5,
                    vy: -Math.random() * 4 - 2,
                    life: 25,
                    size: 3,
                    color: ['#ffffff', '#ffcc00', '#ff8800'][Math.floor(Math.random() * 3)],
                    gravity: 0.1,
                }));
            }
        },

        // Heart blast trail
        heartTrail(x, y) {
            particles.push(new Particle(x, y, {
                vx: (Math.random() - 0.5) * 1,
                vy: (Math.random() - 0.5) * 1,
                life: 15,
                size: 2,
                color: Math.random() > 0.5 ? GAME.COLORS.HEART_RED : GAME.COLORS.HEART_PINK,
                gravity: 0,
                shape: 'circle',
            }));
        },

        // Heart blast explosion
        heartExplosion(x, y) {
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                particles.push(new Particle(x, y, {
                    vx: Math.cos(angle) * 3,
                    vy: Math.sin(angle) * 3,
                    life: 20,
                    size: 2,
                    color: Math.random() > 0.3 ? GAME.COLORS.HEART_PINK : '#ff40a0',
                    gravity: 0,
                    shape: 'circle',
                }));
            }
        },

        // Player hurt flash
        playerHurt(x, y) {
            for (let i = 0; i < 10; i++) {
                particles.push(new Particle(x, y, {
                    vx: (Math.random() - 0.5) * 6,
                    vy: -Math.random() * 5,
                    life: 20,
                    size: 2,
                    color: '#ffffff',
                    gravity: 0.2,
                }));
            }
        },

        // Brick break
        brickBreak(x, y) {
            for (let i = 0; i < 8; i++) {
                particles.push(new Particle(x, y, {
                    vx: (Math.random() - 0.5) * 4,
                    vy: -Math.random() * 6 - 2,
                    life: 40,
                    size: 3,
                    color: i % 2 === 0 ? GAME.COLORS.BRICK_DARK : GAME.COLORS.BRICK_LIGHT,
                    gravity: 0.2,
                    shrink: false,
                }));
            }
        },

        // Door opening sparkle
        doorSparkle(x, y, h) {
            for (let i = 0; i < 20; i++) {
                particles.push(new Particle(x + Math.random() * 16, y + Math.random() * h, {
                    vx: (Math.random() - 0.5) * 2,
                    vy: -Math.random() * 2,
                    life: 30 + Math.random() * 20,
                    size: 2,
                    color: ['#ffd700', '#ff69b4', '#00ffff'][Math.floor(Math.random() * 3)],
                    gravity: -0.02,
                    shape: 'star',
                }));
            }
        },

        // Victory celebration
        victory(canvasWidth) {
            for (let i = 0; i < 30; i++) {
                const worldX = Camera.rawX / GAME.SCALE + Math.random() * canvasWidth / GAME.SCALE;
                const worldY = Camera.rawY / GAME.SCALE;
                particles.push(new Particle(worldX, worldY, {
                    vx: (Math.random() - 0.5) * 3,
                    vy: Math.random() * 2 + 1,
                    life: 60 + Math.random() * 40,
                    size: 3,
                    color: ['#ff69b4', '#ffd700', '#ff4040', '#40ff40', '#4040ff', '#ff8800'][Math.floor(Math.random() * 6)],
                    gravity: 0.02,
                    shrink: false,
                    shape: Math.random() > 0.5 ? 'star' : 'square',
                }));
            }
        },

        // Score popup (floating text-like particles)
        scorePopup(x, y, color = '#ffffff') {
            for (let i = 0; i < 3; i++) {
                particles.push(new Particle(x, y, {
                    vx: (Math.random() - 0.5) * 1,
                    vy: -1.5 - Math.random(),
                    life: 30,
                    size: 2,
                    color: color,
                    gravity: 0,
                    shape: 'star',
                }));
            }
        },

        // Dust puff (landing/running)
        dust(x, y, dir = 0) {
            for (let i = 0; i < 3; i++) {
                particles.push(new Particle(x, y, {
                    vx: (Math.random() * 1.5 + 0.5) * (dir || (Math.random() > 0.5 ? 1 : -1)),
                    vy: -Math.random() * 0.5,
                    life: 12,
                    size: 2,
                    color: '#d0c8b0',
                    gravity: 0.02,
                    shape: 'circle',
                }));
            }
        },

        // Checkpoint activate
        checkpoint(x, y) {
            for (let i = 0; i < 15; i++) {
                const angle = (i / 15) * Math.PI * 2;
                particles.push(new Particle(x, y - 8, {
                    vx: Math.cos(angle) * 2,
                    vy: Math.sin(angle) * 2 - 2,
                    life: 35,
                    size: 2,
                    color: i % 3 === 0 ? '#ffd700' : i % 3 === 1 ? '#ff69b4' : '#ffffff',
                    gravity: 0,
                    shape: 'star',
                }));
            }
        },
    };
})();

if (typeof window !== 'undefined') {
    window.Particles = Particles;
}
