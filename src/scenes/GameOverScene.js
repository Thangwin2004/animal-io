import { Container, Graphics, Sprite, Text, TextStyle, FillGradient } from 'pixi.js';
import { IconBtn } from '../ui/Button.js';
import gsap from 'gsap';

export class GameOverScene {
  constructor(game) {
    this.game = game;
    this.container = new Container();

    this.bg = new Sprite();
    this.container.addChild(this.bg);

    // Dark overlay for background (Happy Casual: light blue, low alpha)
    this.overlay = new Graphics();
    this.container.addChild(this.overlay);

    // Bảng điểm (Score Panel)
    this.scorePanel = new Graphics();
    this.container.addChild(this.scorePanel);

    // Nền Divider
    this.dividerLine = new Graphics();
    this.container.addChild(this.dividerLine);

    // Labels style (All Lilita One)
    const labelStyle = new TextStyle({
      fontFamily: "'Nunito', 'Baloo 2', sans-serif", 
      fontSize: 26, 
      fill: '#ffffff',
      dropShadow: { color: 'rgba(0,0,0,0.25)', alpha: 1, distance: 2, blur: 0 }
    });

    const scoreNumStyle = new TextStyle({
      fontFamily: "'Nunito', 'Baloo 2', sans-serif", 
      fontSize: 90, 
      fill: '#1E88E5',
      stroke: { color: '#ffffff', width: 10, join: 'round' },
      dropShadow: { color: '#1565C0', alpha: 1, distance: 6, blur: 0 }
    });

    const bestGrad = new FillGradient(0, 0, 0, 80);
    bestGrad.addColorStop(0, '#FFE082');
    bestGrad.addColorStop(0.5, '#FFCA28');
    bestGrad.addColorStop(1, '#FF8F00');

    const bestNumStyle = new TextStyle({
      fontFamily: "'Nunito', 'Baloo 2', sans-serif", 
      fontSize: 60, 
      fill: bestGrad,
      stroke: { color: '#ffffff', width: 8, join: 'round' },
      dropShadow: { color: '#E65100', alpha: 1, distance: 6, blur: 0 }
    });

    // Ribbons for Labels
    this.scoreLabelBg = new Graphics();
    this.container.addChild(this.scoreLabelBg);
    this.scoreLabel = new Text({ text: 'ĐIỂM SỐ', style: labelStyle });
    this.scoreLabel.anchor.set(0.5);
    this.container.addChild(this.scoreLabel);

    this.scoreText = new Text({ text: '0', style: scoreNumStyle });
    this.scoreText.anchor.set(0.5);
    this.container.addChild(this.scoreText);
    
    this.bestLabelBg = new Graphics();
    this.container.addChild(this.bestLabelBg);
    this.bestLabel = new Text({ text: 'KỶ LỤC', style: labelStyle });
    this.bestLabel.anchor.set(0.5);
    this.container.addChild(this.bestLabel);

    this.bestScoreText = new Text({ text: '0', style: bestNumStyle });
    this.bestScoreText.anchor.set(0.5);
    this.container.addChild(this.bestScoreText);

    const titleStyle = new TextStyle({
      fontFamily: "'Nunito', 'Baloo 2', sans-serif", 
      fontSize: 70, 
      fill: '#FFB300', 
      stroke: { color: '#ffffff', width: 16, join: 'round' },
      dropShadow: { color: '#1565C0', alpha: 1, distance: 10, blur: 0 },
      letterSpacing: 2,
      align: 'center'
    });
    
    this.title = new Text({ text: 'ÔI TIẾC\nQUÁ!', style: titleStyle });
    this.title.anchor.set(0.5);
    this.container.addChild(this.title);

    // Buttons
    this.replayBtn = new IconBtn('replay', () => this.onReplayClick(), 40, '', 'yellow');
    this.container.addChild(this.replayBtn);
    
    this.homeBtn = new IconBtn('home', () => {
        this.game.audioManager.playSFX('click');
        this.game.switchScene('Menu');
    }, 40, '', 'blue');
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
    } else {
      this.title.text = 'ÔI TIẾC\nQUÁ!';
    }

    this.scoreText.text = `0`;
    this.bestScoreText.text = `${this.game.bestScore}`;
    
    this.onResize(this.game.app.screen.width, this.game.app.screen.height);
    
    this.playAnimations();
  }

  playAnimations() {
    const w = this.game.app.screen.width;
    const h = this.game.app.screen.height;
    const scale = Math.min(w / 450, h / 750, 1.2);
    
    // Animation for Title
    this.title.scale.set(0.8 * scale);
    gsap.to(this.title.scale, {
        x: 1 * scale,
        y: 1 * scale,
        duration: 0.6,
        ease: "back.out(1.5)"
    });

    // Animation for Panel
    this.scorePanel.y = 100;
    this.scorePanel.alpha = 0;
    gsap.to(this.scorePanel, { y: 0, alpha: 1, duration: 0.5, ease: "power2.out", delay: 0.1 });
    
    // Animate panel contents
    const elements = [this.scoreLabelBg, this.scoreLabel, this.scoreText, this.bestLabelBg, this.bestLabel, this.bestScoreText, this.dividerLine];
    elements.forEach(item => {
        const originalY = item.y;
        item.y += 100;
        item.alpha = 0;
        gsap.to(item, { y: originalY, alpha: 1, duration: 0.5, ease: "power2.out", delay: 0.1 });
    });

    // Animation for Score (Count up)
    let scoreObj = { val: 0 };
    gsap.to(scoreObj, {
        val: this.score,
        duration: 1.5,
        ease: "power2.out",
        delay: 0.4,
        onUpdate: () => {
            this.scoreText.text = Math.round(scoreObj.val).toString();
        }
    });

    // Animation for Buttons
    const replayBaseScale = this.replayBtn.scale.x; 
    this.replayBtn.scale.set(0);
    this.homeBtn.scale.set(0);

    gsap.to(this.replayBtn.scale, { x: replayBaseScale, y: replayBaseScale, duration: 0.5, ease: "back.out(1.5)", delay: 0.4 });
    gsap.to(this.homeBtn.scale, { x: replayBaseScale, y: replayBaseScale, duration: 0.5, ease: "back.out(1.5)", delay: 0.5 });
  }

  onReplayClick() {
    this.game.audioManager.playSFX('click');
    this.game.adManager.showInterstitial(() => {
        this.game.switchScene('Game');
    });
  }

  drawBackground(w, h) {
    if (this.bg && this.bg.texture) {
      const scale = Math.max(w / this.bg.texture.width, h / this.bg.texture.height);
      this.bg.scale.set(scale);
      this.bg.x = w / 2 - (this.bg.texture.width * scale) / 2;
      this.bg.y = h / 2 - (this.bg.texture.height * scale) / 2;
    }
    
    // Light Happy Casual Overlay - REMOVED to avoid washing out colors
    this.overlay.clear();
  }

  onResize(w, h) {
    // Kill any active tweens on resize so they don't fight with manual placement
    gsap.killTweensOf([this.scorePanel, this.title.scale, this.replayBtn.scale, this.homeBtn.scale, this.scoreLabelBg, this.scoreLabel, this.scoreText, this.bestLabelBg, this.bestLabel, this.bestScoreText, this.dividerLine]);

    this.drawBackground(w, h);
    
    const scale = Math.min(w / 450, h / 750, 1.2);
    this.title.scale.set(scale);
    
    let currentY = h * 0.12;
    this.title.x = w / 2;
    this.title.y = currentY;
    
    // Panel Spacing
    const panelWidth = 360 * scale;
    const panelHeight = 440 * scale; // Taller for spacing
    const panelX = w / 2 - panelWidth / 2;
    const panelY = currentY + 100 * scale;
    
    this.scorePanel.clear();
    this.scorePanel.y = 0;
    this.scorePanel.alpha = 1;

    // Drop shadow
    this.scorePanel.roundRect(panelX, panelY + 12 * scale, panelWidth, panelHeight, 30 * scale).fill({ color: '#8B4A00', alpha: 0.25 });
    
    // Border (#C89B54)
    this.scorePanel.roundRect(panelX - 5 * scale, panelY - 5 * scale, panelWidth + 10 * scale, panelHeight + 10 * scale, 35 * scale).fill('#C89B54');
    
    // Base Background (Bottom color)
    this.scorePanel.roundRect(panelX, panelY, panelWidth, panelHeight, 30 * scale).fill('#F6EAD7');
    
    // Inner Highlight / Top Color
    this.scorePanel.roundRect(panelX, panelY, panelWidth, panelHeight - 10 * scale, 30 * scale).fill('#FFFDF9');

    // Divider Line (────────★────────)
    const divY = panelY + panelHeight / 2 + 10 * scale;
    this.dividerLine.clear();
    this.dividerLine.y = 0;
    this.dividerLine.alpha = 1;
    this.dividerLine.moveTo(panelX + 40 * scale, divY);
    this.dividerLine.lineTo(panelX + panelWidth / 2 - 25 * scale, divY);
    this.dividerLine.moveTo(panelX + panelWidth / 2 + 25 * scale, divY);
    this.dividerLine.lineTo(panelX + panelWidth - 40 * scale, divY);
    this.dividerLine.stroke({ color: '#E7C66E', width: 4 * scale, cap: 'round' });
    // Draw Star
    this.dividerLine.star(w / 2, divY, 5, 12 * scale, 6 * scale).fill('#FFC107').stroke({ color: '#E7C66E', width: 2 * scale });

    currentY = panelY + 50 * scale;
    
    // --- Draw Score Ribbon (Blue) ---
    const lblW = 200 * scale;
    const lblH = 50 * scale;
    
    // Draw Blue Capsule for Score Label
    this.scoreLabelBg.clear()
        // Capsule
        .roundRect(w/2 - lblW/2, currentY - lblH/2, lblW, lblH, lblH/2)
        .fill('#4BA3E3');
    
    this.scoreLabelBg.y = 0;
    this.scoreLabelBg.alpha = 1;
        
    this.scoreLabel.scale.set(scale);
    this.scoreLabel.x = w / 2;
    this.scoreLabel.y = currentY;
    this.scoreLabel.alpha = 1;

    currentY += 75 * scale; // Spacing out
    this.scoreText.scale.set(scale);
    this.scoreText.x = w / 2;
    this.scoreText.y = currentY;
    this.scoreText.alpha = 1;
    
    currentY += 105 * scale; // Spacing out
    
    // --- Draw Best Score Ribbon (Orange/Gold) ---
    const bestLblW = 180 * scale;
    const bestLblH = 44 * scale;
    
    // Draw Green Capsule for Best Label
    this.bestLabelBg.clear()
        // Capsule
        .roundRect(w/2 - bestLblW/2, currentY - bestLblH/2, bestLblW, bestLblH, bestLblH/2)
        .fill('#85C75A');

    this.bestLabelBg.y = 0;
    this.bestLabelBg.alpha = 1;

    this.bestLabel.scale.set(scale);
    this.bestLabel.x = w / 2;
    this.bestLabel.y = currentY;
    this.bestLabel.alpha = 1;

    currentY += 65 * scale; // Spacing out
    this.bestScoreText.scale.set(scale);
    this.bestScoreText.x = w / 2;
    this.bestScoreText.y = currentY;
    this.bestScoreText.alpha = 1;

    // --- Buttons ---
    const btnY = panelY + panelHeight + 80 * scale; // More spacing

    this.replayBtn.scale.set(scale);
    this.replayBtn.x = w / 2 - 110 * scale;
    this.replayBtn.y = btnY;
    
    this.homeBtn.scale.set(scale);
    this.homeBtn.x = w / 2 + 110 * scale;
    this.homeBtn.y = btnY;
  }
}
