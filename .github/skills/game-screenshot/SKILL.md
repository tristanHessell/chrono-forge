---
name: game-screenshot
description: Capture a stable screenshot of the game or its settings dialog.
---

# Capture a game screenshot

1. Run `npm ci` if the repository has no dependencies.
2. Start the app with `npm run dev -- --host 127.0.0.1`.
3. Wait for Vite to report that the local server is ready.
4. Run the capture script from the repository root:

   ```bash
   node .github/skills/game-screenshot/capture.mjs docs/game.png
   ```

5. Add `settings` after the output path to capture the settings dialog.
6. The script starts a two-human game to keep the board stable.
7. The script captures a 1280 × 900 viewport.
8. Stop the development server after the capture.
