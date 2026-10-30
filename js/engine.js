// ============================================================================
// PRINCESS SAVES MARIO — Game Engine & State Orchestration
// ============================================================================

var Engine = (() => {
    let currentState = STATE.LOADING;
    let canvas = null;
    let ctx = null;
    let lastTime = 0;
    let accumulator = 0;
    const timeStep = 1000 / GAME.TARGET_FPS;

    let stateTimer = 0;
    let pendingLevelIndex = 0;
    let currentDoorTarget = null;

    function init() {
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Mouse listeners for Tech Puzzles
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (GAME.CANVAS_WIDTH / rect.width);
            const y = (e.clientY - rect.top) * (GAME.CANVAS_HEIGHT / rect.height);

            if (currentState === STATE.PUZZLE) {
                Puzzles.onMouseDown(x, y);
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (GAME.CANVAS_WIDTH / rect.width);
            const y = (e.clientY - rect.top) * (GAME.CANVAS_HEIGHT / rect.height);

            if (currentState === STATE.PUZZLE) {
                Puzzles.onMouseMove(x, y);
            }
        });

        window.addEventListener('mouseup', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (GAME.CANVAS_WIDTH / rect.width);
            const y = (e.clientY - rect.top) * (GAME.CANVAS_HEIGHT / rect.height);

            if (currentState === STATE.PUZZLE) {
                Puzzles.onMouseUp(x, y);
            }
        });

        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (GAME.CANVAS_WIDTH / rect.width);
            const y = (e.clientY - rect.top) * (GAME.CANVAS_HEIGHT / rect.height);

            // Check bottom HUD pill click ([G] GESTURE CAM / [M] AUDIO)
            if (y >= GAME.CANVAS_HEIGHT - 30 && x <= 420) {
                if (x <= 210) {
                    if (typeof GestureVision !== 'undefined') GestureVision.toggle();
                } else {
                    Audio.toggle();
                }
                return;
            }

            if (currentState === STATE.PUZZLE) {
                Puzzles.onClick(x, y);
            } else if (currentState === STATE.TITLE) {
                Audio.init();
                startNewGame();
            } else if (currentState === STATE.GAME_OVER && stateTimer > 30) {
                startNewGame();
            } else if (currentState === STATE.VICTORY && stateTimer > 60) {
                switchState(STATE.TITLE);
            }
        });

        // Click anywhere on container to start from title
        const container = document.getElementById('game-container');
        if (container) {
            container.addEventListener('click', () => {
                if (currentState === STATE.TITLE) {
                    Audio.init();
                    startNewGame();
                }
            });
        }

        // Global shortcut keys (G for gesture cam, M for mute, P for pause)
        window.addEventListener('keydown', (e) => {
            Audio.init();

            if (e.code === 'KeyM') {
                Audio.toggle();
            }
            if (e.code === 'KeyG') {
                if (typeof GestureVision !== 'undefined') {
                    GestureVision.toggle();
                }
            }
            if (e.code === 'Escape' || e.code === 'KeyP') {
                if (currentState === STATE.PLAYING) {
                    currentState = STATE.PAUSED;
                } else if (currentState === STATE.PAUSED) {
                    currentState = STATE.PLAYING;
                }
            }
            if (currentState === STATE.TITLE) {
                if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ' || e.code === 'KeyX' || e.code === 'KeyA' || e.code === 'KeyD' || e.code === 'ArrowRight') {
                    startNewGame();
                }
            }
        });

        // Start title screen
        switchState(STATE.TITLE);
    }

    function switchState(newState) {
        currentState = newState;
        stateTimer = 0;
        if (typeof Input !== 'undefined' && Input.reset) {
            Input.reset();
        }

        if (newState === STATE.TITLE) {
            // reset everything
        } else if (newState === STATE.LEVEL_INTRO) {
            Audio.menuConfirm();
            HUD.resetTimer();
        } else if (newState === STATE.PLAYING) {
            // playing
        } else if (newState === STATE.LEVEL_CLEAR) {
            Audio.levelClear();
            Player.addScore(HUD.timeLeft * 50);
        } else if (newState === STATE.GAME_OVER) {
            Audio.gameOver();
        } else if (newState === STATE.VICTORY) {
            Audio.victory();
        }
    }

    function startNewGame() {
        pendingLevelIndex = 0;
        Player.fullReset(48, 300);
        loadLevel(0);
    }

    function loadLevel(index) {
        pendingLevelIndex = index;
        const spawnPos = Level.init(index);
        Player.reset(spawnPos.playerX, spawnPos.playerY);
        Player.state.checkpointX = spawnPos.playerX;
        Player.state.checkpointY = spawnPos.playerY;
        HUD.resetTimer();
        switchState(STATE.LEVEL_INTRO);
    }

    function update(dt) {
        Screens.update();
        stateTimer++;

        switch (currentState) {
            case STATE.TITLE:
                if (Input.isPressed(ACTION.JUMP) || Input.isPressed(ACTION.CONFIRM) || Input.isDown(ACTION.JUMP) || Input.isDown(ACTION.CONFIRM)) {
                    Audio.init();
                    startNewGame();
                }
                break;

            case STATE.LEVEL_INTRO:
                if (stateTimer > 90) { // 1.5 seconds intro
                    switchState(STATE.PLAYING);
                }
                break;

            case STATE.PAUSED:
                // Paused logic: wait for unpause
                break;

            case STATE.PLAYING:
                updatePlaying(dt);
                break;

            case STATE.PUZZLE:
                updatePuzzle();
                break;

            case STATE.DYING:
                Player.update(Level.currentLevel);
                Particles.update();
                if (stateTimer > 100) {
                    if (Player.state.lives > 0) {
                        // Respawn at checkpoint
                        Player.reset(Player.state.checkpointX, Player.state.checkpointY);
                        Camera.snapTo(Player.state.x, Player.state.y);
                        HUD.resetTimer();
                        switchState(STATE.PLAYING);
                    } else {
                        switchState(STATE.GAME_OVER);
                    }
                }
                break;

            case STATE.LEVEL_CLEAR:
                Particles.update();
                if (stateTimer > 120) {
                    if (pendingLevelIndex + 1 < Level.totalLevels) {
                        loadLevel(pendingLevelIndex + 1);
                    } else {
                        switchState(STATE.VICTORY);
                    }
                }
                break;

            case STATE.GAME_OVER:
                if (stateTimer > 60 && (Input.isPressed(ACTION.JUMP) || Input.isPressed(ACTION.CONFIRM))) {
                    startNewGame();
                }
                break;

            case STATE.VICTORY:
                Particles.victory(GAME.CANVAS_WIDTH);
                Particles.update();
                if (stateTimer > 90 && (Input.isPressed(ACTION.JUMP) || Input.isPressed(ACTION.CONFIRM))) {
                    switchState(STATE.TITLE);
                }
                break;
        }
    }

    function updatePlaying(dt) {
        const lvl = Level.currentLevel;
        if (!lvl) return;

        // 1. Time countdown
        HUD.update(dt);
        if (HUD.timeLeft <= 0) {
            // Time out!
            Player.die();
            currentState = STATE.DYING;
            stateTimer = 0;
            return;
        }

        // 2. Player Update
        Player.update(lvl);
        if (Player.state.isDying) {
            currentState = STATE.DYING;
            stateTimer = 0;
            return;
        }

        // 3. Camera follow
        Camera.follow(Player.state.x * GAME.SCALE, Player.state.y * GAME.SCALE);
        Camera.update();

        // 4. Entities & Projectiles
        Enemies.update(lvl);
        Projectiles.update(lvl);
        Items.update();
        Particles.update();

        // 5. Collisions
        Projectiles.checkEnemyCollisions(Enemies.enemies, Player);
        const enemyOutcome = Enemies.checkPlayerCollisions(Player);
        Items.checkPlayerCollisions(Player);

        // Check if Mario was rescued
        if (enemyOutcome === 'rescued') {
            switchState(STATE.VICTORY);
            return;
        }

        // 6. Checkpoint / Flag detection
        const px = Player.state.x;
        const py = Player.state.y;
        if (Level.getLevelDef(Level.levelIndex).puzzleAt > 0) {
            // Check Puzzle Gate Door
            const nearDoor = Level.checkPuzzleDoor(Player.state);
            if (nearDoor && !nearDoor.opened) {
                // Enter Puzzle Mode!
                currentDoorTarget = nearDoor;
                const pType = Level.currentLevel.puzzleType || 'cpu';
                Puzzles.init(pType);
                switchState(STATE.PUZZLE);
                return;
            }
        }

        // Check level end column
        const maxLevelX = (lvl.width - 4) * GAME.TILE_SIZE;
        if (px >= maxLevelX) {
            switchState(STATE.LEVEL_CLEAR);
        }
    }

    function updatePuzzle() {
        Puzzles.update();

        // Check if solved!
        if (Puzzles.isComplete()) {
            if (stateTimer > 90) { // Give moment for victory animation
                if (currentDoorTarget) {
                    Level.openDoor(currentDoorTarget);
                    currentDoorTarget = null;
                }
                Audio.puzzleComplete();
                HUD.addTime(15); // Reward +15s bonus time for solving tech puzzle!
                Player.addScore(1000);
                switchState(STATE.PLAYING);
            }
        } else {
            stateTimer = 0;
        }
    }

    function render() {
        ctx.clearRect(0, 0, GAME.CANVAS_WIDTH, GAME.CANVAS_HEIGHT);

        switch (currentState) {
            case STATE.TITLE:
                Screens.renderTitle(ctx);
                break;

            case STATE.LEVEL_INTRO:
                Screens.renderLevelIntro(ctx, pendingLevelIndex);
                break;

            case STATE.PLAYING:
            case STATE.PAUSED:
            case STATE.DYING:
                // Render Game World
                Level.render(ctx);
                Items.render(ctx);
                Enemies.render(ctx);
                Projectiles.render(ctx);
                Player.render(ctx);
                Particles.render(ctx);
                HUD.render(ctx);

                if (currentState === STATE.PAUSED) {
                    Screens.renderPause(ctx);
                }
                break;

            case STATE.PUZZLE:
                // Render the interactive mini-game
                Puzzles.render(ctx);
                break;

            case STATE.LEVEL_CLEAR:
                Level.render(ctx);
                Player.render(ctx);
                Particles.render(ctx);
                Screens.renderLevelClear(ctx);
                break;

            case STATE.GAME_OVER:
                Screens.renderGameOver(ctx);
                break;

            case STATE.VICTORY:
                Screens.renderVictory(ctx);
                Particles.render(ctx);
                break;
        }
    }

    // Main animation loop
    function loop(currentTime) {
        if (!lastTime) lastTime = currentTime;
        const elapsed = currentTime - lastTime;
        lastTime = currentTime;

        accumulator += elapsed;
        while (accumulator >= timeStep) {
            Input.update();
            update(GAME.DT);
            Input.postUpdate();
            accumulator -= timeStep;
        }

        render();
        requestAnimationFrame(loop);
    }

    return {
        get currentState() { return currentState; },
        init,
        start() {
            requestAnimationFrame(loop);
        },
        switchState
    };
})();

if (typeof window !== 'undefined') {
    window.Engine = Engine;
}
