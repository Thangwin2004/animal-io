import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { IconBtn } from '../ui/Button.js';

export class GameOverScene {
  constructor(game) {
    this.game = game;
    this.container = new Container();

    this.bg = new Graphics();
    this.container.addChild(this.bg);

    const titleStyle = new TextStyle({
      fontFamily: "'Fredoka', 'Baloo 2', 'Be Vietnam Pro', sans-serif", 
      fontSize: 48, 
      fill: '#FFB74D', 
      fontWeight: '900',
      stroke: { color: '#5D4037', width: 6, join: 'round' }
    });
    this.title = new Text({ text: 'ÔI TIẾC QUÁ!', style: titleStyle });
    this.title.anchor.set(0.5);
    this.container.addChild(this.title);

    const labelStyle = new TextStyle({
      fontFamily: "'Fredoka', 'Baloo 2', 'Be Vietnam Pro', sans-serif", 
      fontSize: 28, 
      fill: '#5D4037',
      fontWeight: 'bold'
    });

    const scoreNumStyle = new TextStyle({
      fontFamily: "'Fredoka', 'Baloo 2', 'Be Vietnam Pro', sans-serif", 
      fontSize: 70, 
      fill: '#ffffff',
      fontWeight: '900',
      stroke: { color: '#5D4037', width: 6, join: 'round' }
    });

    const bestNumStyle = new TextStyle({
      fontFamily: "'Fredoka', 'Baloo 2', 'Be Vietnam Pro', sans-serif", 
      fontSize: 40, 
      fill: '#FFD64A',
      fontWeight: '900',
      stroke: { color: '#5D4037', width: 5, join: 'round' }
    });

    this.scoreLabel = new Text({ text: 'Điểm số', style: labelStyle });
    this.scoreLabel.anchor.set(0.5);
    this.container.addChild(this.scoreLabel);

    this.scoreText = new Text({ text: '0', style: scoreNumStyle });
    this.scoreText.anchor.set(0.5);
    this.container.addChild(this.scoreText);
    
    this.bestLabel = new Text({ text: 'Kỷ lục', style: labelStyle });
    this.bestLabel.anchor.set(0.5);
    this.container.addChild(this.bestLabel);

    this.bestScoreText = new Text({ text: '0', style: bestNumStyle });
    this.bestScoreText.anchor.set(0.5);
    this.container.addChild(this.bestScoreText);

    // Nút Replay (Icon Button)
    this.replayBtn = new IconBtn(null, () => this.onReplayClick(), 45);
    this.container.addChild(this.replayBtn);
    
    // Nút Home (Icon Button)
    this.homeBtn = new IconBtn(null, () => {
        this.game.audioManager.playSFX('click');
        this.game.switchScene('Menu');
    }, 45);
    this.container.addChild(this.homeBtn);
    
    this.score = 0;
  }

  onEnter(data) {
    this.replayBtn.setTexture(this.game.assetLoader.ui.replayBtn, 45);
    this.homeBtn.setTexture(this.game.assetLoader.ui.homeBtn, 45);

    this.score = data?.score || 0;
    if (this.score > this.game.bestScore) {
      this.game.bestScore = this.score;
      localStorage.setItem('animal_io_best_score', this.game.bestScore);
    }

    this.scoreText.text = `${this.score}`;
    this.bestScoreText.text = `${this.game.bestScore}`;
    
    this.onResize(this.game.app.screen.width, this.game.app.screen.height);
  }

  onReplayClick() {
    this.game.audioManager.playSFX('click');
    this.game.adManager.showInterstitial(() => {
        this.game.switchScene('Game');
    });
  }

  onResize(w, h) {
    this.bg.clear().rect(0, 0, w, h).fill('#DDF4FF'); // Sky blue background
    
    let currentY = h * 0.15;
    
    this.title.x = w / 2;
    this.title.y = currentY;
    
    currentY += 100;
    this.scoreLabel.x = w / 2;
    this.scoreLabel.y = currentY;

    currentY += 75;
    this.scoreText.x = w / 2;
    this.scoreText.y = currentY;
    
    currentY += 100;
    this.bestLabel.x = w / 2;
    this.bestLabel.y = currentY;

    currentY += 60;
    this.bestScoreText.x = w / 2;
    this.bestScoreText.y = currentY;

    // Các nút
    currentY += 130;
    this.replayBtn.x = w / 2 - 80;
    this.replayBtn.y = currentY;
    
    this.homeBtn.x = w / 2 + 80;
    this.homeBtn.y = currentY;
  }
}
