// ============================================================================
// PRINCESS SAVES MARIO — Camera System
// ============================================================================

var Camera = (() => {
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let shakeX = 0;
    let shakeY = 0;
    let shakeIntensity = 0;
    let shakeDuration = 0;
    let levelWidth = 0;
    let levelHeight = 0;
    const smoothing = 0.1;  // Lower = smoother camera

    return {
        get x() { return Math.floor(x + shakeX); },
        get y() { return Math.floor(y + shakeY); },
        get rawX() { return x; },
        get rawY() { return y; },

        init(lvlWidth, lvlHeight) {
            levelWidth = lvlWidth;
            levelHeight = lvlHeight;
            x = 0;
            y = 0;
            shakeX = 0;
            shakeY = 0;
        },

        // Focus camera on a target position (usually the player)
        follow(px, py) {
            // Center player horizontally, slight offset to see ahead
            targetX = px - GAME.CANVAS_WIDTH / 2 + GAME.SCALED_TILE;

            // Vertical: only follow if player is above or below visible area
            targetY = py - GAME.CANVAS_HEIGHT / 2 + GAME.SCALED_TILE * 2;

            // Smooth interpolation
            x += (targetX - x) * smoothing;
            y += (targetY - y) * smoothing;

            // Clamp to level bounds
            const maxX = levelWidth * GAME.SCALED_TILE - GAME.CANVAS_WIDTH;
            const maxY = levelHeight * GAME.SCALED_TILE - GAME.CANVAS_HEIGHT;
            x = Math.max(0, Math.min(x, maxX));
            y = Math.max(0, Math.min(y, Math.max(0, maxY)));
        },

        // Snap camera to position (no smoothing)
        snapTo(px, py) {
            x = px - GAME.CANVAS_WIDTH / 2;
            y = py - GAME.CANVAS_HEIGHT / 2;

            const maxX = levelWidth * GAME.SCALED_TILE - GAME.CANVAS_WIDTH;
            const maxY = levelHeight * GAME.SCALED_TILE - GAME.CANVAS_HEIGHT;
            x = Math.max(0, Math.min(x, maxX));
            y = Math.max(0, Math.min(y, Math.max(0, maxY)));
        },

        // Screen shake effect
        shake(intensity = 5, duration = 10) {
            shakeIntensity = intensity;
            shakeDuration = duration;
        },

        update() {
            if (shakeDuration > 0) {
                shakeX = (Math.random() - 0.5) * shakeIntensity * 2;
                shakeY = (Math.random() - 0.5) * shakeIntensity * 2;
                shakeDuration--;
                shakeIntensity *= 0.9;
            } else {
                shakeX = 0;
                shakeY = 0;
            }
        },

        // Convert world coordinates to screen coordinates
        worldToScreen(wx, wy) {
            return {
                x: wx * GAME.SCALE - this.x,
                y: wy * GAME.SCALE - this.y,
            };
        },

        // Convert screen coordinates to world coordinates
        screenToWorld(sx, sy) {
            return {
                x: (sx + this.x) / GAME.SCALE,
                y: (sy + this.y) / GAME.SCALE,
            };
        },

        // Check if a world-space rectangle is visible on screen
        isVisible(wx, wy, ww, wh) {
            const sx = wx * GAME.SCALE - this.x;
            const sy = wy * GAME.SCALE - this.y;
            const sw = ww * GAME.SCALE;
            const sh = wh * GAME.SCALE;
            return sx + sw > 0 && sx < GAME.CANVAS_WIDTH &&
                   sy + sh > 0 && sy < GAME.CANVAS_HEIGHT;
        },
    };
})();

if (typeof window !== 'undefined') {
    window.Camera = Camera;
}
