import { Container, Graphics, Sprite, Text, TextStyle, FillGradient } from 'pixi.js';
import { IconBtn, Button } from '../ui/Button.js';

export class MenuScene {
  constructor(game) {
    this.game = game;
    this.container = new Container();

    this.bg = new Graphics();
    this.container.addChild(this.bg);

    this.bubbles = new Graphics();
    this.container.addChild(this.bubbles);

    const style = new TextStyle({
      fontFamily: "'Fredoka', 'Baloo 2', 'Be Vietnam Pro', sans-serif",
      fontSize: 80, 
      fill: '#FFB74D',
      stroke: { color: '#ffffff', width: 8, join: 'round' }, 
      dropShadow: { color: '#F57C00', alpha: 0.3, distance: 4, blur: 4 },
      letterSpacing: 2
    });

    this.title = new Text({ text: 'BỘ LẠC.IO', style });
    this.title.anchor.set(0.5);
    this.container.addChild(this.title);

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

    // Play Button (Tăng bán kính từ 35 lên 50)
    this.playBtn = new Button("CHƠI NGAY", () => {
      this.game.audioManager.playSFX('click');
      this.game.switchScene('Game');
    }, 50); 
    this.container.addChild(this.playBtn);

    // Settings
    this.settingsBtn = new IconBtn(null, () => {
      this.game.audioManager.playSFX('click');
      this.game.overlayManager.showSettings();
    });
    this.container.addChild(this.settingsBtn);

    // Leaderboard
    this.leaderboardBtn = new IconBtn(null, () => {
      this.game.audioManager.playSFX('click');
      this.game.overlayManager.showLeaderboard();
    });
    this.container.addChild(this.leaderboardBtn);
  }

  onEnter() {
    if (this.game.assetLoader.avatars.length > 0) {
      this.avatarSprite.texture = this.game.assetLoader.avatars[this.avatarIndex];
      if (this.updateAvatarScale) this.updateAvatarScale();
    }
    // Tăng bán kính các nút icon từ 36 lên 50
    this.settingsBtn.setTexture(this.game.assetLoader.ui.settingBtn, 50);
    this.leaderboardBtn.setTexture(this.game.assetLoader.ui.leaderboardBtn, 50);
    this.avatarTimer = 0;
    this.elapsed = 0;
  }

  update(ticker) {
    if (this.game.assetLoader.avatars.length > 0) {
      this.avatarTimer += ticker.deltaTime;
      this.elapsed += ticker.deltaTime;
      
      // Avatar bay lên xuống nhẹ nhàng
      this.avatarSprite.y = this.game.app.screen.height * 0.45 + Math.sin(this.elapsed * 0.05) * 10;

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

  onResize(w, h) {
    this.bg.clear().rect(0, 0, w, h).fill('#DDF4FF');

    // Vẽ bong bóng trang trí
    this.bubbles.clear();
    for(let i=0; i<12; i++) {
       const x = ((i * 37) % w);
       const y = ((i * 59) % h);
       const r = (i * 7 % 30) + 20;
       this.bubbles.circle(x, y, r).fill({ color: 0xffffff, alpha: 0.12 });
    }

    // Tinh chỉnh tỷ lệ hiển thị cho mobile (lấy mốc 500 thay vì 800 để nút to hơn trên đt)
    const scale = Math.min(w / 450, h / 700, 1.2);
    
    this.title.scale.set(scale);
    
    // Tiêu đề
    this.title.x = w / 2;
    this.title.y = h * 0.18;

    // Kích thước Avatar
    this.updateAvatarScale();
    this.avatarSprite.x = w / 2;
    this.avatarSprite.y = h * 0.45;

    // Nút Play ở trên
    this.playBtn.scale.set(scale);
    this.playBtn.x = w / 2;
    this.playBtn.y = h * 0.72;

    // 2 Nút Icon ở dưới nút Play (nới khoảng cách ra để không bị đè do nút to lên)
    this.settingsBtn.scale.set(scale);
    this.settingsBtn.x = w / 2 + 100 * scale;
    this.settingsBtn.y = h * 0.88;

    this.leaderboardBtn.scale.set(scale);
    this.leaderboardBtn.x = w / 2 - 100 * scale;
    this.leaderboardBtn.y = h * 0.88;
  }
}
