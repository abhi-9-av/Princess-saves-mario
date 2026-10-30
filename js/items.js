// ============================================================================
// PRINCESS SAVES MARIO — Items (Coins, Hearts, Score Popups)
// ============================================================================

var Items = (() => {
    let items = [];
    let floatingTexts = [];

    class Item {
        constructor(type, x, y) {
            this.type = type;
            this.x = x;
            this.y = y;
            this.w = 12;
            this.h = 12;
            this.collected = false;
            this.animFrame = 0;
            this.animTimer = 0;
            this.bobOffset = Math.random() * Math.PI * 2;  // Random bob phase
        }

        update() {
            if (this.collected) return false;

            this.animTimer++;
            if (this.animTimer >= 8) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 4;
            }

            return true;
        }

        render(ctx) {
            if (this.collected) return;
            if (!Camera.isVisible(this.x, this.y, this.w, this.h)) return;

            const bob = Math.sin((this.animTimer / 8 + this.bobOffset) * 0.5) * 2;
            const sx = this.x * GAME.SCALE - Camera.x;
            const sy = (this.y + bob) * GAME.SCALE - Camera.y;

            const spriteName = this.type === 'coin' ? 'coin' : 'heart_item';
            const sprite = Assets.getFrame(spriteName, this.animFrame);

            if (sprite) {
                ctx.drawImage(sprite, sx, sy, this.w * GAME.SCALE, this.h * GAME.SCALE);
            } else {
                // Fallback rendering
                ctx.fillStyle = this.type === 'coin' ? GAME.COLORS.COIN_GOLD : GAME.COLORS.HEART_RED;
                ctx.fillRect(sx + 4, sy + 2, this.w * GAME.SCALE - 8, this.h * GAME.SCALE - 4);
            }
        }

        collect(player) {
            if (this.collected) return;
            this.collected = true;

            if (this.type === 'coin') {
                player.addCoin();
                Audio.coin();
                Particles.coinCollect(this.x + this.w / 2, this.y + this.h / 2);
                addFloatingText('+' + GAME.COIN_SCORE, this.x, this.y, GAME.COLORS.COIN_GOLD);
            } else if (this.type === 'heart') {
                player.addLife();
                Particles.scorePopup(this.x + this.w / 2, this.y + this.h / 2, GAME.COLORS.HEART_RED);
                addFloatingText('+1 UP', this.x, this.y, GAME.COLORS.HEART_RED);
            }
        }
    }

    // Bump coin (from question blocks — shoots up and disappears)
    class BumpCoin {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.startY = y;
            this.vy = -4;
            this.lifetime = 20;
            this.animFrame = 0;
        }

        update() {
            this.y += this.vy;
            this.vy += 0.3;
            this.lifetime--;
            this.animFrame = (this.animFrame + 1) % 4;
            return this.lifetime > 0;
        }

        render(ctx) {
            const sx = this.x * GAME.SCALE - Camera.x;
            const sy = this.y * GAME.SCALE - Camera.y;

            const sprite = Assets.getFrame('coin', this.animFrame);
            if (sprite) {
                ctx.drawImage(sprite, sx, sy, 12 * GAME.SCALE, 12 * GAME.SCALE);
            } else {
                ctx.fillStyle = GAME.COLORS.COIN_GOLD;
                ctx.fillRect(sx, sy, 10 * GAME.SCALE, 12 * GAME.SCALE);
            }
        }
    }

    let bumpCoins = [];

    // Floating text (score popup)
    class FloatingText {
        constructor(text, x, y, color) {
            this.text = text;
            this.x = x;
            this.y = y;
            this.vy = -1;
            this.life = 40;
            this.maxLife = 40;
            this.color = color;
        }

        update() {
            this.y += this.vy;
            this.vy *= 0.95;
            this.life--;
            return this.life > 0;
        }

        render(ctx) {
            const alpha = this.life / this.maxLife;
            const sx = this.x * GAME.SCALE - Camera.x;
            const sy = this.y * GAME.SCALE - Camera.y;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = '8px "Press Start 2P"';
            ctx.fillStyle = '#000000';
            ctx.fillText(this.text, sx + 1, sy + 1);
            ctx.fillStyle = this.color;
            ctx.fillText(this.text, sx, sy);
            ctx.restore();
        }
    }

    function addFloatingText(text, x, y, color) {
        floatingTexts.push(new FloatingText(text, x, y, color));
    }

    return {
        get items() { return items; },

        init() {
            items = [];
            bumpCoins = [];
            floatingTexts = [];
        },

        spawn(type, x, y) {
            items.push(new Item(type, x, y));
        },

        spawnBumpCoin(x, y) {
            bumpCoins.push(new BumpCoin(x, y));
            Player.addCoin();
            addFloatingText('+' + GAME.COIN_SCORE, x, y - 8, GAME.COLORS.COIN_GOLD);
        },

        update() {
            for (let i = items.length - 1; i >= 0; i--) {
                if (!items[i].update()) {
                    items.splice(i, 1);
                }
            }
            for (let i = bumpCoins.length - 1; i >= 0; i--) {
                if (!bumpCoins[i].update()) {
                    bumpCoins.splice(i, 1);
                }
            }
            for (let i = floatingTexts.length - 1; i >= 0; i--) {
                if (!floatingTexts[i].update()) {
                    floatingTexts.splice(i, 1);
                }
            }
        },

        render(ctx) {
            items.forEach(item => item.render(ctx));
            bumpCoins.forEach(bc => bc.render(ctx));
            floatingTexts.forEach(ft => ft.render(ctx));
        },

        // Check player collection
        checkPlayerCollisions(player) {
            const pState = player.state;
            for (const item of items) {
                if (item.collected) continue;
                if (Physics.aabbOverlap(
                    { x: pState.x, y: pState.y, w: pState.w, h: pState.h },
                    { x: item.x, y: item.y, w: item.w, h: item.h }
                )) {
                    item.collect(player);
                }
            }
        },

        addFloatingText,
    };
})();

if (typeof window !== 'undefined') {
    window.Items = Items;
}
