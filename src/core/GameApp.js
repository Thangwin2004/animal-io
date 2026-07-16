import { Application, extensions, CullerPlugin } from 'pixi.js';
import { AssetLoader } from './AssetLoader.js';
import { BootScene } from '../scenes/BootScene.js';
import { MenuScene } from '../scenes/MenuScene.js';
import { GameScene } from '../scenes/GameScene.js';
import { GameOverScene } from '../scenes/GameOverScene.js';
import { AudioManager } from './AudioManager.js';
import { AdManager } from './AdManager.js';
import { OverlayManager } from '../ui/OverlayManager.js';

extensions.add(CullerPlugin);

export class GameApp {
  constructor() {
    this.app = new Application();
    this.scenes = {};
    this.currentScene = null;
    this.assetLoader = new AssetLoader();
    this.audioManager = new AudioManager();
    this.adManager = new AdManager();
    this.overlayManager = new OverlayManager(this);
    this.bestScore = localStorage.getItem('animal_io_best_score') || 0;
  }

  async init(container) {
    await this.app.init({
      resizeTo: window,
      backgroundColor: 0x1a1a1a, // Dark
      resolution: Math.min(window.devicePixelRatio || 1, 2), // Tăng độ phân giải lên tối đa 2x để tránh mờ trên mobile
      autoDensity: true,
      antialias: true // Bật khử răng cưa để hình ảnh và chữ mượt mà hơn
    });
    container.appendChild(this.app.canvas);

    window.addEventListener('resize', this.onResize.bind(this));
    
    this.scenes = {
      Boot: new BootScene(this),
      Menu: new MenuScene(this),
      Game: new GameScene(this),
      GameOver: new GameOverScene(this)
    };

    this.switchScene('Boot');

    this.app.ticker.add((ticker) => {
      if (this.currentScene && this.currentScene.update) {
        this.currentScene.update(ticker);
      }
    });
  }

  switchScene(sceneName, data = null) {
    if (this.currentScene) {
      this.app.stage.removeChild(this.currentScene.container);
    }
    const nextScene = this.scenes[sceneName];
    if (nextScene) {
      this.currentScene = nextScene;
      this.app.stage.addChild(this.currentScene.container);
      if (this.currentScene.onEnter) {
        this.currentScene.onEnter(data);
      }
      this.onResize();
    }
  }

  onResize() {
    if (this.currentScene && this.currentScene.onResize) {
      this.currentScene.onResize(window.innerWidth, window.innerHeight);
    }
  }
}
