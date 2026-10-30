// ============================================================================
// PRINCESS SAVES MARIO — Tech Puzzle Gates
// ============================================================================
// Three interactive puzzles that serve as gates between levels:
//   1. CPU Gate        – Drag instruction cycle phases into correct order
//   2. OS Scheduler    – Pick the optimal scheduling algorithm
//   3. DB Decryption   – Apply normal forms in sequence to clean a table
// ============================================================================

var Puzzles = {
    // ── shared state ──────────────────────────────────────────────────────
    currentPuzzle: null,
    puzzleData: {},
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    dragItem: null,
    completed: false,
    result: null,
    animFrame: 0,

    // celebration particles
    particles: [],

    // ── palette (tech greens / blues on dark) ─────────────────────────────
    PAL: {
        BG:          '#0a0a1a',
        BG2:         '#0f0f2e',
        PANEL:       '#141430',
        BORDER:      '#30ff30',
        BORDER_DIM:  '#107010',
        GREEN:       '#00ff00',
        GREEN_LIGHT: '#30ff30',
        BLUE:        '#3070ec',
        BLUE_LIGHT:  '#60a0ff',
        RED:         '#ff2040',
        RED_LIGHT:   '#ff6080',
        YELLOW:      '#ffd700',
        ORANGE:      '#ff9020',
        WHITE:       '#ffffff',
        GRAY:        '#888888',
        DARK_GRAY:   '#444444',
        CHIP_BG:     '#1a2a1a',
        CHIP_BORDER: '#40c040',
        SLOT_BG:     '#0c1c0c',
        SLOT_ACTIVE: '#204020',
        TEXT:        '#d0ffd0',
        TEXT_DIM:    '#508050',
    },

    // ── public API ────────────────────────────────────────────────────────
    init(puzzleName) {
        this.currentPuzzle = puzzleName;
        this.completed = false;
        this.result = null;
        this.animFrame = 0;
        this.particles = [];
        this.dragItem = null;
        this.mouseDown = false;
        this.puzzleData = {};

        switch (puzzleName) {
            case 'cpu':       this._initCPU(); break;
            case 'scheduler': this._initScheduler(); break;
            case 'database':  this._initDatabase(); break;
        }
    },

    update() {
        this.animFrame++;
        // update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.12;
            p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
        switch (this.currentPuzzle) {
            case 'cpu':       this._updateCPU(); break;
            case 'scheduler': this._updateScheduler(); break;
            case 'database':  this._updateDatabase(); break;
        }
    },

    render(ctx) {
        ctx.save();
        // background
        this._drawBackground(ctx);
        switch (this.currentPuzzle) {
            case 'cpu':       this._renderCPU(ctx); break;
            case 'scheduler': this._renderScheduler(ctx); break;
            case 'database':  this._renderDatabase(ctx); break;
        }
        // victory overlay
        if (this.completed) this._renderVictory(ctx);
        // particles on top
        this._renderParticles(ctx);
        ctx.restore();
    },

    onMouseDown(x, y) {
        this.mouseX = x; this.mouseY = y; this.mouseDown = true;
        if (this.completed) return;
        switch (this.currentPuzzle) {
            case 'cpu': this._mouseDownCPU(x, y); break;
        }
    },
    onMouseMove(x, y) {
        this.mouseX = x; this.mouseY = y;
        if (this.completed) return;
        switch (this.currentPuzzle) {
            case 'cpu': this._mouseMoveCPU(x, y); break;
        }
    },
    onMouseUp(x, y) {
        this.mouseX = x; this.mouseY = y; this.mouseDown = false;
        if (this.completed) return;
        switch (this.currentPuzzle) {
            case 'cpu': this._mouseUpCPU(x, y); break;
        }
    },
    onClick(x, y) {
        this.mouseX = x; this.mouseY = y;
        if (this.completed) return;
        switch (this.currentPuzzle) {
            case 'scheduler': this._clickScheduler(x, y); break;
            case 'database':  this._clickDatabase(x, y); break;
        }
    },

    isComplete() { return this.completed; },
    reset() { if (this.currentPuzzle) this.init(this.currentPuzzle); },
    getResult() { return this.result; },

    // ====================================================================
    //  SHARED DRAWING HELPERS
    // ====================================================================
    _drawBackground(ctx) {
        const W = GAME.CANVAS_WIDTH, H = GAME.CANVAS_HEIGHT;
        // dark gradient
        const grd = ctx.createLinearGradient(0, 0, 0, H);
        grd.addColorStop(0, this.PAL.BG);
        grd.addColorStop(1, this.PAL.BG2);
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);

        // circuit trace grid
        ctx.strokeStyle = 'rgba(0,255,0,0.04)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx < W; gx += 48) {
            ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
        }
        for (let gy = 0; gy < H; gy += 48) {
            ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
        }
        // random circuit dots
        ctx.fillStyle = 'rgba(0,255,0,0.06)';
        const seed = 42;
        for (let i = 0; i < 60; i++) {
            const px = ((i * 137 + seed) % W);
            const py = ((i * 97 + seed * 3) % H);
            ctx.fillRect(px, py, 3, 3);
        }

        // scanline effect
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        for (let sy = 0; sy < H; sy += 3) {
            ctx.fillRect(0, sy, W, 1);
        }

        // outer monitor bezel
        ctx.strokeStyle = this.PAL.BORDER_DIM;
        ctx.lineWidth = 4;
        ctx.strokeRect(8, 8, W - 16, H - 16);
        ctx.strokeStyle = this.PAL.BORDER;
        ctx.lineWidth = 2;
        ctx.strokeRect(12, 12, W - 24, H - 24);
    },

    _setFont(ctx, size) {
        ctx.font = `${size}px 'Press Start 2P', monospace`;
    },

    _drawTitle(ctx, title, subtitle) {
        this._setFont(ctx, 14);
        ctx.textAlign = 'center';
        ctx.fillStyle = this.PAL.GREEN;
        ctx.shadowColor = this.PAL.GREEN;
        ctx.shadowBlur = 8;
        ctx.fillText(title, GAME.CANVAS_WIDTH / 2, 44);
        ctx.shadowBlur = 0;
        if (subtitle) {
            this._setFont(ctx, 8);
            ctx.fillStyle = this.PAL.TEXT_DIM;
            ctx.fillText(subtitle, GAME.CANVAS_WIDTH / 2, 62);
        }
        ctx.textAlign = 'left';
    },

    _drawChipBlock(ctx, x, y, w, h, label, color, glow) {
        // chip background
        ctx.fillStyle = this.PAL.CHIP_BG;
        ctx.fillRect(x, y, w, h);
        // notch pins on left / right
        ctx.fillStyle = color || this.PAL.CHIP_BORDER;
        for (let py = y + 6; py < y + h - 4; py += 10) {
            ctx.fillRect(x - 4, py, 6, 4);
            ctx.fillRect(x + w - 2, py, 6, 4);
        }
        // border
        ctx.strokeStyle = color || this.PAL.CHIP_BORDER;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        // glow
        if (glow) {
            ctx.shadowColor = color || this.PAL.GREEN;
            ctx.shadowBlur = 12;
            ctx.strokeRect(x, y, w, h);
            ctx.shadowBlur = 0;
        }
        // label
        if (label) {
            this._setFont(ctx, 9);
            ctx.textAlign = 'center';
            ctx.fillStyle = this.PAL.WHITE;
            ctx.fillText(label, x + w / 2, y + h / 2 + 4);
            ctx.textAlign = 'left';
        }
    },

    _drawButton(ctx, x, y, w, h, label, hovered, active, disabled) {
        const bg = disabled ? '#1a1a2a' : (active ? this.PAL.GREEN : (hovered ? '#203820' : '#141828'));
        const border = disabled ? this.PAL.DARK_GRAY : (active ? this.PAL.GREEN : (hovered ? this.PAL.GREEN_LIGHT : this.PAL.BLUE));
        const textCol = disabled ? this.PAL.DARK_GRAY : (active ? '#000' : this.PAL.WHITE);

        ctx.fillStyle = bg;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = border;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        if (hovered && !disabled) {
            ctx.shadowColor = border;
            ctx.shadowBlur = 6;
            ctx.strokeRect(x, y, w, h);
            ctx.shadowBlur = 0;
        }

        this._setFont(ctx, 10);
        ctx.textAlign = 'center';
        ctx.fillStyle = textCol;
        ctx.fillText(label, x + w / 2, y + h / 2 + 4);
        ctx.textAlign = 'left';
    },

    _hitRect(mx, my, x, y, w, h) {
        return mx >= x && mx <= x + w && my >= y && my <= y + h;
    },

    _spawnCelebration(cx, cy) {
        const colors = [this.PAL.GREEN, this.PAL.YELLOW, this.PAL.BLUE_LIGHT, this.PAL.RED_LIGHT, this.PAL.ORANGE, '#ff00ff'];
        for (let i = 0; i < 80; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 5;
            this.particles.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 40 + Math.random() * 60 | 0,
                color: colors[Math.random() * colors.length | 0],
                size: 2 + Math.random() * 4 | 0,
            });
        }
    },

    _renderParticles(ctx) {
        for (const p of this.particles) {
            ctx.globalAlpha = Math.min(1, p.life / 20);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    },

    _renderVictory(ctx) {
        const W = GAME.CANVAS_WIDTH, H = GAME.CANVAS_HEIGHT;
        // pulsing overlay
        const alpha = 0.15 + 0.05 * Math.sin(this.animFrame * 0.08);
        ctx.fillStyle = `rgba(0,255,0,${alpha})`;
        ctx.fillRect(0, 0, W, H);

        this._setFont(ctx, 18);
        ctx.textAlign = 'center';
        ctx.fillStyle = this.PAL.GREEN;
        ctx.shadowColor = this.PAL.GREEN;
        ctx.shadowBlur = 20;
        const bounce = Math.sin(this.animFrame * 0.1) * 4;
        ctx.fillText('PUZZLE COMPLETE!', W / 2, H / 2 - 10 + bounce);
        ctx.shadowBlur = 0;

        this._setFont(ctx, 9);
        ctx.fillStyle = this.PAL.TEXT_DIM;
        ctx.fillText('The gate is opening...', W / 2, H / 2 + 20);
        ctx.textAlign = 'left';
    },

    // ====================================================================
    //  PUZZLE 1 — CPU GATE (Instruction Pipeline)
    // ====================================================================
    _initCPU() {
        const phases = ['FETCH', 'DECODE', 'EXECUTE', 'MEMORY', 'WRITE BACK'];
        // shuffle for the tray
        const shuffled = [...phases];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.random() * (i + 1) | 0;
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        // make sure it's actually shuffled
        if (shuffled.every((v, i) => v === phases[i])) {
            [shuffled[0], shuffled[4]] = [shuffled[4], shuffled[0]];
        }

        const slotW = 130, slotH = 54, slotGap = 12;
        const totalW = phases.length * (slotW + slotGap) - slotGap;
        const slotStartX = (GAME.CANVAS_WIDTH - totalW) / 2;
        const slotY = 120;
        const trayY = 340;

        // destination slots
        const slots = phases.map((_, i) => ({
            x: slotStartX + i * (slotW + slotGap),
            y: slotY,
            w: slotW,
            h: slotH,
            filled: null,          // label placed here
            correct: phases[i],
            flash: 0,             // flash timer for feedback
            flashColor: null,
        }));

        // draggable blocks in tray
        const blocks = shuffled.map((label, i) => ({
            label,
            homeX: slotStartX + i * (slotW + slotGap),
            homeY: trayY,
            x: slotStartX + i * (slotW + slotGap),
            y: trayY,
            w: slotW,
            h: slotH,
            placed: false,        // dropped in a slot?
            slotIndex: -1,
        }));

        this.puzzleData = {
            phases, slots, blocks,
            slotW, slotH, slotGap, slotStartX, slotY, trayY,
            bridgePower: 0,       // 0‒100 animation on solve
            checking: false,
        };
    },

    _updateCPU() {
        const d = this.puzzleData;
        // slot flash timers
        for (const s of d.slots) {
            if (s.flash > 0) s.flash--;
        }
        // bridge power‐up animation
        if (d.bridgePower > 0 && d.bridgePower < 100) {
            d.bridgePower += 1.5;
            if (d.bridgePower >= 100) {
                d.bridgePower = 100;
                this.completed = true;
                this.result = { puzzle: 'cpu', success: true };
                this._spawnCelebration(GAME.CANVAS_WIDTH / 2, GAME.CANVAS_HEIGHT / 2);
            }
        }
    },

    _renderCPU(ctx) {
        const d = this.puzzleData;
        const W = GAME.CANVAS_WIDTH, H = GAME.CANVAS_HEIGHT;

        this._drawTitle(ctx, '⚡ THE CPU GATE ⚡', 'Drag the instruction cycle phases into the correct order');

        // phase number labels above slots
        this._setFont(ctx, 7);
        ctx.fillStyle = this.PAL.TEXT_DIM;
        ctx.textAlign = 'center';
        for (let i = 0; i < d.slots.length; i++) {
            const s = d.slots[i];
            ctx.fillText(`PHASE ${i + 1}`, s.x + s.w / 2, s.y - 10);
        }

        // arrow connectors between slots
        ctx.strokeStyle = this.PAL.BORDER_DIM;
        ctx.lineWidth = 2;
        for (let i = 0; i < d.slots.length - 1; i++) {
            const s1 = d.slots[i], s2 = d.slots[i + 1];
            const ax = s1.x + s1.w + 2, ay = s1.y + s1.h / 2;
            const bx = s2.x - 2, by = s2.y + s2.h / 2;
            ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
            // arrowhead
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx - 6, by - 4);
            ctx.lineTo(bx - 6, by + 4);
            ctx.closePath();
            ctx.fillStyle = this.PAL.BORDER_DIM;
            ctx.fill();
        }

        // draw slots
        for (const s of d.slots) {
            let borderColor = this.PAL.BORDER_DIM;
            let bgColor = this.PAL.SLOT_BG;
            if (s.flash > 0) {
                borderColor = s.flashColor;
                bgColor = s.flashColor === this.PAL.GREEN ? '#0a2a0a' : '#2a0a0a';
            } else if (s.filled && s.filled === s.correct) {
                borderColor = this.PAL.GREEN;
                bgColor = '#0a2a0a';
            }
            ctx.fillStyle = bgColor;
            ctx.fillRect(s.x, s.y, s.w, s.h);
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(s.x, s.y, s.w, s.h);

            // dashed inner if empty
            if (!s.filled) {
                ctx.setLineDash([4, 4]);
                ctx.strokeStyle = this.PAL.TEXT_DIM;
                ctx.strokeRect(s.x + 6, s.y + 6, s.w - 12, s.h - 12);
                ctx.setLineDash([]);
            }
        }

        // "TRAY" label
        this._setFont(ctx, 7);
        ctx.fillStyle = this.PAL.TEXT_DIM;
        ctx.textAlign = 'center';
        ctx.fillText('─── AVAILABLE PHASES ───', W / 2, d.trayY - 16);

        // draw blocks (non‐dragged first, then dragged on top)
        const drawBlock = (b, ghost) => {
            if (b.placed && !ghost) return; // skip if placed in slot (slot shows it)
            const bx = b === this.dragItem ? this.mouseX - b.w / 2 : b.x;
            const by = b === this.dragItem ? this.mouseY - b.h / 2 : b.y;
            const isHeld = b === this.dragItem;
            this._drawChipBlock(ctx, bx, by, b.w, b.h, b.label,
                isHeld ? this.PAL.YELLOW : this.PAL.CHIP_BORDER, isHeld);
        };
        // non-dragged
        for (const b of d.blocks) {
            if (b !== this.dragItem) drawBlock(b);
        }
        // placed labels inside slots
        for (const s of d.slots) {
            if (s.filled) {
                const col = s.filled === s.correct ? this.PAL.GREEN : this.PAL.CHIP_BORDER;
                this._drawChipBlock(ctx, s.x + 4, s.y + 4, s.w - 8, s.h - 8, s.filled, col, s.filled === s.correct);
            }
        }
        // dragged on top
        if (this.dragItem) drawBlock(this.dragItem);

        // bridge power bar
        if (d.bridgePower > 0) {
            const barW = 400, barH = 20;
            const barX = (W - barW) / 2, barY = H - 60;
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(barX, barY, barW, barH);
            ctx.strokeStyle = this.PAL.GREEN;
            ctx.lineWidth = 2;
            ctx.strokeRect(barX, barY, barW, barH);
            const fill = barW * (d.bridgePower / 100);
            const barGrd = ctx.createLinearGradient(barX, barY, barX + fill, barY);
            barGrd.addColorStop(0, this.PAL.GREEN);
            barGrd.addColorStop(1, this.PAL.YELLOW);
            ctx.fillStyle = barGrd;
            ctx.fillRect(barX + 2, barY + 2, fill - 4, barH - 4);
            this._setFont(ctx, 8);
            ctx.textAlign = 'center';
            ctx.fillStyle = this.PAL.WHITE;
            ctx.fillText('POWERING UP BRIDGE...', W / 2, barY - 8);
        }

        // instructions at bottom
        if (d.bridgePower === 0) {
            this._setFont(ctx, 7);
            ctx.textAlign = 'center';
            ctx.fillStyle = this.PAL.TEXT_DIM;
            ctx.fillText('8085 Microprocessor Instruction Cycle', W / 2, H - 30);
        }
        ctx.textAlign = 'left';
    },

    _mouseDownCPU(x, y) {
        const d = this.puzzleData;
        if (d.bridgePower > 0) return;
        // check blocks in tray
        for (const b of d.blocks) {
            if (b.placed) continue;
            if (this._hitRect(x, y, b.x, b.y, b.w, b.h)) {
                this.dragItem = b;
                return;
            }
        }
        // check blocks placed in slots (to allow removing)
        for (let i = 0; i < d.slots.length; i++) {
            const s = d.slots[i];
            if (s.filled && this._hitRect(x, y, s.x, s.y, s.w, s.h)) {
                // find the block and unplace it
                const block = d.blocks.find(b => b.label === s.filled && b.slotIndex === i);
                if (block) {
                    block.placed = false;
                    block.slotIndex = -1;
                    block.x = block.homeX;
                    block.y = block.homeY;
                    s.filled = null;
                    this.dragItem = block;
                }
                return;
            }
        }
    },

    _mouseMoveCPU(x, y) {
        // dragging is handled in render via mouseX/mouseY
    },

    _mouseUpCPU(x, y) {
        const d = this.puzzleData;
        if (!this.dragItem) return;
        const b = this.dragItem;
        this.dragItem = null;

        // check if dropped on a slot
        const dropX = x - b.w / 2;
        const dropY = y - b.h / 2;
        for (let i = 0; i < d.slots.length; i++) {
            const s = d.slots[i];
            if (s.filled) continue;
            if (this._hitRect(x, y, s.x, s.y, s.w, s.h)) {
                // place it
                s.filled = b.label;
                b.placed = true;
                b.slotIndex = i;
                // feedback flash
                if (b.label === s.correct) {
                    s.flash = 30;
                    s.flashColor = this.PAL.GREEN;
                    if (window.Audio) Audio.puzzleCorrect();
                } else {
                    s.flash = 30;
                    s.flashColor = this.PAL.RED;
                    if (window.Audio) Audio.puzzleWrong();
                }
                // check all filled
                this._checkCPUComplete();
                return;
            }
        }
        // snap back to home
        b.x = b.homeX;
        b.y = b.homeY;
    },

    _checkCPUComplete() {
        const d = this.puzzleData;
        if (d.slots.every(s => s.filled)) {
            if (d.slots.every(s => s.filled === s.correct)) {
                // all correct — start bridge power animation
                d.bridgePower = 1;
            } else {
                // some wrong — flash red on incorrect, then reset after delay
                for (const s of d.slots) {
                    if (s.filled !== s.correct) {
                        s.flash = 50;
                        s.flashColor = this.PAL.RED;
                    } else {
                        s.flash = 50;
                        s.flashColor = this.PAL.GREEN;
                    }
                }
                // auto-clear wrong ones after a beat
                setTimeout(() => {
                    for (let i = 0; i < d.slots.length; i++) {
                        const s = d.slots[i];
                        if (s.filled !== s.correct) {
                            const block = d.blocks.find(bl => bl.label === s.filled && bl.slotIndex === i);
                            if (block) {
                                block.placed = false;
                                block.slotIndex = -1;
                                block.x = block.homeX;
                                block.y = block.homeY;
                            }
                            s.filled = null;
                        }
                    }
                }, 800);
            }
        }
    },

    // ====================================================================
    //  PUZZLE 2 — OS SCHEDULER
    // ====================================================================
    _initScheduler() {
        // Generate a random process set where one algorithm is clearly best
        const scenarioPool = this._generateSchedulerScenarios();
        const scenario = scenarioPool[Math.random() * scenarioPool.length | 0];

        const btnW = 180, btnH = 48, btnGap = 30;
        const totalBtnW = 3 * btnW + 2 * btnGap;
        const btnStartX = (GAME.CANVAS_WIDTH - totalBtnW) / 2;
        const btnY = 400;

        const buttons = ['FCFS', 'SJF', 'PRIORITY'].map((label, i) => ({
            label,
            x: btnStartX + i * (btnW + btnGap),
            y: btnY,
            w: btnW,
            h: btnH,
        }));

        this.puzzleData = {
            processes: scenario.processes,
            correct: scenario.correct,
            deadline: scenario.deadline,
            buttons,
            selected: null,
            simulating: false,
            simTimer: 0,
            simDuration: 0,
            simGantt: [],
            simResult: null,     // 'pass' | 'fail'
            simAlgo: null,
            flashTimer: 0,
            conveyorOffset: 0,
        };
    },

    _generateSchedulerScenarios() {
        // Multiple scenarios; each has a set of processes and a correct answer
        return [
            {
                processes: [
                    { name: 'init.d',   burst: 2, priority: 3, color: '#ff6060' },
                    { name: 'kernel',   burst: 8, priority: 1, color: '#60ff60' },
                    { name: 'shell',    burst: 4, priority: 2, color: '#6060ff' },
                    { name: 'daemon',   burst: 1, priority: 4, color: '#ffff60' },
                    { name: 'cron',     burst: 3, priority: 5, color: '#ff60ff' },
                ],
                correct: 'SJF',
                deadline: 22,
                // SJF order: daemon(1), init.d(2), cron(3), shell(4), kernel(8) → avg wait = (0+1+3+6+10)/5 = 4
                // FCFS order: as listed → avg wait = (0+2+10+14+15)/5 = 8.2
                // Priority (lower=higher): kernel(1), shell(2), init.d(3), daemon(4), cron(5) → avg wait = (0+8+12+14+15)/5 = 9.8
            },
            {
                processes: [
                    { name: 'httpd',    burst: 6, priority: 1, color: '#ff6060' },
                    { name: 'sshd',     burst: 3, priority: 3, color: '#60ff60' },
                    { name: 'mysqld',   burst: 7, priority: 2, color: '#6060ff' },
                    { name: 'nginx',    burst: 5, priority: 4, color: '#ffff60' },
                ],
                correct: 'PRIORITY',
                deadline: 24,
                // Priority (1=highest): httpd(1,6), mysqld(2,7), sshd(3,3), nginx(4,5) → avg wait=(0+6+13+16)/4=8.75
                // SJF: sshd(3), nginx(5), httpd(6), mysqld(7) → avg wait=(0+3+8+14)/4=6.25
                // But we make deadline tight so only priority-based ordering finishes the critical task in time
            },
            {
                processes: [
                    { name: 'player',   burst: 3, priority: 2, color: '#ff6060' },
                    { name: 'render',   burst: 5, priority: 1, color: '#60ff60' },
                    { name: 'audio',    burst: 2, priority: 3, color: '#6060ff' },
                    { name: 'network',  burst: 7, priority: 4, color: '#ffff60' },
                    { name: 'input',    burst: 1, priority: 5, color: '#ff60ff' },
                    { name: 'physics',  burst: 4, priority: 6, color: '#60ffff' },
                ],
                correct: 'SJF',
                deadline: 26,
            },
            {
                processes: [
                    { name: 'boot',     burst: 4, priority: 1, color: '#ff6060' },
                    { name: 'drivers',  burst: 3, priority: 2, color: '#60ff60' },
                    { name: 'services', burst: 5, priority: 3, color: '#6060ff' },
                    { name: 'login',    burst: 2, priority: 4, color: '#ffff60' },
                ],
                correct: 'FCFS',
                deadline: 18,
                // FCFS happens to match the optimal arrival order here
            },
        ];
    },

    _computeSchedule(processes, algo) {
        let ordered;
        switch (algo) {
            case 'FCFS':
                ordered = [...processes];
                break;
            case 'SJF':
                ordered = [...processes].sort((a, b) => a.burst - b.burst);
                break;
            case 'PRIORITY':
                ordered = [...processes].sort((a, b) => a.priority - b.priority);
                break;
        }
        let time = 0;
        const gantt = [];
        let totalWait = 0;
        for (const p of ordered) {
            gantt.push({ name: p.name, start: time, end: time + p.burst, color: p.color, burst: p.burst });
            totalWait += time;
            time += p.burst;
        }
        return { gantt, totalTime: time, avgWait: totalWait / ordered.length };
    },

    _updateScheduler() {
        const d = this.puzzleData;
        d.conveyorOffset = (d.conveyorOffset + 0.5) % 24;

        if (d.simulating) {
            d.simTimer++;
            // simulation runs for ~3 seconds (180 frames)
            if (d.simTimer >= 180) {
                d.simulating = false;
                if (d.simAlgo === d.correct) {
                    d.simResult = 'pass';
                    this.completed = true;
                    this.result = { puzzle: 'scheduler', success: true };
                    this._spawnCelebration(GAME.CANVAS_WIDTH / 2, 300);
                    if (window.Audio) Audio.puzzleCorrect();
                } else {
                    d.simResult = 'fail';
                    d.flashTimer = 90;
                    if (window.Audio) Audio.puzzleWrong();
                }
            }
        }
        if (d.flashTimer > 0) {
            d.flashTimer--;
            if (d.flashTimer === 0) {
                d.selected = null;
                d.simResult = null;
                d.simAlgo = null;
            }
        }
    },

    _renderScheduler(ctx) {
        const d = this.puzzleData;
        const W = GAME.CANVAS_WIDTH, H = GAME.CANVAS_HEIGHT;

        this._drawTitle(ctx, '⚙ THE OS SCHEDULER ⚙', 'Select the algorithm that finishes all processes before the deadline');

        // ── Process Queue (conveyor belt visual) ──
        const queueY = 90, queueH = 100;
        // conveyor belt background
        ctx.fillStyle = '#0c0c1c';
        ctx.fillRect(30, queueY, W - 60, queueH);
        ctx.strokeStyle = this.PAL.BORDER_DIM;
        ctx.lineWidth = 2;
        ctx.strokeRect(30, queueY, W - 60, queueH);

        // conveyor belt stripes
        ctx.fillStyle = 'rgba(48,112,236,0.15)';
        for (let cx = -24 + (d.conveyorOffset | 0); cx < W - 60; cx += 24) {
            ctx.fillRect(30 + cx, queueY, 12, queueH);
        }

        // process cards on the belt
        const cardW = 110, cardH = 80, cardGap = 14;
        const totalCardW = d.processes.length * (cardW + cardGap) - cardGap;
        const cardStartX = (W - totalCardW) / 2;

        for (let i = 0; i < d.processes.length; i++) {
            const p = d.processes[i];
            const cx = cardStartX + i * (cardW + cardGap);
            const cy = queueY + (queueH - cardH) / 2;

            ctx.fillStyle = '#0a0a1a';
            ctx.fillRect(cx, cy, cardW, cardH);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(cx, cy, cardW, cardH);

            // process name
            this._setFont(ctx, 7);
            ctx.textAlign = 'center';
            ctx.fillStyle = p.color;
            ctx.fillText(p.name, cx + cardW / 2, cy + 18);

            // burst time
            this._setFont(ctx, 6);
            ctx.fillStyle = this.PAL.TEXT;
            ctx.fillText(`Burst: ${p.burst}`, cx + cardW / 2, cy + 36);

            // priority
            ctx.fillStyle = this.PAL.TEXT_DIM;
            ctx.fillText(`Prio: ${p.priority}`, cx + cardW / 2, cy + 52);

            // small burst bar
            const barMaxW = cardW - 20;
            const barFill = (p.burst / 10) * barMaxW;
            ctx.fillStyle = '#1a1a2a';
            ctx.fillRect(cx + 10, cy + 60, barMaxW, 8);
            ctx.fillStyle = p.color;
            ctx.fillRect(cx + 10, cy + 60, barFill, 8);
        }
        ctx.textAlign = 'left';

        // deadline display
        this._setFont(ctx, 8);
        ctx.textAlign = 'center';
        ctx.fillStyle = this.PAL.YELLOW;
        ctx.fillText(`⏱ DEADLINE: ${d.deadline} cycles`, W / 2, queueY + queueH + 24);

        // ── Gantt Chart Simulation Area ──
        const ganttY = 220, ganttH = 60;
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(40, ganttY, W - 80, ganttH);
        ctx.strokeStyle = this.PAL.DARK_GRAY;
        ctx.lineWidth = 1;
        ctx.strokeRect(40, ganttY, W - 80, ganttH);

        if (d.simAlgo) {
            const schedule = this._computeSchedule(d.processes, d.simAlgo);
            const ganttW = W - 100;
            const pixelsPerUnit = ganttW / Math.max(schedule.totalTime, d.deadline);
            const progress = d.simulating ? Math.min(1, d.simTimer / 150) : 1;
            const visibleTime = progress * schedule.totalTime;

            // deadline marker
            const dlX = 50 + d.deadline * pixelsPerUnit;
            ctx.strokeStyle = this.PAL.RED;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.moveTo(dlX, ganttY - 5); ctx.lineTo(dlX, ganttY + ganttH + 5); ctx.stroke();
            ctx.setLineDash([]);
            this._setFont(ctx, 6);
            ctx.fillStyle = this.PAL.RED;
            ctx.textAlign = 'center';
            ctx.fillText('DEADLINE', dlX, ganttY - 8);

            // gantt bars
            for (const g of schedule.gantt) {
                if (g.start > visibleTime) continue;
                const drawEnd = Math.min(g.end, visibleTime);
                const bx = 50 + g.start * pixelsPerUnit;
                const bw = (drawEnd - g.start) * pixelsPerUnit;
                ctx.fillStyle = g.color;
                ctx.globalAlpha = 0.7;
                ctx.fillRect(bx, ganttY + 8, bw, ganttH - 16);
                ctx.globalAlpha = 1;
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.strokeRect(bx, ganttY + 8, bw, ganttH - 16);
                // label if wide enough
                if (bw > 40) {
                    this._setFont(ctx, 6);
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#000';
                    ctx.fillText(g.name, bx + bw / 2, ganttY + ganttH / 2 + 3);
                }
            }

            // time markers
            this._setFont(ctx, 5);
            ctx.fillStyle = this.PAL.TEXT_DIM;
            ctx.textAlign = 'center';
            for (let t = 0; t <= Math.max(schedule.totalTime, d.deadline); t += 2) {
                const tx = 50 + t * pixelsPerUnit;
                ctx.fillText(t.toString(), tx, ganttY + ganttH + 14);
            }

            // algorithm name label
            this._setFont(ctx, 9);
            ctx.textAlign = 'left';
            ctx.fillStyle = this.PAL.BLUE_LIGHT;
            ctx.fillText(`Algorithm: ${d.simAlgo}`, 50, ganttY - 10);

            // avg wait
            if (!d.simulating) {
                ctx.textAlign = 'right';
                ctx.fillStyle = this.PAL.TEXT;
                this._setFont(ctx, 7);
                ctx.fillText(`Avg Wait: ${schedule.avgWait.toFixed(1)} | Total: ${schedule.totalTime}`, W - 50, ganttY - 10);
            }
        } else {
            // empty state
            this._setFont(ctx, 8);
            ctx.textAlign = 'center';
            ctx.fillStyle = this.PAL.TEXT_DIM;
            ctx.fillText('Select an algorithm to simulate...', W / 2, ganttY + ganttH / 2 + 3);
        }
        ctx.textAlign = 'left';

        // ── Result overlay ──
        if (d.simResult === 'pass') {
            this._setFont(ctx, 10);
            ctx.textAlign = 'center';
            ctx.fillStyle = this.PAL.GREEN;
            ctx.shadowColor = this.PAL.GREEN;
            ctx.shadowBlur = 10;
            ctx.fillText('✓ ALL PROCESSES COMPLETED IN TIME!', W / 2, ganttY + ganttH + 40);
            ctx.shadowBlur = 0;
        } else if (d.simResult === 'fail') {
            this._setFont(ctx, 10);
            ctx.textAlign = 'center';
            ctx.fillStyle = this.PAL.RED;
            const blink = (this.animFrame % 20 < 10);
            if (blink) {
                ctx.shadowColor = this.PAL.RED;
                ctx.shadowBlur = 10;
                ctx.fillText('✗ DEADLINE EXCEEDED! TRY AGAIN', W / 2, ganttY + ganttH + 40);
                ctx.shadowBlur = 0;
            }
        }

        // ── Algorithm Buttons ──
        for (const btn of d.buttons) {
            const hovered = this._hitRect(this.mouseX, this.mouseY, btn.x, btn.y, btn.w, btn.h);
            const active = d.simAlgo === btn.label && d.simResult === 'pass';
            const disabled = d.simulating;
            this._drawButton(ctx, btn.x, btn.y, btn.w, btn.h, btn.label, hovered, active, disabled);
        }

        // hints below buttons
        this._setFont(ctx, 6);
        ctx.textAlign = 'center';
        ctx.fillStyle = this.PAL.TEXT_DIM;
        ctx.fillText('FCFS = First Come First Served  |  SJF = Shortest Job First  |  PRIORITY = By Priority Number', W / 2, d.buttons[0].y + d.buttons[0].h + 18);
        ctx.textAlign = 'left';
    },

    _clickScheduler(x, y) {
        const d = this.puzzleData;
        if (d.simulating || d.simResult === 'pass') return;
        for (const btn of d.buttons) {
            if (this._hitRect(x, y, btn.x, btn.y, btn.w, btn.h)) {
                d.selected = btn.label;
                d.simAlgo = btn.label;
                d.simulating = true;
                d.simTimer = 0;
                d.simResult = null;
                d.flashTimer = 0;
                return;
            }
        }
    },

    // ====================================================================
    //  PUZZLE 3 — DATABASE DECRYPTION
    // ====================================================================
    _initDatabase() {
        // The "corrupted" table data
        const rawTable = {
            columns: ['HeroID', 'HeroName', 'World', 'WorldTheme', 'Level', 'Items', 'Location'],
            rows: [
                ['H01', 'Peach',   'W1', 'Grassland',  '1-1', 'Star,Mushroom', 'Castle 7,3'],
                ['H01', 'Peach',   'W1', 'Grassland',  '1-2', 'FireFlower',    'Dungeon 2,5'],
                ['H02', 'Toad',    'W2', 'Desert',     '2-1', 'Star,Cape',     'Pyramid 1,8'],
                ['H01', 'Peach',   'W3', 'Ice',        '3-1', 'Mushroom',      'Glacier 4,2'],
                ['H02', 'Toad',    'W2', 'Desert',     '2-2', 'Mushroom,Star', 'Oasis 6,1'],
            ],
        };

        // Stage progression:
        // UNF (start) → 1NF → 2NF → 3NF
        const stages = {
            UNF: {
                label: 'Unnormalized',
                columns: rawTable.columns,
                rows: rawTable.rows,
                issues: ['Repeating groups in Items column', 'Multi-value attributes'],
            },
            '1NF': {
                label: '1st Normal Form',
                columns: ['HeroID', 'HeroName', 'World', 'WorldTheme', 'Level', 'Item', 'Location'],
                rows: [
                    ['H01', 'Peach', 'W1', 'Grassland', '1-1', 'Star',       'Castle 7,3'],
                    ['H01', 'Peach', 'W1', 'Grassland', '1-1', 'Mushroom',   'Castle 7,3'],
                    ['H01', 'Peach', 'W1', 'Grassland', '1-2', 'FireFlower', 'Dungeon 2,5'],
                    ['H02', 'Toad',  'W2', 'Desert',    '2-1', 'Star',       'Pyramid 1,8'],
                    ['H02', 'Toad',  'W2', 'Desert',    '2-1', 'Cape',       'Pyramid 1,8'],
                    ['H01', 'Peach', 'W3', 'Ice',       '3-1', 'Mushroom',   'Glacier 4,2'],
                    ['H02', 'Toad',  'W2', 'Desert',    '2-2', 'Mushroom',   'Oasis 6,1'],
                    ['H02', 'Toad',  'W2', 'Desert',    '2-2', 'Star',       'Oasis 6,1'],
                ],
                explanation: 'Repeating groups eliminated → atomic values only',
            },
            '2NF': {
                label: '2nd Normal Form',
                tables: [
                    {
                        name: 'Heroes',
                        columns: ['HeroID', 'HeroName'],
                        rows: [['H01', 'Peach'], ['H02', 'Toad']],
                    },
                    {
                        name: 'Levels',
                        columns: ['Level', 'World', 'WorldTheme', 'Location'],
                        rows: [
                            ['1-1', 'W1', 'Grassland', 'Castle 7,3'],
                            ['1-2', 'W1', 'Grassland', 'Dungeon 2,5'],
                            ['2-1', 'W2', 'Desert',    'Pyramid 1,8'],
                            ['3-1', 'W3', 'Ice',       'Glacier 4,2'],
                            ['2-2', 'W2', 'Desert',    'Oasis 6,1'],
                        ],
                    },
                    {
                        name: 'HeroItems',
                        columns: ['HeroID', 'Level', 'Item'],
                        rows: [
                            ['H01', '1-1', 'Star'], ['H01', '1-1', 'Mushroom'],
                            ['H01', '1-2', 'FireFlower'],
                            ['H02', '2-1', 'Star'], ['H02', '2-1', 'Cape'],
                            ['H01', '3-1', 'Mushroom'],
                            ['H02', '2-2', 'Mushroom'], ['H02', '2-2', 'Star'],
                        ],
                    },
                ],
                explanation: 'Partial dependencies removed → separate tables',
            },
            '3NF': {
                label: '3rd Normal Form',
                tables: [
                    {
                        name: 'Heroes',
                        columns: ['HeroID', 'HeroName'],
                        rows: [['H01', 'Peach'], ['H02', 'Toad']],
                    },
                    {
                        name: 'Worlds',
                        columns: ['World', 'WorldTheme'],
                        rows: [['W1', 'Grassland'], ['W2', 'Desert'], ['W3', 'Ice']],
                    },
                    {
                        name: 'Levels',
                        columns: ['Level', 'World', 'Location'],
                        rows: [
                            ['1-1', 'W1', 'Castle 7,3'],
                            ['1-2', 'W1', 'Dungeon 2,5'],
                            ['2-1', 'W2', 'Pyramid 1,8'],
                            ['3-1', 'W3', 'Glacier 4,2'],
                            ['2-2', 'W2', 'Oasis 6,1'],
                        ],
                    },
                    {
                        name: 'HeroItems',
                        columns: ['HeroID', 'Level', 'Item'],
                        rows: [
                            ['H01', '1-1', 'Star'], ['H01', '1-1', 'Mushroom'],
                            ['H01', '1-2', 'FireFlower'],
                            ['H02', '2-1', 'Star'], ['H02', '2-1', 'Cape'],
                            ['H01', '3-1', 'Mushroom'],
                            ['H02', '2-2', 'Mushroom'], ['H02', '2-2', 'Star'],
                        ],
                    },
                ],
                explanation: 'Transitive dependencies removed → Mario is at Castle 7,3!',
            },
        };

        const nfOrder = ['1NF', '2NF', '3NF'];
        const btnW = 140, btnH = 44, btnGap = 30;
        const totalBtnW = 3 * btnW + 2 * btnGap;
        const btnStartX = (GAME.CANVAS_WIDTH - totalBtnW) / 2;
        const btnY = 422;

        const buttons = nfOrder.map((label, i) => ({
            label,
            x: btnStartX + i * (btnW + btnGap),
            y: btnY,
            w: btnW,
            h: btnH,
        }));

        this.puzzleData = {
            stages,
            nfOrder,
            currentStage: 'UNF',
            nextExpected: 0,     // index into nfOrder
            buttons,
            flashTimer: 0,
            flashColor: null,
            transitionAnim: 0,   // 0 = idle, >0 = transitioning
            transitionTo: null,
            explanation: null,
            explanationTimer: 0,
            scrollOffset: 0,
        };
    },

    _updateDatabase() {
        const d = this.puzzleData;
        if (d.flashTimer > 0) d.flashTimer--;
        if (d.transitionAnim > 0) {
            d.transitionAnim--;
            if (d.transitionAnim === 0 && d.transitionTo) {
                d.currentStage = d.transitionTo;
                d.transitionTo = null;
                // check if puzzle complete
                if (d.currentStage === '3NF') {
                    this.completed = true;
                    this.result = { puzzle: 'database', success: true };
                    this._spawnCelebration(GAME.CANVAS_WIDTH / 2, 250);
                }
            }
        }
        if (d.explanationTimer > 0) d.explanationTimer--;
    },

    _renderDatabase(ctx) {
        const d = this.puzzleData;
        const W = GAME.CANVAS_WIDTH, H = GAME.CANVAS_HEIGHT;

        this._drawTitle(ctx, '🗄 DATABASE DECRYPTION 🗄', 'Apply normal forms IN ORDER to decode Mario\'s location');

        // current stage label
        const stage = d.stages[d.currentStage];
        this._setFont(ctx, 9);
        ctx.textAlign = 'center';
        ctx.fillStyle = this.PAL.YELLOW;
        ctx.fillText(`Current: ${stage.label}`, W / 2, 82);

        // progress dots
        const dotLabels = ['UNF', '1NF', '2NF', '3NF'];
        const dotY = 96;
        const dotGap = 60;
        const dotStartX = W / 2 - (dotLabels.length - 1) * dotGap / 2;
        this._setFont(ctx, 6);
        for (let i = 0; i < dotLabels.length; i++) {
            const dx = dotStartX + i * dotGap;
            const current = dotLabels.indexOf(d.currentStage);
            const col = i <= current ? this.PAL.GREEN : this.PAL.DARK_GRAY;
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(dx, dotY, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = i <= current ? this.PAL.WHITE : this.PAL.TEXT_DIM;
            ctx.textAlign = 'center';
            ctx.fillText(dotLabels[i], dx, dotY + 16);
            // connector line
            if (i < dotLabels.length - 1) {
                ctx.strokeStyle = i < current ? this.PAL.GREEN : this.PAL.DARK_GRAY;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(dx + 8, dotY);
                ctx.lineTo(dx + dotGap - 8, dotY);
                ctx.stroke();
            }
        }

        // transition animation flash
        if (d.transitionAnim > 0) {
            const alpha = 0.3 * (d.transitionAnim / 30);
            ctx.fillStyle = `rgba(0,255,0,${alpha})`;
            ctx.fillRect(30, 115, W - 60, 290);
        }

        // render table(s)
        const tableArea = { x: 30, y: 120, w: W - 60, h: 290 };

        if (stage.tables) {
            // multiple tables (2NF, 3NF)
            this._renderMultiTable(ctx, stage.tables, tableArea);
        } else {
            // single table (UNF, 1NF)
            this._renderSingleTable(ctx, stage.columns, stage.rows, tableArea, null);
        }

        // issues callout
        if (stage.issues) {
            this._setFont(ctx, 6);
            ctx.textAlign = 'left';
            ctx.fillStyle = this.PAL.ORANGE;
            for (let i = 0; i < stage.issues.length; i++) {
                ctx.fillText(`⚠ ${stage.issues[i]}`, 40, tableArea.y + tableArea.h + 18 + i * 14);
            }
        }

        // explanation popup
        if (d.explanationTimer > 0 && d.explanation) {
            const alpha = Math.min(1, d.explanationTimer / 20);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#002200';
            ctx.fillRect(W / 2 - 250, tableArea.y + tableArea.h - 30, 500, 28);
            ctx.strokeStyle = this.PAL.GREEN;
            ctx.lineWidth = 1;
            ctx.strokeRect(W / 2 - 250, tableArea.y + tableArea.h - 30, 500, 28);
            this._setFont(ctx, 7);
            ctx.textAlign = 'center';
            ctx.fillStyle = this.PAL.GREEN;
            ctx.fillText(d.explanation, W / 2, tableArea.y + tableArea.h - 12);
            ctx.globalAlpha = 1;
        }

        // error flash
        if (d.flashTimer > 0 && d.flashColor === this.PAL.RED) {
            const alpha = 0.2 * (d.flashTimer / 40);
            ctx.fillStyle = `rgba(255,0,0,${alpha})`;
            ctx.fillRect(0, 0, W, H);
        }

        // NF buttons
        for (let i = 0; i < d.buttons.length; i++) {
            const btn = d.buttons[i];
            const hovered = this._hitRect(this.mouseX, this.mouseY, btn.x, btn.y, btn.w, btn.h);
            const alreadyDone = d.nfOrder.indexOf(d.currentStage) >= i ||
                               (d.currentStage === '3NF');
            const isNext = (i === d.nextExpected && d.currentStage !== '3NF');
            let borderCol = this.PAL.DARK_GRAY;
            if (alreadyDone) borderCol = this.PAL.GREEN;
            else if (isNext && hovered) borderCol = this.PAL.YELLOW;

            this._drawButton(ctx, btn.x, btn.y, btn.w, btn.h, btn.label,
                hovered && !alreadyDone,
                alreadyDone,
                false);
        }

        // hint
        this._setFont(ctx, 6);
        ctx.textAlign = 'center';
        ctx.fillStyle = this.PAL.TEXT_DIM;
        if (d.currentStage !== '3NF') {
            ctx.fillText('Apply normalization steps in order: 1NF → 2NF → 3NF', W / 2, H - 12);
        }
        ctx.textAlign = 'left';
    },

    _renderSingleTable(ctx, columns, rows, area, tableName) {
        const colW = (area.w) / columns.length;
        const rowH = 18;
        const maxRows = Math.min(rows.length, Math.floor((area.h - 30) / rowH));
        const startX = area.x;
        let sy = area.y;

        // table name
        if (tableName) {
            this._setFont(ctx, 7);
            ctx.fillStyle = this.PAL.BLUE_LIGHT;
            ctx.textAlign = 'left';
            ctx.fillText(`📋 ${tableName}`, startX + 4, sy + 10);
            sy += 16;
        }

        // header row
        ctx.fillStyle = '#162040';
        ctx.fillRect(startX, sy, area.w, rowH + 4);
        ctx.strokeStyle = this.PAL.BLUE;
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, sy, area.w, rowH + 4);

        this._setFont(ctx, 6);
        ctx.fillStyle = this.PAL.BLUE_LIGHT;
        ctx.textAlign = 'center';
        for (let c = 0; c < columns.length; c++) {
            ctx.fillText(columns[c], startX + c * colW + colW / 2, sy + 14);
        }
        sy += rowH + 6;

        // data rows
        for (let r = 0; r < maxRows; r++) {
            const rowColor = r % 2 === 0 ? '#0c0c18' : '#10101f';
            ctx.fillStyle = rowColor;
            ctx.fillRect(startX, sy, area.w, rowH);
            ctx.strokeStyle = '#1a1a30';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(startX, sy, area.w, rowH);

            this._setFont(ctx, 5);
            ctx.fillStyle = this.PAL.TEXT;
            ctx.textAlign = 'center';
            for (let c = 0; c < columns.length; c++) {
                const val = rows[r][c] || '';
                // highlight anomalies
                if (val.includes(',') && columns[c] === 'Items') {
                    ctx.fillStyle = this.PAL.RED_LIGHT;
                } else {
                    ctx.fillStyle = this.PAL.TEXT;
                }
                ctx.fillText(val, startX + c * colW + colW / 2, sy + 13);
            }
            sy += rowH;
        }
        ctx.textAlign = 'left';
        return sy;
    },

    _renderMultiTable(ctx, tables, area) {
        // distribute tables across available space
        const tableCount = tables.length;
        const gap = 10;
        // try to lay out 2 per row if more than 2
        const cols = tableCount <= 2 ? tableCount : 2;
        const rowCount = Math.ceil(tableCount / cols);
        const tblW = (area.w - (cols - 1) * gap) / cols;
        const tblH = (area.h - (rowCount - 1) * gap) / rowCount;

        for (let i = 0; i < tableCount; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const tx = area.x + col * (tblW + gap);
            const ty = area.y + row * (tblH + gap);
            const t = tables[i];
            this._renderSingleTable(ctx, t.columns, t.rows,
                { x: tx, y: ty, w: tblW, h: tblH }, t.name);
        }
    },

    _clickDatabase(x, y) {
        const d = this.puzzleData;
        if (d.transitionAnim > 0 || d.currentStage === '3NF') return;

        for (let i = 0; i < d.buttons.length; i++) {
            const btn = d.buttons[i];
            if (!this._hitRect(x, y, btn.x, btn.y, btn.w, btn.h)) continue;

            if (i === d.nextExpected) {
                // correct! transition to next stage
                const nextStage = d.nfOrder[i];
                d.transitionTo = nextStage;
                d.transitionAnim = 30;
                d.nextExpected++;
                d.explanation = d.stages[nextStage].explanation || '';
                d.explanationTimer = 120;
                if (window.Audio) Audio.puzzleCorrect();
            } else {
                // wrong order
                d.flashTimer = 40;
                d.flashColor = this.PAL.RED;
                if (window.Audio) Audio.puzzleWrong();
            }
            return;
        }
    },
};

if (typeof window !== 'undefined') {
    window.Puzzles = Puzzles;
}
