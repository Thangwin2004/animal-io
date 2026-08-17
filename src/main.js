import { GameApp } from './core/GameApp.js';
import { winkGame } from "./integrations/wink/wink-adapter.js";
import { waitForGameFonts } from "./utils/fontLoader.js";
import { installFocusPause } from "./utils/focusPause.js";

// Khởi tạo GameApp
const game = new GameApp();

waitForGameFonts([
  "400 1em 'Be Vietnam Pro'",
  "500 1em 'Be Vietnam Pro'",
  "600 1em 'Be Vietnam Pro'",
  "700 1em 'Be Vietnam Pro'",
  "800 1em 'Be Vietnam Pro'",
  "900 1em 'Be Vietnam Pro'",
  "700 1em 'Baloo 2'",
  "800 1em 'Baloo 2'",
]).then(() => {
  return game.init(document.getElementById('app'));
}).then(() => {
  const focusPause = installFocusPause({
    isRunning: () => Boolean(game.app?.ticker.started),
    pause: () => game.app?.ticker.stop(),
    resume: () => game.app?.ticker.start(),
    pauseAudio: () => game.audioManager?.pauseForFocus(),
    resumeAudio: () => game.audioManager?.resumeFromFocus(),
  });

  // ── Wink Bridge lifecycle binding ──
  winkGame.bindLifecycle({
    onPause: focusPause.pauseFromHost,
    onResume: focusPause.resumeFromHost,
    onMute: () => { if (game.audioManager) game.audioManager.setMuted(true); },
    onUnmute: () => { if (game.audioManager) game.audioManager.setMuted(false); },
  });

  winkGame.observe(() => {});
}).catch(console.error);
