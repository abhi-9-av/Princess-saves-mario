// ============================================================================
// PRINCESS SAVES MARIO — HUD (Heads-Up Display)
// ============================================================================

var HUD = (() => {
    let timeLeft = GAME.STAGE_TIME;
    let timerAccumulator = 0;
    let warningPlayed = false;

    return {
        get timeLeft() { return Math.ceil(timeLeft); },

        resetTimer() {
            timeLeft = GAME.STAGE_TIME;
            timerAccumulator = 0;
            warningPlayed = false;
        },

        addTime(seconds) {
            timeLeft = Math.min(GAME.STAGE_TIME + 30, timeLeft + seconds);
        },

        update(dt) {
            if (timeLeft > 0) {
                timeLeft -= dt;
                if (timeLeft <= 0) {
                    timeLeft = 0;
                }

                // Low time alert (last 10 seconds)
                if (timeLeft <= 10 && !warningPlayed) {
                    Audio.timeWarning();
                    warningPlayed = true;
                } else if (timeLeft > 10) {
                    warningPlayed = false;
                }
            }
        },

        render(ctx) {
            ctx.save();
            ctx.font = '10px "Press Start 2P"';
            ctx.textBaseline = 'top';

            const p = Player.state;
            const topMargin = 12;

            // 1. PRINCESS & SCORE
            ctx.fillStyle = '#000000';
            ctx.fillText('PEACH', 21, topMargin + 1);
            ctx.fillStyle = '#ffffff';
            ctx.fillText('PEACH', 20, topMargin);

            const scoreStr = String(p.score).padStart(6, '0');
            ctx.fillStyle = '#000000';
            ctx.fillText(scoreStr, 21, topMargin + 15);
            ctx.fillStyle = '#ffec70';
            ctx.fillText(scoreStr, 20, topMargin + 14);

            // 2. COINS
            const coinIcon = Assets.getFrame('coin_icon', 0);
            if (coinIcon) {
                ctx.drawImage(coinIcon, 200, topMargin + 14, 15, 15);
            }
            const coinStr = 'x' + String(p.coins).padStart(2, '0');
            ctx.fillStyle = '#000000';
            ctx.fillText(coinStr, 221, topMargin + 15);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(coinStr, 220, topMargin + 14);

            // 3. LIVES
            const lifeIcon = Assets.get('life_icon');
            if (lifeIcon) {
                ctx.drawImage(lifeIcon, 340, topMargin + 14, 18, 18);
            }
            const livesStr = 'x' + Math.max(0, p.lives);
            ctx.fillStyle = '#000000';
            ctx.fillText(livesStr, 366, topMargin + 15);
            ctx.fillStyle = '#ff80df';
            ctx.fillText(livesStr, 365, topMargin + 14);

            // 4. WORLD INFO
            const worldName = `WORLD ${Level.levelIndex + 1}-1`;
            ctx.fillStyle = '#000000';
            ctx.fillText('WORLD', 501, topMargin + 1);
            ctx.fillText(worldName, 501, topMargin + 15);
            ctx.fillStyle = '#ffffff';
            ctx.fillText('WORLD', 500, topMargin);
            ctx.fillStyle = '#ffec70';
            ctx.fillText(worldName, 500, topMargin + 14);

            // 5. 60-SECOND COUNTDOWN TIMER
            const clockIcon = Assets.get('clock_icon');
            if (clockIcon) {
                ctx.drawImage(clockIcon, 660, topMargin + 14, 15, 15);
            }

            ctx.fillStyle = '#000000';
            ctx.fillText('TIME', 686, topMargin + 1);
            ctx.fillStyle = '#ffffff';
            ctx.fillText('TIME', 685, topMargin);

            const displayTime = Math.ceil(timeLeft);
            const timeStr = String(displayTime).padStart(3, '0');

            // Flashing red when under 15 seconds
            const isLowTime = displayTime <= 15;
            const flash = isLowTime && (Math.floor(Date.now() / 250) % 2 === 0);

            ctx.fillStyle = '#000000';
            ctx.fillText(timeStr, 686, topMargin + 15);
            ctx.fillStyle = flash ? '#ff0033' : (isLowTime ? '#ff8080' : '#ffffff');
            ctx.fillText(timeStr, 685, topMargin + 14);

            // 6. GESTURE & AUDIO STATUS PILL (Bottom bar)
            ctx.font = '8px "Press Start 2P"';
            ctx.textBaseline = 'middle';
            const gestureActive = Input.gesture.active;
            const statusText = `[G] GESTURE CAM: ${gestureActive ? 'ON' : 'OFF'}  |  [M] AUDIO: ${Audio.isMuted() ? 'MUTED' : 'ON'}`;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(10, GAME.CANVAS_HEIGHT - 24, 400, 18);
            ctx.fillStyle = gestureActive ? '#30ff30' : '#cccccc';
            ctx.fillText(statusText, 16, GAME.CANVAS_HEIGHT - 15);

            // If gesture active, draw miniature feedback tag
            if (gestureActive) {
                let actionTag = 'STOPPED';
                if (Input.gesture.direction === DIR.LEFT) actionTag = 'STEER LEFT';
                else if (Input.gesture.direction === DIR.RIGHT) actionTag = 'STEER RIGHT';
                if (Input.gesture.jumping) actionTag += ' + JUMP';
                if (Input.gesture.blasting) actionTag = 'SNAP BLAST';
                if (Input.gesture.punching) actionTag = 'PUNCH';
                if (Input.gesture.interacting) actionTag = 'RESCUE';

                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect(GAME.CANVAS_WIDTH - 240, GAME.CANVAS_HEIGHT - 24, 230, 18);
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 1;
                ctx.strokeRect(GAME.CANVAS_WIDTH - 240, GAME.CANVAS_HEIGHT - 24, 230, 18);
                ctx.fillStyle = '#00ffff';
                ctx.fillText(`MOTION: ${actionTag}`, GAME.CANVAS_WIDTH - 232, GAME.CANVAS_HEIGHT - 15);
            }

            ctx.restore();
        }
    };
})();

if (typeof window !== 'undefined') {
    window.HUD = HUD;
}
