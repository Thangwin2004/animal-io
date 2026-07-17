import { Container, Graphics, Sprite, Text, TextStyle, FillGradient } from 'pixi.js';
import { IconBtn, Button } from '../ui/Button.js';

export class MenuScene {
  constructor(game) {
    this.game = game;
    this.container = new Container();

    this.bg = new Sprite(this.game.assetLoader.ui.menuBg);
    this.container.addChild(this.bg);

    this.bubbles = new Graphics();
    this.container.addChild(this.bubbles);

    this.titleContainer = new Container();
    this.container.addChild(this.titleContainer);

    const commonStyle = {
      fontFamily: "'Fredoka', 'Baloo 2', 'Be Vietnam Pro', sans-serif",
      fontWeight: '900',
      stroke: { color: '#ffffff', width: 22, join: 'round' }, 
      dropShadow: { color: '#1565C0', alpha: 1, distance: 10, blur: 0 }
    };

    const styleYellow = new TextStyle({
      ...commonStyle,
      fontSize: 130, 
      fill: '#FFB300'
    });

    this.textBo = new Text({ text: 'BỘ', style: styleYellow });
    this.textBo.anchor.set(0.5);
    this.textBo.x = 20;
    this.textBo.y = -60;

    this.textLac = new Text({ text: 'LẠC', style: styleYellow });
    this.textLac.anchor.set(0.5);
    this.textLac.x = -40;
    this.textLac.y = 50;

    const styleBlue = new TextStyle({
      ...commonStyle,
      fontSize: 70,
      fill: '#2196F3',
      stroke: { color: '#ffffff', width: 14, join: 'round' },
      dropShadow: { color: '#0D47A1', alpha: 1, distance: 6, blur: 0 }
    });

    this.textIo = new Text({ text: '.IO', style: styleBlue });
    this.textIo.anchor.set(0.5);
    this.textIo.x = 110;
    this.textIo.y = 85;

    // Thứ tự add quan trọng để chữ dưới đè stroke lên chữ trên như ảnh
    this.titleContainer.addChild(this.textBo);
    this.titleContainer.addChild(this.textLac);
    this.titleContainer.addChild(this.textIo);

    this.avatarIndex = 0;
    
    this.avatarSprite = new Sprite();
    this.avatarSprite.anchor.set(0.5);

    this.avatarSprite.eventMode = 'static';
    this.avatarSprite.cursor = 'pointer';
    this.avatarSprite.on('pointerdown', () => {
      this.avatarIndex = (this.avatarIndex + 1) % this.game.assetLoader.avatars.length;
      this.avatarSprite.texture = this.game.assetLoader.avatars[this.avatarIndex];
      if (this.updateAvatarScale) this.updateAvatarScale();
      this.game.audioManager.playSFX('click');
    });
    this.container.addChild(this.avatarSprite);

    // Nút Play
    this.playBtn = new Button("CHƠI NGAY", () => {
      this.game.audioManager.playSFX('click');
      this.game.switchScene('Game');
    }, 40); 
    this.container.addChild(this.playBtn);

    // Nút Cài đặt (Icon Button)
    this.settingsBtn = new IconBtn('gear', () => {
      this.game.audioManager.playSFX('click');
      this.game.overlayManager.showSettings();
    }, 35, '', 'blue');
    this.container.addChild(this.settingsBtn);

    // Nút Bảng Vàng (Icon Button)
    this.leaderboardBtn = new IconBtn('trophy', () => {
      this.game.audioManager.playSFX('click');
      this.game.overlayManager.showLeaderboard();
    }, 35, '', 'yellow');
    this.container.addChild(this.leaderboardBtn);
  }

  onEnter() {
    // Phát nhạc nền cho màn hình chính
    this.game.audioManager.playBGM('/assest/music/BGMM_Login.mp3', 0.05);

    if (this.game.assetLoader.avatars.length > 0) {
      this.avatarSprite.texture = this.game.assetLoader.avatars[this.avatarIndex];
      if (this.updateAvatarScale) this.updateAvatarScale();
    }
    
    if (this.game.assetLoader.ui.menuBg) {
      this.bg.texture = this.game.assetLoader.ui.menuBg;
      this.drawBackground(this.game.app.screen.width, this.game.app.screen.height);
    }
    
    this.avatarTimer = 0;
    this.elapsed = 0;
  }

  update(ticker) {
    if (this.game.assetLoader.avatars.length > 0) {
      this.avatarTimer += ticker.deltaTime;
      this.elapsed += ticker.deltaTime;
      
      // Avatar đứng giữa làng, nhịp thở nhẹ nhàng
      this.avatarSprite.y = this.game.app.screen.height * 0.56 + Math.sin(this.elapsed * 0.05) * 4;

      // Tự động chuyển nhân vật sau mỗi ~3 giây
      if (this.avatarTimer > 180) {
        this.avatarTimer = 0;
        this.avatarIndex = (this.avatarIndex + 1) % this.game.assetLoader.avatars.length;
        this.avatarSprite.texture = this.game.assetLoader.avatars[this.avatarIndex];
        if (this.updateAvatarScale) this.updateAvatarScale();
      }
    }
  }

  updateAvatarScale() {
    if (this.avatarSprite.texture && this.avatarSprite.texture.width > 0) {
      const w = this.game.app.screen.width;
      const h = this.game.app.screen.height;
      
      const texW = this.avatarSprite.texture.width;
      const texH = this.avatarSprite.texture.height;
      
      // Khống chế kích thước tối đa (50% chiều rộng, 35% chiều cao) để không che chữ hay nút
      const scaleX = (w * 0.5) / texW;
      const scaleY = (h * 0.35) / texH;
      const avatarScale = Math.min(scaleX, scaleY);
      
      this.avatarSprite.scale.set(avatarScale);
      
      // Mask đã được bỏ vì ảnh đã tách nền trong suốt      
    } else {
      this.avatarSprite.scale.set(0.5);
    }
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

    // Tinh chỉnh tỷ lệ hiển thị cho mobile (lấy mốc 500 thay vì 800 để nút to hơn trên đt)
    const scale = Math.min(w / 450, h / 700, 1.2);
    
    // Tiêu đề
    this.titleContainer.x = w / 2;
    this.titleContainer.y = h * 0.16;
    this.titleContainer.scale.set(scale * 0.8); // Giảm một chút vì font to ra

    // Kích thước Avatar
    this.updateAvatarScale();
    this.avatarSprite.x = w / 2;
    this.avatarSprite.y = h * 0.56; // Đứng ở giữa làng

    // Nút Play ở trên
    this.playBtn.scale.set(scale);
    this.playBtn.x = w / 2;
    this.playBtn.y = h * 0.74;

    // 2 Nút Icon ở dưới nút Play (nới khoảng cách ra để không bị đè do nút to lên)
    this.settingsBtn.scale.set(scale);
    this.settingsBtn.x = w / 2 + 110 * scale;
    this.settingsBtn.y = this.playBtn.y + 110 * scale;

    this.leaderboardBtn.scale.set(scale);
    this.leaderboardBtn.x = w / 2 - 110 * scale;
    this.leaderboardBtn.y = this.playBtn.y + 110 * scale;
  }
}
