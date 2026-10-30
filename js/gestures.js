// ============================================================================
// PRINCESS SAVES MARIO — Computer Vision Gesture Tracking
// ============================================================================

var GestureVision = (() => {
    let video = null;
    let canvas = null;
    let ctx = null;
    let overlay = null;
    let stream = null;
    let isTracking = false;
    let handDetector = null;
    let animFrameId = null;
    let jumpHoldFrames = 0;

    // Detection State
    const state = {
        active: false,
        direction: DIR.NONE,
        jumping: false,
        punching: false,
        blasting: false,
        interacting: false,
        handCount: 0,
        confidence: 0
    };

    function init() {
        video = document.getElementById('gesture-video');
        canvas = document.getElementById('gesture-canvas');
        overlay = document.getElementById('gesture-overlay');

        if (canvas) {
            canvas.width = 320;
            canvas.height = 220;
            ctx = canvas.getContext('2d');

            // Interactive gesture simulation via mouse/touch on camera viewport
            let isDown = false;
            const handleSim = (e) => {
                const rect = canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;

                state.active = true;
                if (x < 0.36) state.direction = DIR.LEFT;
                else if (x > 0.64) state.direction = DIR.RIGHT;
                else state.direction = DIR.NONE;

                state.jumping = y < 0.45 || e.ctrlKey || e.metaKey;
                state.punching = e.shiftKey || (e.buttons === 2);
                state.blasting = e.altKey;

                Input.setGesture(state);
                updateIndicatorUI();

                if (ctx) {
                    ctx.clearRect(0, 0, 320, 220);
                    ctx.fillStyle = '#00ffcc';
                    ctx.beginPath();
                    ctx.arc(x * 320, y * 220, 8, 0, Math.PI * 2);
                    ctx.fill();
                    drawFeedbackOverlay(ctx);
                }
            };

            canvas.addEventListener('mousedown', (e) => { isDown = true; handleSim(e); });
            canvas.addEventListener('mousemove', (e) => { if (isDown) handleSim(e); });
            window.addEventListener('mouseup', () => {
                if (isDown) {
                    isDown = false;
                    state.direction = DIR.NONE;
                    state.jumping = false;
                    state.punching = false;
                    state.blasting = false;
                    Input.setGesture(state);
                    updateIndicatorUI();
                    if (ctx) ctx.clearRect(0, 0, 320, 220);
                }
            });
        }

        const closeBtn = document.getElementById('gesture-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                stopCamera();
            });
        }

        // Try to load MediaPipe Hands dynamically if not present
        loadMediaPipe();
    }

    function updateIndicatorUI() {
        const setCls = (id, active) => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('active', !!active);
        };
        setCls('gi-steer', state.direction !== DIR.NONE);
        setCls('gi-stop', state.direction === DIR.NONE && state.active);
        setCls('gi-jump', state.jumping);
        setCls('gi-blast', state.blasting);
        setCls('gi-punch', state.punching);
        setCls('gi-interact', state.interacting);
    }

    function initHandDetector() {
        if (!window.Hands || handDetector) return;
        try {
            handDetector = new window.Hands({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            });

            handDetector.setOptions({
                maxNumHands: 2,
                modelComplexity: 0, // Fast 60 FPS real-time model
                minDetectionConfidence: 0.45,
                minTrackingConfidence: 0.45
            });

            handDetector.onResults(onHandResults);
        } catch (e) {
            console.warn('MediaPipe init error:', e);
        }
    }

    async function loadMediaPipe() {
        if (window.Hands) {
            initHandDetector();
            return;
        }

        try {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
            script.async = true;
            script.onload = () => {
                initHandDetector();
            };
            document.head.appendChild(script);
        } catch (e) {
            console.log('MediaPipe load error or offline, fallback vision mode ready:', e);
        }
    }

    async function startCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn('Webcam gesture control is not supported by your browser environment.');
            return false;
        }

        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240, frameRate: { ideal: 30 } }
            });
            video.srcObject = stream;
            await video.play();

            isTracking = true;
            state.active = true;
            initHandDetector();
            if (overlay) {
                overlay.classList.remove('hidden');
                overlay.classList.add('active');
            }

            trackLoop();
            return true;
        } catch (err) {
            console.warn('Camera access denied or unavailable:', err);
            stopCamera();
            return false;
        }
    }

    function stopCamera() {
        isTracking = false;
        state.active = false;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                if (!isTracking && overlay) overlay.classList.add('hidden');
            }, 300);
        }
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
        }
        // Reset inputs
        Input.setGesture({
            active: false,
            direction: DIR.NONE,
            jumping: false,
            punching: false,
            blasting: false,
            interacting: false
        });
        updateIndicatorUI();
    }

    function toggle() {
        if (overlay && overlay.classList.contains('active')) {
            stopCamera();
        } else {
            if (overlay) {
                overlay.classList.remove('hidden');
                overlay.classList.add('active');
            }
            startCamera();
        }
    }

    async function trackLoop() {
        if (!isTracking) return;

        if (video.readyState >= 2) {
            if (handDetector) {
                // Send video frame to MediaPipe
                await handDetector.send({ image: video });
            } else {
                // Lightweight optical/skin centroid fallback
                runFallbackVision();
            }
        }

        animFrameId = requestAnimationFrame(trackLoop);
    }

    // MediaPipe Result Evaluation — Two-Handed Controller
    function onHandResults(results) {
        if (!ctx) return;
        ctx.clearRect(0, 0, 320, 220);

        // Reset default states for this frame
        state.direction = DIR.NONE;
        state.punching = false;
        state.blasting = false;
        state.interacting = false;

        const hands = results.multiHandLandmarks;
        state.handCount = hands ? hands.length : 0;

        if (hands && hands.length > 0) {
            let rightHand = null;
            let leftHand = null;

            if (hands.length >= 2) {
                // Mirrored screen X: 0.0 = Left of screen, 1.0 = Right of screen
                const screenX0 = 1.0 - hands[0][0].x;
                const screenX1 = 1.0 - hands[1][0].x;
                if (screenX0 >= screenX1) {
                    rightHand = hands[0];
                    leftHand = hands[1];
                } else {
                    rightHand = hands[1];
                    leftHand = hands[0];
                }
            } else {
                // Single hand in view
                rightHand = hands[0];
            }

            // Draw skeleton landmarks: Right hand = Cyan/Gold, Left hand = Pink/Magenta
            if (rightHand) drawHandSkeleton(ctx, rightHand, true);
            if (leftHand) drawHandSkeleton(ctx, leftHand, false);

            // ============================================================
            // 1. RIGHT HAND: Steering (Index Point) & Jump (Pinch / Flick)
            // ============================================================
            if (rightHand) {
                const rWrist = rightHand[0];
                const rThumbMcp = rightHand[2];
                const rThumbTip = rightHand[4];
                const rIndexMcp = rightHand[5];
                const rIndexPip = rightHand[6];
                const rIndexTip = rightHand[8];
                const rMiddleMcp = rightHand[9];
                const rMiddlePip = rightHand[10];
                const rMiddleTip = rightHand[12];
                const rRingPip = rightHand[14];
                const rRingTip = rightHand[16];
                const rPinkyPip = rightHand[18];
                const rPinkyTip = rightHand[20];

                const screenTipX = 1.0 - rIndexTip.x;
                const screenMcpX = 1.0 - rIndexMcp.x;
                const screenThumbTipX = 1.0 - rThumbTip.x;

                const tipY = rIndexTip.y;
                const pipY = rIndexPip.y;
                const mcpY = rIndexMcp.y;

                // Index finger pointing direction vector (in screen space)
                const fingerDx = screenTipX - screenMcpX;
                const fingerDy = tipY - mcpY;

                // Pinch detection: Thumb Tip & Index Tip pinched together
                const pinchDist = Math.hypot(rThumbTip.x - rIndexTip.x, rThumbTip.y - rIndexTip.y);
                const isPinch = pinchDist < 0.075;

                // Upward Flick: Index finger flicked/pointing straight up
                const isFlick = (fingerDy < -0.06) && (tipY < pipY);

                // Natural thumb up
                const thumbUp = (rThumbTip.y < rThumbMcp.y - 0.02) && (rThumbTip.y < rIndexMcp.y);

                // Highlight Pinch / Flick on camera feed
                if (isPinch || isFlick || thumbUp) {
                    ctx.fillStyle = '#ffd700';
                    ctx.beginPath();
                    ctx.arc(screenTipX * 320, tipY * 220, 8, 0, Math.PI * 2);
                    ctx.arc(screenThumbTipX * 320, rThumbTip.y * 220, 8, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillStyle = '#00ffff';
                    ctx.beginPath();
                    ctx.arc(screenTipX * 320, tipY * 220, 6, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Check single-hand combat fallback if only 1 hand is present
                const rIndexCurled = tipY > pipY;
                const rMiddleCurled = rMiddleTip.y > rMiddlePip.y;
                const rRingCurled = rRingTip.y > rRingPip.y;
                const rPinkyCurled = rPinkyTip.y > rPinkyPip.y;
                const rAllCurled = rIndexCurled && rMiddleCurled && rRingCurled && rPinkyCurled;
                const rAllOpen = !rIndexCurled && !rMiddleCurled && !rRingCurled && !rPinkyCurled;

                if (!leftHand && rAllCurled && !isPinch && !thumbUp) {
                    // Fist on single hand = Punch
                    state.punching = true;
                    state.direction = DIR.NONE;
                } else {
                    // Steer Peach horizontally
                    if (fingerDx < -0.04) {
                        state.direction = DIR.LEFT;
                    } else if (fingerDx > 0.04) {
                        state.direction = DIR.RIGHT;
                    } else if (screenTipX < 0.38) {
                        state.direction = DIR.LEFT;
                    } else if (screenTipX > 0.62) {
                        state.direction = DIR.RIGHT;
                    } else {
                        // Inside central green box = STOP DEAD!
                        state.direction = DIR.NONE;
                    }
                }

                // Jump & Float Trigger (Pinch 👌, Upward Flick ☝️, or Thumb Up 👍)
                const wantsJump = (isPinch || isFlick || thumbUp) && !state.punching;
                if (wantsJump) {
                    state.jumping = true;
                    jumpHoldFrames = 10;
                } else if (jumpHoldFrames > 0) {
                    jumpHoldFrames--;
                    state.jumping = true;
                } else {
                    state.jumping = false;
                }
            }

            // ============================================================
            // 2. LEFT HAND: Combat & Magic (Fist = Punch, Open Palm = Blast)
            // ============================================================
            if (leftHand) {
                const lIndexCurled = leftHand[8].y > leftHand[6].y;
                const lMiddleCurled = leftHand[12].y > leftHand[10].y;
                const lRingCurled = leftHand[16].y > leftHand[14].y;
                const lPinkyCurled = leftHand[20].y > leftHand[18].y;

                const lAllCurled = lIndexCurled && lMiddleCurled && lRingCurled && lPinkyCurled;
                const lAllOpen = !lIndexCurled && !lMiddleCurled && !lRingCurled && !lPinkyCurled;

                // Clench Left Fist = Attack Punch
                if (lAllCurled) {
                    state.punching = true;
                }

                // Open Left Palm = Heart Blast
                if (lAllOpen) {
                    state.blasting = true;
                }
            }

            // ============================================================
            // 3. BOTH HANDS: Special Interaction (Rescue Mario / Unlock)
            // ============================================================
            if (hands.length >= 2) {
                const wrist1 = hands[0][0];
                const wrist2 = hands[1][0];
                const handsDist = Math.hypot(wrist1.x - wrist2.x, wrist1.y - wrist2.y);
                if (handsDist < 0.28) {
                    state.interacting = true;
                }
            }

            // Draw feedback text overlay on camera
            drawFeedbackOverlay(ctx);
        } else {
            // No hands visible — stop immediately
            state.direction = DIR.NONE;
            state.jumping = false;
            state.punching = false;
            state.blasting = false;
            state.interacting = false;
            jumpHoldFrames = 0;
        }

        // Send state to Input system
        Input.setGesture(state);
        updateIndicatorUI();
    }

    function drawFeedbackOverlay(ctx) {
        ctx.save();
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';

        // Right Hand Motion Indicator
        if (state.direction === DIR.LEFT) {
            ctx.fillStyle = '#00ffff';
            ctx.fillText('◄ R: STEER LEFT', 80, 205);
        } else if (state.direction === DIR.RIGHT) {
            ctx.fillStyle = '#00ffff';
            ctx.fillText('R: STEER RIGHT ►', 240, 205);
        } else if (state.direction === DIR.NONE && state.active) {
            ctx.fillStyle = '#30ff30';
            ctx.fillText('■ R: STOPPED', 160, 205);
        }

        if (state.jumping) {
            ctx.fillStyle = '#ffd700';
            ctx.fillText('▲ R: PINCH / FLICK JUMP ACTIVE', 160, 32);
        }
        if (state.punching) {
            ctx.fillStyle = '#ff3366';
            ctx.fillText('👊 L: PUNCH ATTACK!', 160, 110);
        }
        if (state.blasting) {
            ctx.fillStyle = '#ff80df';
            ctx.fillText('♥ L: HEART BLAST READY!', 160, 130);
        }
        if (state.interacting) {
            ctx.fillStyle = '#30ff30';
            ctx.fillText('🤝 BOTH HANDS: RESCUE / UNLOCK!', 160, 150);
        }
        ctx.restore();
    }

    // Helper to draw skeleton in mirrored coordinates matching mirrored video
    function drawHandSkeleton(ctx, lm, isRightHand = true) {
        ctx.fillStyle = isRightHand ? '#00ffff' : '#ff80df';
        ctx.strokeStyle = isRightHand ? '#00e5ff' : '#ff3388';
        ctx.lineWidth = 2;

        const connections = [
            [0,1],[1,2],[2,3],[3,4],
            [0,5],[5,6],[6,7],[7,8],
            [5,9],[9,10],[10,11],[11,12],
            [9,13],[13,14],[14,15],[15,16],
            [13,17],[17,18],[18,19],[19,20],[0,17]
        ];

        ctx.beginPath();
        for (const [i, j] of connections) {
            ctx.moveTo((1.0 - lm[i].x) * 320, lm[i].y * 220);
            ctx.lineTo((1.0 - lm[j].x) * 320, lm[j].y * 220);
        }
        ctx.stroke();

        for (let i = 0; i < lm.length; i++) {
            ctx.beginPath();
            ctx.arc((1.0 - lm[i].x) * 320, lm[i].y * 220, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Neutral state while MediaPipe model initializes
    function runFallbackVision() {
        if (!ctx) return;
        ctx.clearRect(0, 0, 320, 220);
        ctx.save();
        ctx.font = '8px monospace';
        ctx.fillStyle = '#00ffff';
        ctx.textAlign = 'center';
        ctx.fillText('CONNECTING AI VISION...', 160, 105);
        ctx.fillStyle = '#ffd700';
        ctx.fillText('HOLD HAND IN FRONT OF CAMERA', 160, 125);
        ctx.restore();

        // Keep player safe & stationary during initialization
        state.direction = DIR.NONE;
        state.jumping = false;
        state.punching = false;
        state.blasting = false;
        Input.setGesture(state);
    }

    return {
        init,
        toggle,
        startCamera,
        stopCamera,
        get isTracking() { return isTracking; },
        get state() { return state; }
    };
})();

if (typeof window !== 'undefined') {
    window.GestureVision = GestureVision;
}
