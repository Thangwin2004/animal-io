import { GameApp } from './core/GameApp.js';
import { winkGame } from "./integrations/wink/wink-adapter.js";

// Khởi tạo GameApp
const game = new GameApp();

// Force-load Google Fonts with Vietnamese text before PixiJS renders
Promise.allSettled([
  document.fonts.load("700 1em Nunito", "Bộ Lạc Đậu Phộng"),
  document.fonts.load("700 1em 'Baloo 2'", "Bộ Lạc Đậu Phộng"),
]).then(() => document.fonts.ready).then(() => {
  return game.init(document.getElementById('app'));
}).then(() => {
  // ── Wink Bridge lifecycle binding ──
  winkGame.bindLifecycle({
    onPause: () => { if (game.app && game.app.ticker) game.app.ticker.stop(); },
    onResume: () => { if (game.app && game.app.ticker) game.app.ticker.start(); },
    onMute: () => { if (game.audioManager) game.audioManager.setMuted(true); },
    onUnmute: () => { if (game.audioManager) game.audioManager.setMuted(false); },
  });

  winkGame.observe(() => {});
}).catch(console.error);
