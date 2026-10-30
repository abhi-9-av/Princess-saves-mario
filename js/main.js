// ============================================================================
// PRINCESS SAVES MARIO — Main Entry Point
// ============================================================================

function bootGame() {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');

    try {
        // Step 1: Initialize Inputs
        if (loadingBar) loadingBar.style.width = '30%';
        if (loadingText) loadingText.textContent = 'Mapping Dual Controls...';
        Input.init();

        // Step 2: Generate All Programmatic Pixel Art Sprites
        if (loadingBar) loadingBar.style.width = '65%';
        if (loadingText) loadingText.textContent = 'Rendering 8-Bit Mushroom Kingdom...';
        Assets.init();

        // Step 3: Initialize Gesture Vision
        if (typeof GestureVision !== 'undefined') {
            GestureVision.init();
        }

        // Step 4: Initialize Game Engine
        if (loadingBar) loadingBar.style.width = '100%';
        if (loadingText) loadingText.textContent = 'Mission Ready! Click or Press Space to Start!';
        Engine.init();

        // Step 5: Fade out loading screen & start game
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.classList.add('fade-out');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 400);
            }
            Engine.start();
        }, 150);
    } catch (err) {
        console.error('Boot error:', err);
        // Force hide loading screen if error occurs so user can still see/interact
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        Engine.start();
    }
}

// Ensure execution whether DOM is already loaded or still loading
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootGame);
} else {
    bootGame();
}
