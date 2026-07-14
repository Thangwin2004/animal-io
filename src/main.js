import { GameApp } from './core/GameApp.js';

// Khởi tạo GameApp
const game = new GameApp();
game.init(document.getElementById('app')).catch(console.error);

// Export để có thể dùng debug
window.game = game;
