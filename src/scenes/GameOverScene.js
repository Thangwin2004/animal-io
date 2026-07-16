import { Container, Graphics, Sprite, Text, TextStyle, FillGradient } from 'pixi.js';
import { IconBtn } from '../ui/Button.js';

export class GameOverScene {
  constructor(game) {
    this.game = game;
    this.container = new Container();

    this.bg = new Sprite();
    this.container.addChild(this.bg);

    const titleStyle = new TextStyle({
      fontFamily: "'Fredoka', 'Baloo 2', 'Be Vietnam Pro', sans-serif", 
      fontSize: 65, 
      fill: '#FFB300', 
      fontWeight: '900',
      stroke: { color: '#ffffff', width: 14, join: 'round' },
      dropShadow: { color: '#E65100', alpha: 1, distance: 8, blur: 0 },
      letterSpacing: 4,
      align: 'center'
    });
    this.title = new Text({ text: 'ÔI TIẾC\nQUÁ!', style: titleStyle });
    this.title.anchor.set(0.5);
    this.container.addChild(this.title);

    // Bảng điểm (Score Panel)
    this.scorePanel = new Graphics();
    this.container.addChild(this.scorePanel);

    const labelStyle = new TextStyle({
      fontFamily: "'Fredoka', 'Baloo 2', 'Be Vietnam Pro', sans-serif", 
      fontSize: 22, 
      fill: '#ffffff',
      fontWeight: 'bold',
      letterSpacing: 1
    });

    const scoreNumStyle = new TextStyle({
      fontFamily: "'Fredoka', 'Baloo 2', 'Be Vietnam Pro', sans-serif", 
      fontSize: 80, 
      fill: '#1565C0',
      fontWeight: '900',
      stroke: { color: '#ffffff', width: 8, join: 'round' },
      dropShadow: { color: '#90CAF9', alpha: 1, distance: 3, blur: 0 }
    });

    const bestGrad = new FillGradient(0, 0, 0, 50);
    bestGrad.addColorStop(0, '#FFF59D');
    bestGrad.addColorStop(1, '#FFB300');

    const bestNumStyle = new TextStyle({
      fontFamily: "'Fredoka', 'Baloo 2', 'Be Vietnam Pro', sans-serif", 
      fontSize: 50, 
      fill: bestGrad,
      fontWeight: '900',
      stroke: { color: '#ffffff', width: 6, join: 'round' },
      dropShadow: { color: '#F57F17', alpha: 1, distance: 4, blur: 0 }
    });

    // Label nền "Điểm số"
    this.scoreLabelBg = new Graphics();
    this.container.addChild(this.scoreLabelBg);
    this.scoreLabel = new Text({ text: 'ĐIỂM SỐ', style: labelStyle });
    this.scoreLabel.anchor.set(0.5);
    this.container.addChild(this.scoreLabel);

    this.scoreText = new Text({ text: '0', style: scoreNumStyle });
    this.scoreText.anchor.set(0.5);
    this.container.addChild(this.scoreText);
    
    // Label nền "Kỷ lục"
    this.bestLabelBg = new Graphics();
    this.container.addChild(this.bestLabelBg);
    this.bestLabel = new Text({ text: 'KỶ LỤC', style: labelStyle });
    this.bestLabel.anchor.set(0.5);
    this.container.addChild(this.bestLabel);

    this.bestScoreText = new Text({ text: '0', style: bestNumStyle });
    this.bestScoreText.anchor.set(0.5);
    this.container.addChild(this.bestScoreText);

    // Nút Replay (Icon Button)
    this.replayBtn = new IconBtn('replay', () => this.onReplayClick(), 35, '', 'yellow');
    this.container.addChild(this.replayBtn);
    
    // Nút Trang chủ (Icon Button)
    this.homeBtn = new IconBtn('home', () => {
        this.game.audioManager.playSFX('click');
        this.game.switchScene('Menu');
    }, 35, '', 'blue');
    this.container.addChild(this.homeBtn);
    
    this.score = 0;
  }

  onEnter(data) {

    if (this.game.assetLoader.ui.menuBg) {
      this.bg.texture = this.game.assetLoader.ui.menuBg;
    }

    this.score = data?.score || 0;
    if (this.score > this.game.bestScore) {
      this.game.bestScore = this.score;
      localStorage.setItem('animal_io_best_score', this.game.bestScore);
    }

    if (data?.isVictory) {
      this.title.text = 'VÔ ĐỊCH!';
      this.title.style.fill = '#00E676'; // Màu xanh lá cây rực rỡ
      this.title.style.dropShadow.color = '#1B5E20';
    } else {
      this.title.text = 'ÔI TIẾC\nQUÁ!';
      this.title.style.fill = '#FFB300';
      this.title.style.dropShadow.color = '#E65100';
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

  drawBackground(w, h) {
    if (this.bg && this.bg.texture) {
      // Scale để cover toàn bộ màn hình (dữ tỉ lệ)
      const scale = Math.max(w / this.bg.texture.width, h / this.bg.texture.height);
      this.bg.scale.set(scale);
      
      // Căn giữa hình nền
      this.bg.x = w / 2 - (this.bg.texture.width * scale) / 2;
      this.bg.y = h / 2 - (this.bg.texture.height * scale) / 2;
    }
  }

  onResize(w, h) {
    this.drawBackground(w, h);
    
    // Tinh chỉnh tỷ lệ hiển thị
    const scale = Math.min(w / 450, h / 700, 1.2);
    this.title.scale.set(scale);
    
    let currentY = h * 0.12;
    this.title.x = w / 2;
    this.title.y = currentY;
    
    // Vẽ Bảng điểm
    const panelWidth = 320 * scale;
    const panelHeight = 360 * scale;
    const panelX = w / 2 - panelWidth / 2;
    const panelY = currentY + 120 * scale;
    
    this.scorePanel.clear();
    // Shadow cho panel
    this.scorePanel.roundRect(panelX, panelY + 5, panelWidth, panelHeight, 30).fill({ color: '#81D4FA', alpha: 0.5 });
    // Outline xanh nhạt
    this.scorePanel.roundRect(panelX - 4, panelY - 4, panelWidth + 8, panelHeight + 8, 34).fill('#4FC3F7');
    // Nền trắng
    this.scorePanel.roundRect(panelX, panelY, panelWidth, panelHeight, 30).fill('#FAFAFA');

    // Đường gạch ngang đứt khúc
    this.scorePanel.moveTo(panelX + 30, panelY + panelHeight / 2);
    this.scorePanel.lineTo(panelX + panelWidth - 30, panelY + panelHeight / 2);
    this.scorePanel.stroke({ color: '#E0E0E0', width: 2, cap: 'round', join: 'round', dash: [10, 10] });

    currentY = panelY + 45 * scale;
    
    // Nền Điểm số (Màu xanh dương)
    const lblW = 160 * scale;
    const lblH = 40 * scale;
    this.scoreLabelBg.clear()
        .roundRect(w/2 - lblW/2, currentY - lblH/2, lblW, lblH, lblH/2)
        .fill('#2196F3');
    this.scoreLabel.scale.set(scale);
    this.scoreLabel.x = w / 2;
    this.scoreLabel.y = currentY;

    currentY += 60 * scale;
    this.scoreText.scale.set(scale);
    this.scoreText.x = w / 2;
    this.scoreText.y = currentY;
    
    currentY += 95 * scale;
    
    // Nền Kỷ lục (Màu xanh lá)
    const bestLblW = 140 * scale;
    const bestLblH = 36 * scale;
    this.bestLabelBg.clear()
        .roundRect(w/2 - bestLblW/2, currentY - bestLblH/2, bestLblW, bestLblH, bestLblH/2)
        .fill('#8BC34A');
    this.bestLabel.scale.set(scale);
    this.bestLabel.x = w / 2;
    this.bestLabel.y = currentY;

    currentY += 60 * scale;
    this.bestScoreText.scale.set(scale);
    this.bestScoreText.x = w / 2;
    this.bestScoreText.y = currentY;

    // Các nút
    const btnY = w > h ? h * 0.8 : h * 0.75;

    this.replayBtn.scale.set(scale);
    this.replayBtn.x = w / 2 - 70 * scale;
    this.replayBtn.y = btnY;
    
    this.homeBtn.scale.set(scale);
    this.homeBtn.x = w / 2 + 70 * scale;
    this.homeBtn.y = btnY;
  }
}
