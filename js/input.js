// ============================================================================
// PRINCESS SAVES MARIO — Input System (Keyboard + Gesture Interface)
// ============================================================================

var Input = (() => {
    const keys = {};
    const pressed = {};  // True only on the frame a key is first pressed
    const keyActions = {};
    const keyActionPressed = {};

    // Separate gesture actions to prevent stuck inputs
    const gestureActions = {
        [ACTION.LEFT]: false,
        [ACTION.RIGHT]: false,
        [ACTION.UP]: false,
        [ACTION.DOWN]: false,
        [ACTION.JUMP]: false,
        [ACTION.PUNCH]: false,
        [ACTION.BLAST]: false,
        [ACTION.INTERACT]: false,
    };
    const gestureActionPressed = {};

    let prevGestureJumping = false;
    let prevGesturePunching = false;
    let prevGestureBlasting = false;
    let prevGestureInteracting = false;

    // Key mappings (multiple keys can map to same action)
    const keyMap = {
        'ArrowLeft':  ACTION.LEFT,
        'ArrowRight': ACTION.RIGHT,
        'ArrowUp':    ACTION.UP,
        'ArrowDown':  ACTION.DOWN,
        'KeyA':       ACTION.LEFT,
        'KeyD':       ACTION.RIGHT,
        'KeyW':       ACTION.UP,
        'KeyS':       ACTION.DOWN,
        'Space':      ACTION.JUMP,
        'KeyZ':       ACTION.PUNCH,
        'KeyX':       ACTION.BLAST,
        'KeyC':       ACTION.INTERACT,
        'Escape':     ACTION.PAUSE,
        'KeyP':       ACTION.PAUSE,
        'Enter':      ACTION.CONFIRM,
    };

    // Gesture state (updated by gesture system)
    const gesture = {
        active: false,
        direction: DIR.NONE,  // -1 left, 0 center, 1 right
        jumping: false,
        punching: false,
        blasting: false,
        interacting: false,
    };

    function init() {
        window.addEventListener('keydown', (e) => {
            if (!keys[e.code]) {
                pressed[e.code] = true;
            }
            keys[e.code] = true;

            const action = keyMap[e.code];
            if (action) {
                if (!keyActions[action]) {
                    keyActionPressed[action] = true;
                }
                keyActions[action] = true;
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            keys[e.code] = false;
            const action = keyMap[e.code];
            if (action) {
                keyActions[action] = false;
            }
        });

        // Reset pressed state on window blur
        window.addEventListener('blur', () => {
            reset();
        });
    }

    function reset() {
        Object.keys(keys).forEach(k => keys[k] = false);
        Object.keys(pressed).forEach(k => pressed[k] = false);
        Object.keys(keyActions).forEach(a => keyActions[a] = false);
        Object.keys(keyActionPressed).forEach(a => keyActionPressed[a] = false);
        Object.keys(gestureActions).forEach(a => gestureActions[a] = false);
        Object.keys(gestureActionPressed).forEach(a => gestureActionPressed[a] = false);
        prevGestureJumping = false;
        prevGesturePunching = false;
        prevGestureBlasting = false;
        prevGestureInteracting = false;
        gesture.direction = DIR.NONE;
        gesture.jumping = false;
        gesture.punching = false;
        gesture.blasting = false;
        gesture.interacting = false;
    }

    function update() {
        // Sync gesture actions with clear idle / opposite resets
        if (gesture.active) {
            // Directional steer: If LEFT, left=true & right=false; if RIGHT, right=true & left=false; if NONE, both=false (STOP DEAD!)
            gestureActions[ACTION.LEFT] = (gesture.direction === DIR.LEFT);
            gestureActions[ACTION.RIGHT] = (gesture.direction === DIR.RIGHT);

            // Jump & Float: trigger on fresh edge, hold while finger stays up
            if (gesture.jumping && !prevGestureJumping) {
                gestureActionPressed[ACTION.JUMP] = true;
            }
            gestureActions[ACTION.JUMP] = !!gesture.jumping;
            prevGestureJumping = !!gesture.jumping;

            // Attack Punch
            if (gesture.punching && !prevGesturePunching) {
                gestureActionPressed[ACTION.PUNCH] = true;
            }
            gestureActions[ACTION.PUNCH] = !!gesture.punching;
            prevGesturePunching = !!gesture.punching;

            // Snap Blast
            if (gesture.blasting && !prevGestureBlasting) {
                gestureActionPressed[ACTION.BLAST] = true;
            }
            gestureActions[ACTION.BLAST] = !!gesture.blasting;
            prevGestureBlasting = !!gesture.blasting;

            // Interact
            if (gesture.interacting && !prevGestureInteracting) {
                gestureActionPressed[ACTION.INTERACT] = true;
            }
            gestureActions[ACTION.INTERACT] = !!gesture.interacting;
            prevGestureInteracting = !!gesture.interacting;
        } else {
            // If gesture tracking is paused or inactive, immediately release all gesture actions
            gestureActions[ACTION.LEFT] = false;
            gestureActions[ACTION.RIGHT] = false;
            gestureActions[ACTION.JUMP] = false;
            gestureActions[ACTION.PUNCH] = false;
            gestureActions[ACTION.BLAST] = false;
            gestureActions[ACTION.INTERACT] = false;
            prevGestureJumping = false;
            prevGesturePunching = false;
            prevGestureBlasting = false;
            prevGestureInteracting = false;
        }
    }

    // Called strictly AFTER update() has consumed frame inputs
    function postUpdate() {
        Object.keys(pressed).forEach(k => pressed[k] = false);
        Object.keys(keyActionPressed).forEach(a => keyActionPressed[a] = false);
        Object.keys(gestureActionPressed).forEach(a => gestureActionPressed[a] = false);
    }

    return {
        init,
        reset,
        update,
        postUpdate,
        gesture,

        // Check if action is currently held down (either by keyboard or gesture)
        isDown(action) {
            return !!(keyActions[action] || gestureActions[action]);
        },

        // Check if action was just pressed this frame
        isPressed(action) {
            return !!(keyActionPressed[action] || gestureActionPressed[action]);
        },

        // Check raw key state
        isKeyDown(code) {
            return !!keys[code];
        },

        isKeyPressed(code) {
            return !!pressed[code];
        },

        // Set gesture state (called by gesture tracking system)
        setGesture(state) {
            Object.assign(gesture, state);
        },
    };
})();

if (typeof window !== 'undefined') {
    window.Input = Input;
}
