// ============================================================================
// PRINCESS SAVES MARIO — Game Screens (Title, Intro, GameOver, Victory, Pause)
// ============================================================================

var Screens = (() => {
    let animTimer = 0;

    return {
        update() {
            animTimer++;
        },

        // TITLE SCREEN
        renderTitle(ctx) {
            // Dark gradient backdrop
            const grad = ctx.createLinearGradient(0, 0, 0, GAME.CANVAS_HEIGHT);
            grad.addColorStop(0, '#120224');
            grad.addColorStop(0.5, '#2e0854');
            grad.addColorStop(1, '#080112');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, GAME.CANVAS_WIDTH, GAME.CANVAS_HEIGHT);

            // Floating star particles in background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            for (let i = 0; i < 25; i++) {
                const sx = (i * 37 + animTimer * 0.5) % GAME.CANVAS_WIDTH;
                const sy = (i * 29) % (GAME.CANVAS_HEIGHT - 60);
                ctx.fillRect(sx, sy, 2, 2);
            }

            ctx.save();
            ctx.textAlign = 'center';

            // MAIN TITLE
            const bounce = Math.sin(animTimer * 0.05) * 4;

            ctx.font = '24px "Press Start 2P"';
            ctx.fillStyle = '#000000';
            ctx.fillText('PRINCESS SAVES MARIO', GAME.CANVAS_WIDTH / 2 + 3, 90 + bounce + 3);
            ctx.fillStyle = '#ff69b4';
            ctx.fillText('PRINCESS SAVES MARIO', GAME.CANVAS_WIDTH / 2, 90 + bounce);

            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#ffd700';
            ctx.fillText('HIGH-STAKES REVERSE-RESCUE PLATFORMER', GAME.CANVAS_WIDTH / 2, 125);

            // Large Sprites in center: Peach running toward Mario
            const peachSprite = Assets.getFrame('peach_run', Math.floor(animTimer / 8));
            const marioSprite = Assets.getFrame('mario_captured', Math.floor(animTimer / 20));

            if (peachSprite) {
                ctx.drawImage(peachSprite, GAME.CANVAS_WIDTH / 2 - 70, 160, 48, 72);
            }
            if (marioSprite) {
                ctx.drawImage(marioSprite, GAME.CANVAS_WIDTH / 2 + 30, 160, 48, 72);
            }

            // Arrow pointing rescue
            ctx.font = '16px "Press Start 2P"';
            ctx.fillStyle = '#00ffcc';
            ctx.fillText('>>>', GAME.CANVAS_WIDTH / 2, 200);

            // 60-SECOND MISSION NOTICE
            ctx.font = '9px "Press Start 2P"';
            ctx.fillStyle = '#ff4040';
            ctx.fillText('⚡ 60 SECONDS PER STAGE - SOLVE TECH PUZZLES & RESCUE MARIO ⚡', GAME.CANVAS_WIDTH / 2, 260);

            // CONTROLS OVERVIEW BOX
            const boxY = 285;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(100, boxY, GAME.CANVAS_WIDTH - 200, 100);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect(100, boxY, GAME.CANVAS_WIDTH - 200, 100);

            ctx.font = '8px "Press Start 2P"';
            ctx.fillStyle = '#00ffcc';
            ctx.fillText('[DUAL-INPUT ARCHITECTURE]', GAME.CANVAS_WIDTH / 2, boxY + 16);

            ctx.fillStyle = '#ffffff';
            ctx.fillText('KEYBOARD: Arrows/WASD Move | Space Jump | Z Punch | X Blast | C Interact', GAME.CANVAS_WIDTH / 2, boxY + 36);
            ctx.fillText('GESTURES: Point Finger (Move) | Raise (Jump) | Fist (Punch) | Snap (Blast)', GAME.CANVAS_WIDTH / 2, boxY + 54);
            ctx.fillText('PRESS [G] ANYTIME TO TOGGLE CAMERA GESTURE TRACKER', GAME.CANVAS_WIDTH / 2, boxY + 72);
            ctx.fillText('PRESS [M] TO TOGGLE AUDIO ON / OFF', GAME.CANVAS_WIDTH / 2, boxY + 86);

            // BLINKING START PROMPT
            if (Math.floor(animTimer / 30) % 2 === 0) {
                ctx.font = '11px "Press Start 2P"';
                ctx.fillStyle = '#ffff00';
                ctx.fillText('PRESS SPACE, ENTER OR CLICK TO START', GAME.CANVAS_WIDTH / 2, 425);
            }

            ctx.font = '7px "Press Start 2P"';
            ctx.fillStyle = '#a0a0a0';
            ctx.fillText('TECHVERSE GDD SPECIFICATION - RETRO PLATFORMER ENGINE', GAME.CANVAS_WIDTH / 2, 455);

            ctx.restore();
        },

        // LEVEL INTRO SCREEN
        renderLevelIntro(ctx, levelIndex) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, GAME.CANVAS_WIDTH, GAME.CANVAS_HEIGHT);

            ctx.save();
            ctx.textAlign = 'center';

            const levelDef = Level.getLevelDef(levelIndex);
            ctx.font = '18px "Press Start 2P"';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`WORLD ${levelIndex + 1}-1`, GAME.CANVAS_WIDTH / 2, 170);

            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#ff69b4';
            ctx.fillText(levelDef.name, GAME.CANVAS_WIDTH / 2, 210);

            ctx.fillStyle = '#ffd700';
            ctx.fillText(levelDef.subtitle, GAME.CANVAS_WIDTH / 2, 240);

            // Peach icon and lives count
            const lifeIcon = Assets.get('life_icon');
            if (lifeIcon) {
                ctx.drawImage(lifeIcon, GAME.CANVAS_WIDTH / 2 - 35, 275, 28, 28);
            }
            ctx.font = '14px "Press Start 2P"';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`x  ${Player.state.lives}`, GAME.CANVAS_WIDTH / 2 + 25, 296);

            ctx.font = '8px "Press Start 2P"';
            ctx.fillStyle = '#ff4444';
            ctx.fillText('TIME LIMIT: 60 SECONDS!', GAME.CANVAS_WIDTH / 2, 360);

            ctx.restore();
        },

        // PAUSE SCREEN
        renderPause(ctx) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(0, 0, GAME.CANVAS_WIDTH, GAME.CANVAS_HEIGHT);

            ctx.save();
            ctx.textAlign = 'center';

            ctx.font = '22px "Press Start 2P"';
            ctx.fillStyle = '#ffd700';
            ctx.fillText('PAUSED', GAME.CANVAS_WIDTH / 2, 140);

            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('PRESS [ESC] OR [P] TO RESUME', GAME.CANVAS_WIDTH / 2, 200);
            ctx.fillText('PRESS [G] TO TOGGLE GESTURE CAMERA', GAME.CANVAS_WIDTH / 2, 230);
            ctx.fillText('PRESS [M] TO TOGGLE AUDIO MUTE', GAME.CANVAS_WIDTH / 2, 260);

            ctx.fillStyle = '#00ffcc';
            ctx.fillText('CURRENT MISSION:', GAME.CANVAS_WIDTH / 2, 320);
            ctx.fillStyle = '#ff69b4';
            ctx.fillText(`${Level.currentLevel ? Level.currentLevel.name : 'WORLD'}`, GAME.CANVAS_WIDTH / 2, 345);

            ctx.restore();
        },

        // GAME OVER SCREEN
        renderGameOver(ctx) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, GAME.CANVAS_WIDTH, GAME.CANVAS_HEIGHT);

            ctx.save();
            ctx.textAlign = 'center';

            ctx.font = '26px "Press Start 2P"';
            ctx.fillStyle = '#e52521';
            ctx.fillText('GAME OVER', GAME.CANVAS_WIDTH / 2, 160);

            ctx.font = '11px "Press Start 2P"';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`FINAL SCORE: ${String(Player.state.score).padStart(6, '0')}`, GAME.CANVAS_WIDTH / 2, 230);
            ctx.fillText(`COINS COLLECTED: ${Player.state.coins}`, GAME.CANVAS_WIDTH / 2, 260);

            if (Math.floor(animTimer / 25) % 2 === 0) {
                ctx.fillStyle = '#ffd700';
                ctx.font = '12px "Press Start 2P"';
                ctx.fillText('PRESS SPACE OR ENTER TO RETRY', GAME.CANVAS_WIDTH / 2, 350);
            }

            ctx.restore();
        },

        // LEVEL CLEAR SCREEN
        renderLevelClear(ctx) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, GAME.CANVAS_WIDTH, GAME.CANVAS_HEIGHT);

            ctx.save();
            ctx.textAlign = 'center';

            ctx.font = '20px "Press Start 2P"';
            ctx.fillStyle = '#00ff66';
            ctx.fillText('STAGE CLEARED!', GAME.CANVAS_WIDTH / 2, 150);

            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#ffd700';
            ctx.fillText(`TIME REMAINING BONUS: +${HUD.timeLeft * 50} PTS`, GAME.CANVAS_WIDTH / 2, 220);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`CURRENT SCORE: ${Player.state.score}`, GAME.CANVAS_WIDTH / 2, 260);

            ctx.fillStyle = '#00ffff';
            ctx.fillText('PREPARING NEXT SUB-ZONE...', GAME.CANVAS_WIDTH / 2, 330);

            ctx.restore();
        },

        // VICTORY SCREEN (MARIO RESCUED!)
        renderVictory(ctx) {
            const grad = ctx.createLinearGradient(0, 0, 0, GAME.CANVAS_HEIGHT);
            grad.addColorStop(0, '#2d0c4d');
            grad.addColorStop(0.5, '#5c1080');
            grad.addColorStop(1, '#150029');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, GAME.CANVAS_WIDTH, GAME.CANVAS_HEIGHT);

            ctx.save();
            ctx.textAlign = 'center';

            const bounce = Math.sin(animTimer * 0.08) * 5;

            ctx.font = '20px "Press Start 2P"';
            ctx.fillStyle = '#000000';
            ctx.fillText('MARIO RESCUED!', GAME.CANVAS_WIDTH / 2 + 2, 80 + bounce + 2);
            ctx.fillStyle = '#ffd700';
            ctx.fillText('MARIO RESCUED!', GAME.CANVAS_WIDTH / 2, 80 + bounce);

            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#ff69b4';
            ctx.fillText('"THANK YOU PRINCESS PEACH! YOU SAVED ME!"', GAME.CANVAS_WIDTH / 2, 120);

            // Peach and Mario dancing together
            const pSprite = Assets.getFrame('peach_idle', Math.floor(animTimer / 10));
            const mSprite = Assets.getFrame('mario_captured', Math.floor(animTimer / 15));
            if (pSprite) {
                ctx.drawImage(pSprite, GAME.CANVAS_WIDTH / 2 - 60, 160, 48, 72);
            }
            if (mSprite) {
                ctx.drawImage(mSprite, GAME.CANVAS_WIDTH / 2 + 10, 160, 48, 72);
            }

            // Big Heart between them
            const heartIco = Assets.getFrame('heart_item', Math.floor(animTimer / 8));
            if (heartIco) {
                ctx.drawImage(heartIco, GAME.CANVAS_WIDTH / 2 - 16, 170 + Math.sin(animTimer * 0.1) * 6, 32, 32);
            }

            // Stats box
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(160, 260, GAME.CANVAS_WIDTH - 320, 110);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect(160, 260, GAME.CANVAS_WIDTH - 320, 110);

            ctx.font = '9px "Press Start 2P"';
            ctx.fillStyle = '#00ffcc';
            ctx.fillText('★ MISSION REPORT ★', GAME.CANVAS_WIDTH / 2, 285);

            ctx.fillStyle = '#ffffff';
            ctx.fillText(`TOTAL SCORE: ${Player.state.score}`, GAME.CANVAS_WIDTH / 2, 310);
            ctx.fillText(`COINS AMASSED: ${Player.state.coins}`, GAME.CANVAS_WIDTH / 2, 330);
            ctx.fillText('ALL TECH HURDLES MASTERED!', GAME.CANVAS_WIDTH / 2, 350);

            if (Math.floor(animTimer / 25) % 2 === 0) {
                ctx.fillStyle = '#ffff00';
                ctx.font = '11px "Press Start 2P"';
                ctx.fillText('PRESS SPACE OR ENTER TO PLAY AGAIN', GAME.CANVAS_WIDTH / 2, 420);
            }

            ctx.restore();
        }
    };
})();

if (typeof window !== 'undefined') {
    window.Screens = Screens;
}
