import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class BootScene {
  constructor(game) {
    this.game = game;
    this.container = new Container();

    this.bg = new Graphics().rect(0, 0, window.innerWidth, window.innerHeight).fill(0x1a1a1a);
    this.container.addChild(this.bg);

    const style = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 36,
      fill: '#ffffff',
      fontWeight: 'bold'
    });
    this.loadingText = new Text({ text: 'Loading 0%', style });
    this.loadingText.anchor.set(0.5);
    this.container.addChild(this.loadingText);

    this.progressBar = new Graphics();
    this.container.addChild(this.progressBar);
  }

  async onEnter() {
    this.onResize(this.game.app.screen.width, this.game.app.screen.height);
    try {
      this.game.audioManager.loadSFX();
      
      await this.game.assetLoader.load((progress) => {
        this.loadingText.text = `Loading ${Math.round(progress * 100)}%`;
        this.drawProgress(progress);
      });
      // Giả lập chút thời gian cho đẹp
      setTimeout(() => {
        this.game.switchScene('Menu');
      }, 500);
    } catch (e) {
      console.error("Lỗi tải assets:", e);
      this.loadingText.text = "Lỗi tải dữ liệu. Nhấn F5 để tải lại.";
    }
  }

  drawProgress(progress) {
    this.progressBar.clear();
    const width = 300;
    const height = 20;
    const x = this.game.app.screen.width / 2 - width / 2;
    const y = this.game.app.screen.height / 2 + 50;
    
    // Background
    this.progressBar.roundRect(x, y, width, height, 10).fill(0x333333);
    // Fill
    this.progressBar.roundRect(x, y, width * progress, height, 10).fill(0x00ff88);
  }

  onResize(w, h) {
    this.bg.clear().rect(0, 0, w, h).fill(0x1a1a1a);
    this.loadingText.x = w / 2;
    this.loadingText.y = h / 2;
    this.drawProgress(0);
  }
}
