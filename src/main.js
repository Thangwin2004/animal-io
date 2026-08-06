import { GameApp } from './core/GameApp.js';
import { winkGame } from "./integrations/wink/wink-adapter.js";

// Khởi tạo GameApp
const game = new GameApp();
game.init(document.getElementById('app')).then(() => {
  // ── Wink Bridge lifecycle binding ──
  winkGame.bindLifecycle({
    onPause: () => { if (game.app && game.app.ticker) game.app.ticker.stop(); },
    onResume: () => { if (game.app && game.app.ticker) game.app.ticker.start(); },
    onMute: () => { if (game.audioManager) game.audioManager.setMuted(true); },
    onUnmute: () => { if (game.audioManager) game.audioManager.setMuted(false); },
  });

  winkGame.observe(() => {});
}).catch(console.error);
