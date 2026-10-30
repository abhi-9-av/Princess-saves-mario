# 👑 Princess Saves Mario

> **High-Stakes Reverse-Rescue Retro Platformer with Dual-Input Gesture Vision & Inter-Level Tech Puzzles**
> Built according to the **TechVerse Game Design Document**.

---

## 🎮 How to Play

### Launching the Game
1. Simply open `index.html` in any modern web browser (Google Chrome, Edge, Safari, Firefox).
2. Or serve locally:
   ```bash
   python3 -m http.server 8000
   ```
   and navigate to `http://localhost:8000`.

---

## 🕹️ Dual-Input Architecture

### 1. Primary Input (Two-Handed Computer Vision Gesture Controls)
Press **`G`** in-game or click **[G] GESTURE CAM** on the HUD to open the real-time webcam gesture tracking panel!

* **👉 Right Hand (Movement & Agility)**:
  * **Steer Left / Right**: Point your index finger **Left (👈)** or **Right (👉)**.
  * **Stop Dead**: Keep your hand in the center green box to stop immediately on a dime.
  * **Jump & Float**: **Pinch (👌)** (Thumb + Index tip pinch together) or **Upward Flick**.
    * Hold in mid-air to float gracefully with Peach's parasol dress (emits magical sparkles).
    * Release pinch to drop back down.
    * Allows effortless simultaneous running-jumps (point right + pinch)!
* **✋ Left Hand (Combat & Magic)**:
  * **Attack Punch (👊)**: Clench your left fist for an instant close-range punch to defeat nearby Goombas & Koopas.
  * **Heart Blast (💖)**: Open your left palm flat toward the camera to fire a long-range magical projectile.
* **🤝 Both Hands (Special Interaction)**:
  * **Rescue Mario / Unlock Gates**: Bring both hands close together in the center.

*(Single-hand fallback is also supported: if only one hand is on camera, it handles steering, pinch-jumping, and fists/open palms seamlessly).*

### 2. Secondary Input (Precision Keyboard Fallback)
| Action | Controls |
|---|---|
| **Move Left / Right** | `A` / `D` or `Left` / `Right` Arrow keys |
| **Jump & Float** | `Spacebar` (Hold in mid-air to float with umbrella dress) |
| **Punch Attack** | `Z` (Close-range melee attack) |
| **Snap Blast** | `X` (Fires magical Heart Blast projectile) |
| **Interact / Rescue** | `C` (Opens doors & rescues Mario) |
| **Toggle Gesture Cam** | `G` (Turns on/off real-time webcam tracking) |
| **Toggle Audio** | `M` (Mutes/unmutes 8-bit chiptune audio) |
| **Pause** | `P` or `Escape` |

---

## 🏰 Game Flow & Level Progression

Each stage gives you a strict **60-second ticking clock**. Collect coins along your path for score multipliers and time extensions!

* **World 1: Mushroom Kingdom** — Iconic skies, pipes, Goombas, Koopa Troopas, and piranha plants. Reach the **CPU Gate** at the end of the zone.
* **World 2: Underground Depths** — Treacherous brick ceilings, chasms, and floating platforms. Guarded by the **OS Scheduler** conveyor obstacle.
* **World 3: Bowser's Castle** — Magma pits, drawbridges, and lethal spikes. Solve the **Database Decryption** gate to breach Mario's containment cell and rescue him!

---

## 💻 Inter-Level Tech Puzzles

1. **The CPU Gate (8085 Microprocessor Cycles)**:
   - Drag and arrange the 5 microprocessor machine cycles in proper sequential order: `FETCH` → `DECODE` → `EXECUTE` → `MEMORY` → `WRITE BACK`.
   - Restores power to the bridge logic board.
2. **The OS Scheduler (Process Scheduling)**:
   - Inspect the incoming process queue with burst times and priorities.
   - Choose between `FCFS`, `SJF`, and `PRIORITY` to route all packets before the memory buffer overflow deadline.
3. **Database Decryption (Relational Normal Forms)**:
   - Apply normal forms in strict sequential order (`1NF` → `2NF` → `3NF`) to eliminate repeating groups, partial dependencies, and transitive anomalies, revealing Mario's exact coordinates.

---

## 🎨 Asset & Engine Architecture
- **Programmatic Pixel Art**: 100% generated via HTML5 Canvas 2D without external image asset dependencies.
- **Synthesized 8-Bit Chiptune Audio**: Full Web Audio API oscillator synthesis (jumps, blasts, coin collect, stomps, hurt, puzzle fanfare, level clear, victory themes).
- **Physical Collision Engine**: Fixed-timestep AABB tile collision, variable jump cutting, coyote time, and jump buffering.
