import { Container, Graphics, Text, TextStyle, Sprite, TilingSprite, Assets } from 'pixi.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Food } from '../entities/Food.js';
import { checkCircleCollision } from '../utils/math.js';
import { IconBtn } from '../ui/Button.js';
import { VirtualJoystick } from '../ui/Joystick.js';
import { winkGame } from '../integrations/wink/wink-adapter.js';

export class GameScene {
  constructor(game) {
    this.game = game;
    this.container = new Container();

    this.worldWidth = 2000;
    this.worldHeight = 3000;

    this.camera = new Container();
    this.container.addChild(this.camera);

    this.bgLayer = new Container();
    this.camera.addChild(this.bgLayer);

    this.gridGraphics = new Graphics();
    this.bgLayer.addChild(this.gridGraphics);
    this.drawGrid();

    this.entityLayer = new Container();
    this.entityLayer.sortableChildren = true;
    this.camera.addChild(this.entityLayer);

    this.vfxLayer = new Container();
    this.camera.addChild(this.vfxLayer);

    this.uiLayer = new Container();
    this.container.addChild(this.uiLayer);

    this.settingsBtn = new IconBtn('gear', () => {
      this.game.audioManager.playSFX('click');
      this.game.app.ticker.stop();
      this.game.overlayManager.showSettings(() => {
        this.game.app.ticker.start();
      }, true);
    }, 25, '', 'blue');
    this.uiLayer.addChild(this.settingsBtn);
    
    this.isBoosting = false;
    // Nút tăng tốc (bên phải dưới)
    this.boostBtn = new IconBtn('lightning', null, 50, '', 'orange');
    this.boostBtn.on('pointerdown', () => { this.isBoosting = true; });
    this.boostBtn.on('pointerup', () => { this.isBoosting = false; });
    this.boostBtn.on('pointerupoutside', () => { this.isBoosting = false; });
    this.uiLayer.addChild(this.boostBtn);

    this._onKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat) {
        this.isBoosting = true;
        if (this.boostBtn && this.boostBtn.content) {
          this.boostBtn.content.scale.set(0.95);
          this.boostBtn.content.y = this.boostBtn.currentR * 0.1;
        }
      }
    };
    
    this._onKeyUp = (e) => {
      if (e.code === 'Space') {
        this.isBoosting = false;
        if (this.boostBtn && this.boostBtn.content) {
          this.boostBtn.content.scale.set(1);
          this.boostBtn.content.y = 0;
        }
      }
    };

    this.player = null;
    this.enemies = [];
    this.foods = [];
    this.particles = [];

    this.joystick = new VirtualJoystick();
    this.uiLayer.addChild(this.joystick);
    this.joystickPointerId = null;

    this.container.eventMode = 'static';
    this.container.hitArea = { contains: () => true };
    
    this.container.on('pointerdown', (e) => {
      if (this.joystickPointerId !== null || !this.player || this.player.isDead) return;
      this.joystickPointerId = e.pointerId;
      this.joystick.showAt(e.global.x, e.global.y);
    });

    this.container.on('pointermove', (e) => {
      if (!this.player || this.player.isDead) return;
      
      if (this.joystickPointerId === e.pointerId) {
        this.joystick.updateKnob(e.global.x, e.global.y);
      } else if (this.joystickPointerId === null && e.pointerType === 'mouse') {
        const localPos = this.camera.toLocal(e.global);
        this.player.setTarget(localPos.x, localPos.y);
      }
    });

    this._pointerUp = (e) => {
      // Reset joystick nếu pointerId trùng khớp hoặc không xác định (từ global window event)
      if (this.joystickPointerId !== null && e.pointerId !== undefined && e.pointerId !== this.joystickPointerId) {
        return; // Bỏ qua nếu đây là ngón tay khác đang nhấc lên
      }
      this.joystickPointerId = null;
      this.joystick.hide();
      if (this.player && !this.player.isDead) {
        this.player.setTarget(this.player.x, this.player.y);
      }
    };
    this.container.on('pointerup', this._pointerUp);
    this.container.on('pointerupoutside', this._pointerUp);
    this.container.on('pointercancel', this._pointerUp); // Chống kẹt khi mất focus
    this.container.on('pointerout', this._pointerUp); // Chống kẹt khi vuốt ra ngoài mép màn hình

    this.enemyNames = ["Tom", "Jerry", "Mickey", "Donald", "Goofy", "Pluto", "Simba", "Nala", "Timon", "Pumbaa"];

    this.spritePool = [];

    this.createLeaderboard();
    this._initVFXTextures();
  }

  _initVFXTextures() {
    // Circle cho vụ nổ
    const circle = new Graphics();
    circle.circle(0, 0, 10).fill(0xFFFFFF); 
    this.texCircle = this.game.app.renderer.generateTexture(circle);

    // Mây cho poof
    const cloud = new Graphics();
    cloud.circle(0, 0, 15).fill('#ffffff');
    cloud.circle(10, 5, 10).fill('#ffffff');
    cloud.circle(-10, 5, 12).fill('#ffffff');
    this.texCloud = this.game.app.renderer.generateTexture(cloud);

    // Mảnh nứt nhỏ
    const frag = new Graphics();
    frag.circle(0, 0, 10).fill(0xFFFFFF);
    this.texFrag = this.game.app.renderer.generateTexture(frag);
    
    // Confetti
    const conf = new Graphics();
    conf.rect(-8, -4, 16, 8).fill(0xFFFFFF);
    this.texConfetti = this.game.app.renderer.generateTexture(conf);
  }

  createLeaderboard() {
    this.leaderboardContainer = new Container();
    
    // Nền mờ cho BXH
    const bg = new Graphics();
    bg.roundRect(0, 0, 240, 160, 15).fill({ color: 0x000000, alpha: 0 }); // alpha 0 = trong suốt
    this.leaderboardContainer.addChild(bg);
    
    // 4 dòng text (Top 1, 2, 3 và Bản thân)
    this.lbTexts = [];
    for(let i = 0; i < 4; i++) {
        const textStyle = new TextStyle({ 
          fontFamily: 'Arial', fontSize: 18, fill: '#FFFFFF', fontWeight: 'bold',
          stroke: { color: '#000000', width: 3, join: 'round' }
        });
        const text = new Text({ text: '', style: textStyle });
        text.x = 15;
        text.y = 10 + i * 25;
        this.leaderboardContainer.addChild(text);
        this.lbTexts.push(text);
    }
    
    this.uiLayer.addChild(this.leaderboardContainer);
  }

  drawGrid() {
    this.gridGraphics.clear();
    this.gridGraphics.rect(-800, -800, this.worldWidth + 1600, this.worldHeight + 1600).fill('#81C784');

    this.gridGraphics.setStrokeStyle({ width: 2, color: '#AED581', alpha: 0.5 });
    for (let i = 0; i <= this.worldWidth; i += 100) {
      this.gridGraphics.moveTo(i, 0).lineTo(i, this.worldHeight);
    }
    for (let i = 0; i <= this.worldHeight; i += 100) {
      this.gridGraphics.moveTo(0, i).lineTo(this.worldWidth, i);
    }
    this.gridGraphics.stroke();
  }

  drawForestBorders() {
    // 1. Tạo 1 Graphics cây thông gốc (scale = 1)
    const treeGraphics = new Graphics();
    treeGraphics.ellipse(0, 10, 30, 15).fill({ color: 0x000000, alpha: 0.3 });
    treeGraphics.rect(-6, -10, 12, 20).fill('#5D4037');
    treeGraphics.poly([0, -80, 40, 0, -40, 0]).fill('#1B5E20');
    treeGraphics.poly([0, -110, 35, -30, -35, -30]).fill('#2E7D32');
    treeGraphics.poly([0, -140, 30, -60, -30, -60]).fill('#388E3C');
    treeGraphics.poly([0, -140, 30, -60, 0, -60]).fill({ color: 0xffffff, alpha: 0.1 });
    treeGraphics.poly([0, -110, 35, -30, 0, -30]).fill({ color: 0xffffff, alpha: 0.1 });
    treeGraphics.poly([0, -80, 40, 0, 0, 0]).fill({ color: 0xffffff, alpha: 0.1 });

    // 2. Render thành Texture (Chỉ tốn chi phí 1 lần duy nhất để giải quyết Draw Calls)
    const treeTexture = this.game.app.renderer.generateTexture(treeGraphics);

    this.borderTrees = [];
    const drawPineTree = (x, y, scale = 1) => {
      const tree = new Sprite(treeTexture);
      // Tâm của bounding box Y: minY = -140, maxY = 25 -> chiều cao 165
      tree.anchor.set(0.5, 140 / 165); 
      tree.scale.set(scale);
      tree.x = x;
      tree.y = y;
      tree.zIndex = y + 10 * scale; 
      this.entityLayer.addChild(tree);
      this.borderTrees.push(tree);
    };

    // Mật độ cây phụ thuộc vào kích thước bản đồ
    const treeSpacing = 150;
    
    // Viền trên & dưới
    for (let x = 0; x <= this.worldWidth; x += treeSpacing) {
      drawPineTree(x + (Math.random() * 40 - 20), Math.random() * 40 + 20, 1.5 + Math.random() * 0.5); // Cạnh trên
      drawPineTree(x + (Math.random() * 40 - 20), this.worldHeight - (Math.random() * 40 + 20), 1.5 + Math.random() * 0.5); // Cạnh dưới
    }

    // Viền trái & phải
    for (let y = 0; y <= this.worldHeight; y += treeSpacing) {
      drawPineTree(Math.random() * 40 + 20, y + (Math.random() * 40 - 20), 1.5 + Math.random() * 0.5); // Cạnh trái
      drawPineTree(this.worldWidth - (Math.random() * 40 + 20), y + (Math.random() * 40 - 20), 1.5 + Math.random() * 0.5); // Cạnh phải
    }
  }

  onEnter(data) {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('pointerup', this._pointerUp);
    window.addEventListener('pointercancel', this._pointerUp);

    // ── Wink: start a new round ──
    this._winkRound = winkGame.startRound();
    
    // Chặn menu chuột phải để không gây lỗi kẹt joystick khi click chuột phải
    if (this.game.app.canvas) {
        this.game.app.canvas.addEventListener('contextmenu', e => e.preventDefault());
    }

    this.game.audioManager.playBGM('/assest/music/BGIG_Disco1.mp3');

    this.drawGrid();

    Assets.load('/assest/image/bg_game.png').then(texture => {
      if (this.isDestroyed) return;
      const bgSprite = new TilingSprite({
        texture: texture,
        width: this.worldWidth + 800,
        height: this.worldHeight + 800
      });
      bgSprite.x = -400;
      bgSprite.y = -400;
      // Thu nhỏ tile để các bụi cỏ/hoa trông tự nhiên và chi tiết hơn
      bgSprite.tileScale.set(0.6); 
      bgSprite.alpha = 0.35; // Làm mờ hình nền để nổi bật các object
      this.bgLayer.addChildAt(bgSprite, 1);
      // this.gridGraphics.visible = false; // Bỏ ẩn lưới để hiển thị nền xanh bên dưới
      this.drawForestBorders();
    }).catch(() => {
      console.log("Chưa có bg_game.png, tiếp tục dùng lưới mặc định");
    });

    this.camera.x = 0;
    this.camera.y = 0;
    this.enemies.forEach(e => e.container.destroy());
    this.foods.forEach(f => f.sprite.destroy());
    this.particles.forEach(p => p.destroy());
    this.particles = [];
    this.vfxLayer.removeChildren();

    if (this.player && this.player.container && !this.player.container.destroyed) {
      this.player.container.destroy();
    }

    this.enemies = [];
    this.foods = [];

    for (let i = 0; i < 15; i++) {
      this.spawnEnemy();
    }

    const testPlayerTex = this.game.assetLoader.ui.testPlayer || this.game.assetLoader.avatars[0];
    const safePos = this.getSafePosition();
    this.player = new Player(safePos.x, safePos.y, testPlayerTex, null);
    if (data && data.continue && data.score) {
      this.player.addScore(data.score);
    }
    this.entityLayer.addChild(this.player.container);
    this.player.isDead = false;
    this.hasRevived = false;

    for (let i = 0; i < 200; i++) {
      this.spawnFood();
    }

    this.onResize(this.game.app.screen.width, this.game.app.screen.height);
  }

  spawnEnemy() {
    const tex = this.game.assetLoader.avatars[Math.floor(Math.random() * this.game.assetLoader.avatars.length)];
    const name = tex.characterName || this.enemyNames[Math.floor(Math.random() * this.enemyNames.length)];
    const mountTex = this.game.assetLoader.ui.tuanNhun;

    let ex = 80 + Math.random() * (this.worldWidth - 160);
    let ey = 80 + Math.random() * (this.worldHeight - 160);

    if (this.player && !this.player.isDead) {
      for (let i = 0; i < 10; i++) {
        ex = 80 + Math.random() * (this.worldWidth - 160);
        ey = 80 + Math.random() * (this.worldHeight - 160);
        const dx = ex - this.player.x;
        const dy = ey - this.player.y;
        if (Math.sqrt(dx * dx + dy * dy) > 500) break;
      }
    }

    const enemy = new Enemy(ex, ey, tex, name, mountTex);
    enemy.addScore(Math.floor(Math.random() * 50));
    this.enemies.push(enemy);
    this.entityLayer.addChild(enemy.container);
  }

  spawnFood(specificX, specificY) {
    const safeLeft = 80;
    const safeRight = this.worldWidth - 80;
    const safeTop = 100;
    const safeBottom = this.worldHeight - 100;

    const x = specificX !== undefined ? specificX : (safeLeft + Math.random() * (safeRight - safeLeft));
    const y = specificY !== undefined ? specificY : (safeTop + Math.random() * (safeBottom - safeTop));
    const tex = this.game.assetLoader.items[Math.floor(Math.random() * this.game.assetLoader.items.length)];
    
    const isGolden = specificX === undefined && Math.random() < 0.02;
    const food = new Food(x, y, tex, isGolden);
    this.foods.push(food);
    food.sprite.zIndex = food.y;
    this.entityLayer.addChild(food.sprite);
  }

  // === VFX: Hạt nổ cơ bản ===
  createExplosion(x, y, count = 15, color = 0xFFD54F, sizeScale = 1) {
    for (let i = 0; i < count; i++) {
      let p = this.spritePool.length > 0 ? this.spritePool.pop() : new Sprite();
      p.texture = this.texCircle;
      p.isSprite = true;
      p.tint = color;
      p.anchor.set(0.5);
      // circle base r=10
      p.scale.set(((4 + Math.random() * 6) / 10) * sizeScale);
      p.x = x;
      p.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = (2 + Math.random() * 8) * sizeScale;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = 1.0;
      p.decay = 0.02 + Math.random() * 0.03;
      p.alpha = 1.0;
      p.rotation = 0;
      p._gravity = 0;
      p._spin = 0;
      p.dScale = 0;
      p._isLaunch = false;
      p._targetEat = null;
      p._isCrack = false;
      p._isScreenSmash = false;
      p._isVictoryOverlay = false;
      p._isVictoryRays = false;
      p._isVictorySmash = false;
      p._isConfetti = false;

      this.vfxLayer.addChild(p);
      this.particles.push(p);
    }
  }

  shakeCamera(duration = 10) {
    this.shakeTime = duration;
  }

  // === VFX: Text bay lên ===
  createFloatingText(x, y, text, color = '#FFD54F') {
    const style = new TextStyle({
      fontFamily: 'Arial', fontSize: 48, fill: color, fontWeight: 'bold', stroke: { color: '#000000', width: 6 }
    });
    const t = new Text({ text, style });
    t.anchor.set(0.5);
    t.x = x;
    t.y = y - 10;
    t.vy = -1;
    t.life = 1.0;
    t.decay = 0.02;
    t.scale.set(0.2);
    t.dScale = 0.1;
    this.vfxLayer.addChild(t);
    this.particles.push(t);
  }

  // Clamp a world position to stay inside the visible world bounds
  clampToWorld(x, y) {
    const cx = Math.max(0, Math.min(this.worldWidth, x));
    const cy = Math.max(0, Math.min(this.worldHeight, y));
    return { x: cx, y: cy };
  }

  // === VFX: Vòng sóng xung kích (Shockwave Ring) ===
  createShockwaveRing(x, y, color = 0xFFFFFF, maxRadius = 120) {
    const ring = new Graphics();
    ring.circle(0, 0, 10).stroke({ width: 6, color });
    ring.x = x;
    ring.y = y;
    ring.life = 1.0;
    ring.decay = 0.025;
    ring.vx = 0;
    ring.vy = 0;
    ring._isRing = true;
    ring._maxRadius = maxRadius;
    ring._startRadius = 10;
    this.vfxLayer.addChild(ring);
    this.particles.push(ring);
  }

  // === VFX: Hiệu ứng POOF (Kiểu comic đạp văng) ===
  createPoofEffect(x, y, sizeScale = 1) {
    // 1. Chữ "POOF!"
    const style = new TextStyle({
      fontFamily: "'Fredoka', 'Baloo 2', 'Be Vietnam Pro', sans-serif",
      fontSize: 50,
      fill: '#ffffff',
      fontWeight: '900',
      stroke: { color: '#607D8B', width: 6, join: 'round' },
      dropShadow: { color: '#1565C0', alpha: 1, distance: 4, blur: 0 },
      align: 'center'
    });
    const poofText = new Text({ text: 'POOF!', style });
    poofText.anchor.set(0.5);
    poofText.x = x;
    poofText.y = y - 20 * sizeScale;
    poofText.vy = -1; // trôi lên nhẹ
    poofText.life = 1.0;
    poofText.decay = 0.03; // ~33 frames
    poofText.scale.set(0.5 * sizeScale);
    poofText.dScale = 0.05; // Phóng to dần đến 1.2
    this.vfxLayer.addChild(poofText);
    this.particles.push(poofText);

    // 2. Khói bụi trắng (Clouds)
    for (let i = 0; i < 8; i++) {
      let cloud = this.spritePool.length > 0 ? this.spritePool.pop() : new Sprite();
      cloud.texture = this.texCloud;
      cloud.isSprite = true;
      cloud.tint = 0xFFFFFF;
      cloud.anchor.set(0.5);
      cloud.x = x + (Math.random() - 0.5) * 40 * sizeScale;
      cloud.y = y + (Math.random() - 0.5) * 40 * sizeScale;

      const angle = Math.random() * Math.PI * 2;
      const speed = (3 + Math.random() * 5) * sizeScale;
      cloud.vx = Math.cos(angle) * speed;
      cloud.vy = Math.sin(angle) * speed;

      cloud.scale.set((0.4 + Math.random() * 0.4) * sizeScale);
      cloud.life = 1.0;
      cloud.decay = 0.03 + Math.random() * 0.02;
      
      cloud.alpha = 1.0;
      cloud.rotation = 0;
      cloud._gravity = 0;
      cloud._spin = 0;
      cloud.dScale = 0;
      cloud._isLaunch = false;
      cloud._targetEat = null;
      cloud._isCrack = false;
      cloud._isScreenSmash = false;
      cloud._isVictoryOverlay = false;
      cloud._isVictoryRays = false;
      cloud._isVictorySmash = false;
      cloud._isConfetti = false;

      this.vfxLayer.addChild(cloud);
      this.particles.push(cloud);
    }
  }



  // === VFX: Hiệu ứng bị húc ngã khi cưỡi thú nhún ===
  createCollapseEffect(x, y, victimEntity, attackerX, attackerY) {
    const ghost = new Container();
    ghost.x = x;
    ghost.y = y;

    // Clone body từ victim (thú nhún + người cưỡi)
    if (victimEntity.mountSprite && victimEntity.mountSprite.texture) {
      const mountGhost = new Sprite(victimEntity.mountSprite.texture);
      mountGhost.anchor.set(0.5, 0.8);
      mountGhost.scale.set(victimEntity.mountSprite.scale.x, victimEntity.mountSprite.scale.y);
      ghost.addChild(mountGhost);
    }
    if (victimEntity.sprite && victimEntity.sprite.texture) {
      const riderGhost = new Sprite(victimEntity.sprite.texture);
      riderGhost.anchor.set(0.5);
      riderGhost.scale.set(victimEntity.baseScale * (victimEntity.sizeScale || 1));
      riderGhost.y = -80 * (victimEntity.sizeScale || 1);
      ghost.addChild(riderGhost);
    }

    const vs = victimEntity.sizeScale || 1;
    ghost.scale.set(vs, vs);
    ghost.alpha = 1.0;

    // Tính hướng bị húc: ghost bay ngược lại so với attacker
    let knockDirX = 0;
    let knockDirY = 0;
    if (attackerX !== undefined && attackerY !== undefined) {
      const kdx = x - attackerX;
      const kdy = y - attackerY;
      const kDist = Math.sqrt(kdx * kdx + kdy * kdy) || 1;
      knockDirX = kdx / kDist;
      knockDirY = kdy / kDist;
    } else {
      const randAngle = Math.random() * Math.PI * 2;
      knockDirX = Math.cos(randAngle);
      knockDirY = Math.sin(randAngle);
    }

    // Animation params (Kicked away style)
    ghost.life = 1.0;
    ghost.decay = 0.02; // Chết nhanh hơn một chút
    // Bắn văng đi xa và cao
    ghost.vx = knockDirX * (12 + Math.random() * 4) * vs;
    ghost.vy = -15 - Math.random() * 5; // Bắn bổng

    ghost._isLaunch = true;
    ghost._timer = 0;
    // Bị đá văng thì nghiêng người ra sau
    ghost.rotation = knockDirX > 0 ? 0.5 : -0.5;
    // Xoay thêm rất nhẹ để tạo cảm giác bay
    ghost._spin = knockDirX > 0 ? 0.05 : -0.05;
    ghost._gravity = 0.9;

    this.vfxLayer.addChild(ghost);
    this.particles.push(ghost);

    // Vài mảnh vỡ bắn ra theo hướng bị húc
    const fragColors = [0xFFCDD2, 0xEF9A9A, 0xE57373];
    for (let i = 0; i < 5; i++) {
      const frag = new Sprite(this.texFrag);
      const fc = fragColors[Math.floor(Math.random() * fragColors.length)];
      frag.tint = fc;
      frag.anchor.set(0.5);
      const fragSize = (2 + Math.random() * 4) * vs;
      frag.scale.set(fragSize / 10);
      frag.x = x;
      frag.y = y - 20 * vs;
      // Mảnh bay theo hướng húc + random
      frag.vx = knockDirX * (3 + Math.random() * 4) + (Math.random() - 0.5) * 3;
      frag.vy = -2 - Math.random() * 4;
      frag._gravity = 0.25;
      frag._spin = (Math.random() - 0.5) * 0.15;
      frag.life = 0.6 + Math.random() * 0.3;
      frag.decay = 0.025;
      this.vfxLayer.addChild(frag);
      this.particles.push(frag);
    }
  }

  // === VFX: Hiệu ứng khi player ăn enemy ===
  createKillEffect(victimX, victimY, victimEntity, scoreGained, attackerX, attackerY) {
    const pos = this.clampToWorld(victimX, victimY);

    // 1. Hiệu ứng chữ POOF! và khói bụi
    this.createPoofEffect(pos.x, pos.y - 20, victimEntity.sizeScale || 1);

    // 2. Hiệu ứng bị húc văng đi (Launch) của nạn nhân
    if (victimEntity) {
      this.createCollapseEffect(pos.x, pos.y + 40 * (victimEntity.sizeScale || 1), victimEntity, attackerX, attackerY);
    }

    // 3. Text điểm cộng
    if (scoreGained > 0) {
      const attackerHead = this.clampToWorld(
        this.player.x,
        this.player.y - 140 * (this.player.sizeScale || 1)
      );
      this.createFloatingText(attackerHead.x, attackerHead.y, '+' + scoreGained, '#FFD740');
    }
  }

  // === VFX: Hiệu ứng khi enemy ăn enemy (nhẹ hơn) ===
  createEnemyKillEffect(victimX, victimY, victimEntity, attackerX, attackerY) {
    const pos = this.clampToWorld(victimX, victimY);

    // 1. Hiệu ứng POOF! 
    this.createPoofEffect(pos.x, pos.y - 20, (victimEntity.sizeScale || 1) * 0.8);

    // 2. Hiệu ứng bị húc văng đi
    if (victimEntity) {
      this.createCollapseEffect(pos.x, pos.y + 40 * (victimEntity.sizeScale || 1), victimEntity, attackerX, attackerY);
    }
  }

  // === VFX: Hiệu ứng player bị chết ===
  createPlayerDeathEffect(x, y, attackerX, attackerY) {
    const pos = this.clampToWorld(x, y);

    const playerGhost = new Container();
    
    if (this.player.mountSprite && this.player.mountSprite.texture) {
      const mountGhost = new Sprite(this.player.mountSprite.texture);
      mountGhost.anchor.set(0.5, 1.0);
      // Dời trọng tâm của container vào thân nhân vật (ở khoảng giữa)
      mountGhost.y = 80;
      playerGhost.addChild(mountGhost);
    }
    
    const riderGhost = new Sprite(this.player.sprite.texture);
    riderGhost.anchor.set(0.5, 0.5);
    riderGhost.scale.set(this.player.baseScale); // Chỉ dùng baseScale, vì container sẽ được scale
    riderGhost.y = 0; // Dời theo chân thú cưỡi (80 - 80 = 0)
    playerGhost.addChild(riderGhost);
    
    const vs = this.player.sizeScale || 1;
    playerGhost.scale.set(vs);
    
    // Đưa vào uiLayer để nó không bị di chuyển theo camera nữa, tạo hiệu ứng dính vào màn hình
    // Lưu ý: phải trừ đi 80 * vs * camera.scale để bù lại phần offset trọng tâm
    const screenX = this.camera.x + pos.x * this.camera.scale.x;
    const screenY = this.camera.y + (pos.y - 80 * vs) * this.camera.scale.y;
    
    playerGhost.x = screenX;
    playerGhost.y = screenY;
    
    // Tính hướng văng: bay về giữa màn hình
    const targetX = this.game.app.screen.width / 2;
    const targetY = this.game.app.screen.height / 2;
    
    playerGhost._isScreenSmash = true;
    playerGhost._timer = 0;
    playerGhost._startX = screenX;
    playerGhost._startY = screenY;
    playerGhost._targetX = targetX;
    playerGhost._targetY = targetY;
    playerGhost._startScale = vs;
    
    // Tính toán targetScale linh động theo kích thước màn hình để không bị tràn trên điện thoại
    const minScreenDim = Math.min(this.game.app.screen.width, this.game.app.screen.height);
    playerGhost._targetScale = (minScreenDim * 0.7) / 70; // Cố định kích thước bằng khoảng 70% chiều nhỏ nhất của màn hình
    
    // Không cho xoay vòng vòng nữa, chỉ đặt góc ngẫu nhiên ban đầu để giống bị ném thẳng vào tường
    playerGhost.rotation = (Math.random() - 0.5) * 0.3;
    
    this.uiLayer.addChild(playerGhost);
    this.particles.push(playerGhost);
  }

  createConfetti() {
    const colors = [0xFFD700, 0xFF9800, 0xFF5722, 0x4CAF50, 0x2196F3, 0x9C27B0, 0xE91E63];
    for (let i = 0; i < 30; i++) {
      const conf = new Sprite(this.texConfetti);
      conf.anchor.set(0.5);
      const color = colors[Math.floor(Math.random() * colors.length)];
      conf.tint = color;
      
      conf.x = this.game.app.screen.width / 2;
      conf.y = this.game.app.screen.height / 2;
      
      const angle = Math.random() * Math.PI * 2;
      const speed = 10 + Math.random() * 20;
      conf.vx = Math.cos(angle) * speed;
      conf.vy = Math.sin(angle) * speed - 15;
      conf._gravity = 0.5;
      conf._spin = (Math.random() - 0.5) * 0.5;
      conf.life = 2.0;
      conf.decay = 0.015 + Math.random() * 0.02;
      conf._isConfetti = true;
      
      this.uiLayer.addChild(conf);
      this.particles.push(conf);
    }
  }

  // === VFX: Hiệu ứng chiến thắng khổng lồ ===
  createVictoryEffect() {
    const pos = this.clampToWorld(this.player.x, this.player.y);

    // Đóng băng mọi kẻ địch
    this.enemies.forEach(e => {
        e.isDead = true;
    });

    // 1. Overlay tối màn hình để làm nổi bật nhân vật
    const darkOverlay = new Graphics();
    darkOverlay.rect(0, 0, this.game.app.screen.width, this.game.app.screen.height).fill({color: 0x000000, alpha: 0});
    this.uiLayer.addChild(darkOverlay);
    darkOverlay._isVictoryOverlay = true;
    this.particles.push(darkOverlay);

    // 2. Tia sáng lấp lánh (God rays) phía sau nhân vật
    const rayContainer = new Container();
    rayContainer.x = this.game.app.screen.width / 2;
    rayContainer.y = this.game.app.screen.height / 2; // Căn giữa
    this.uiLayer.addChild(rayContainer);
    
    for(let i = 0; i < 16; i++) {
      const ray = new Graphics();
      ray.moveTo(-30, 0);
      ray.lineTo(30, 0);
      ray.lineTo(0, -2000); // Tia rất dài để lấp đầy màn hình
      ray.fill({color: 0xFFD700, alpha: 0.3}); // Màu vàng hoàng kim
      ray.rotation = (Math.PI * 2 / 16) * i;
      rayContainer.addChild(ray);
    }
    rayContainer._isVictoryRays = true;
    rayContainer.scale.set(0); // Ban đầu nhỏ, sau đó phóng to ra
    this.particles.push(rayContainer);

    // 3. Nhân vật trung tâm
    const playerGhost = new Container();
    if (this.player.mountSprite && this.player.mountSprite.texture) {
      const mountGhost = new Sprite(this.player.mountSprite.texture);
      mountGhost.anchor.set(0.5, 1.0);
      mountGhost.y = 80;
      playerGhost.addChild(mountGhost);
    }
    
    const riderGhost = new Sprite(this.player.sprite.texture);
    riderGhost.anchor.set(0.5, 0.5);
    riderGhost.scale.set(this.player.baseScale);
    riderGhost.y = 0;
    playerGhost.addChild(riderGhost);
    
    const vs = this.player.sizeScale || 1;
    playerGhost.scale.set(vs);
    
    const screenX = this.camera.x + pos.x * this.camera.scale.x;
    const screenY = this.camera.y + (pos.y - 80 * vs) * this.camera.scale.y;
    
    playerGhost.x = screenX;
    playerGhost.y = screenY;
    
    const targetX = this.game.app.screen.width / 2;
    const targetY = this.game.app.screen.height / 2 + 120; // Hơi thấp xuống 1 chút
    
    playerGhost._isVictorySmash = true;
    playerGhost._timer = 0;
    playerGhost._startX = screenX;
    playerGhost._startY = screenY;
    playerGhost._targetX = targetX;
    playerGhost._targetY = targetY;
    playerGhost._startScale = vs;
    
    // Đồng bộ với mọi kích thước màn hình, chiến thắng thì to hơn một chút (~80%)
    const minScreenDim = Math.min(this.game.app.screen.width, this.game.app.screen.height);
    playerGhost._targetScale = (minScreenDim * 0.8) / 70; 
    
    this.uiLayer.addChild(playerGhost);
    this.particles.push(playerGhost);

    this.createConfetti();
  }

  createGlassCrack(x, y) {
    const crack = new Graphics();
    
    // Vẽ tâm nứt
    crack.circle(x, y, 10).fill({color: 0xffffff, alpha: 0.8});
    
    // Vẽ các đường nứt (mạng nhện)
    const numCracks = 10 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numCracks; i++) {
      const angle = (Math.PI * 2 / numCracks) * i + (Math.random() - 0.5);
      const length = 200 + Math.random() * 300;
      
      let currX = x;
      let currY = y;
      
      crack.moveTo(currX, currY);
      
      let segments = 3 + Math.floor(Math.random() * 3);
      for (let j = 0; j < segments; j++) {
        const segLen = length / segments;
        const segAngle = angle + (Math.random() - 0.5) * 0.8;
        currX += Math.cos(segAngle) * segLen;
        currY += Math.sin(segAngle) * segLen;
        
        // Độ dày giảm dần
        crack.lineTo(currX, currY).stroke({ color: 0xffffff, width: 5 - (j/segments)*4, alpha: 0.9 });
      }
    }
    
    crack._isCrack = true;
    crack.life = 1.0;
    crack.decay = 0.005; // Tồn tại khá lâu
    this.uiLayer.addChildAt(crack, 0); // Vẽ dưới con vật bị văng vào màn hình
    this.particles.push(crack);
  }

  // Unified death effect for any entity (explosion + optional floating text) - giữ cho tương thích
  createDeathEffect(x, y, scoreText = null, color = '#ff3333') {
    const pos = this.clampToWorld(x, y);
    this.createExplosion(pos.x, pos.y, 30, 0xffaa00, 1.5);
    if (scoreText) {
      this.createFloatingText(pos.x, pos.y, scoreText, color);
    }
  }

  _recycleParticle(p, i, layer) {
    layer.removeChild(p);
    if (p.isSprite && this.spritePool.length < 300) {
      this.spritePool.push(p);
    } else {
      p.destroy();
    }
    this.particles.splice(i, 1);
  }

  // === Particle update loop (tách riêng để dùng cả khi player chết) ===
  _updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Shockwave ring: mở rộng và mờ dần
      if (p._isRing) {
        const progress = 1 - p.life;
        const currentRadius = p._startRadius + (p._maxRadius - p._startRadius) * progress;
        const scaleRatio = currentRadius / p._startRadius;
        p.scale.set(scaleRatio);
        p.life -= p.decay;
        p.alpha = Math.max(0, p.life * 0.7);
        if (p.life <= 0) {
          this.vfxLayer.removeChild(p);
          p.destroy();
          this.particles.splice(i, 1);
        }
        continue;
      }

      // Vết nứt màn hình
      if (p._isCrack) {
        p.life -= p.decay;
        p.alpha = Math.max(0, p.life);
        if (p.life <= 0) {
          this._recycleParticle(p, i, this.uiLayer);
        }
        continue;
      }

      // Hiệu ứng đập vào màn hình (Screen Smash)
      if (p._isScreenSmash) {
        p._timer++;
        const duration = 20; // Bay tới màn hình trong 20 khung hình
        const progress = Math.min(1, p._timer / duration);
        
        // Ease In: bay nhanh dần
        const ease = progress * progress * progress;
        
        p.x = p._startX + (p._targetX - p._startX) * ease;
        p.y = p._startY + (p._targetY - p._startY) * ease;
        p.scale.set(p._startScale + (p._targetScale - p._startScale) * ease);
        // Bỏ lệnh p.rotation += 0.05 để nhân vật bay thẳng, không xoay như chong chóng
        
        if (p._timer === duration) {
          // Va đập màn hình: Rung và nứt!
          this.game.audioManager.playSFX('die'); 
          this.shakeCamera(40);
          this.createGlassCrack(p.x, p.y);
        }
        
        if (p._timer > duration) {
          // Dính trên màn hình, sau đó từ từ trượt xuống
          if (p._timer > duration + 30) {
            p.y += (p._timer - (duration + 30)) * 1.5;
            p.alpha -= 0.02; // Mờ dần khi rơi
          }
          if (p.alpha <= 0) {
            this._recycleParticle(p, i, this.uiLayer);
          }
        }
        continue;
      }

      // Overlay tối màn hình khi victory
      if (p._isVictoryOverlay) {
        if (p.alpha < 0.75) p.alpha += 0.02;
        continue;
      }

      // Xoay tia sáng lấp lánh sau lưng
      if (p._isVictoryRays) {
        if (p.scale.x < 1) {
            p.scale.x += 0.05;
            p.scale.y += 0.05;
        }
        p.rotation += 0.005; // Xoay chầm chậm rất uy nghi
        continue;
      }

      // Hiệu ứng chiến thắng (Victory Smash)
      if (p._isVictorySmash) {
        p._timer++;
        const duration = 60; // Bay tới trung tâm
        if (p._timer <= duration) {
            const progress = p._timer / duration;
            const ease = 1 - Math.pow(1 - progress, 3); // Ease out
            
            p.x = p._startX + (p._targetX - p._startX) * ease;
            p.y = p._startY + (p._targetY - p._startY) * ease;
            p.scale.set(p._startScale + (p._targetScale - p._startScale) * ease);
            p.rotation = Math.sin(progress * Math.PI * 4) * 0.1; // Lắc lư ăn mừng
        } else {
            // Đã tới giữa màn hình: Lơ lửng
            p.y = p._targetY + Math.sin((p._timer - duration) * 0.1) * 10;
            p.rotation = Math.sin((p._timer - duration) * 0.05) * 0.1;
        }

        // Bắn pháo hoa liên tục
        if (p._timer % 15 === 0) {
            this.createConfetti();
        }
        continue;
      }

      if (p._isConfetti) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p._gravity;
        p.rotation += p._spin;
        p.life -= p.decay;
        p.alpha = Math.max(0, p.life);
        if (p.life <= 0) {
            this._recycleParticle(p, i, this.uiLayer);
        }
        continue;
      }

      // Hiệu ứng văng lên không trung (Kicked away)
      if (p._isLaunch) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p._gravity;
        p.rotation += p._spin;

        // Nhỏ dần đi để tạo cảm giác bị đá bay ra xa (vào trong màn hình)
        p.scale.x *= 0.96;
        p.scale.y *= 0.96;

        p._timer++;

        // Mờ dần khá nhanh khi bắt đầu rơi xuống
        if (p.vy > 0) {
          p.alpha *= 0.85;
        }

        p.life -= p.decay;
        if (p.life <= 0 || p.alpha < 0.02) {
          this._recycleParticle(p, i, this.vfxLayer);
        }
        continue;
      }

      // Hiệu ứng bay thẳng vào mồm người chơi (Gulp/Eat)
      if (p._targetEat) {
        const target = p._targetEat;
        if (target.isDead) {
          this._recycleParticle(p, i, this.vfxLayer);
        } else {
          // Bay từ từ về phía miệng để người chơi kịp nhìn thấy
          const tx = target.x;
          const ty = target.y - 40 * (target.sizeScale || 1);
          p.x += (tx - p.x) * 0.06;
          p.y += (ty - p.y) * 0.06;
          
          // Thu nhỏ từ từ theo nhịp bay
          p.scale.x *= 0.92;
          p.scale.y *= 0.92;
          
          p.life -= p.decay;
          if (p.life <= 0 || p.scale.x < 0.05) {
            this._recycleParticle(p, i, this.vfxLayer);
          }
        }
        continue;
      }

      // Di chuyển cơ bản
      p.x += p.vx || 0;
      p.y += p.vy || 0;

      // Trọng lực
      if (p._gravity) {
        p.vy = (p.vy || 0) + p._gravity;
      }
      // Xoay tròn
      if (p._spin) {
        p.rotation += p._spin;
      }

      if (p.dScale) {
        const newScale = Math.max(0, Math.min(1.5, p.scale.x + p.dScale));
        p.scale.set(newScale);
      }
      p.life -= p.decay;
      p.alpha = Math.max(0, p.life);

      if (p.life <= 0) {
        this._recycleParticle(p, i, this.vfxLayer);
      }
    }
  }

  update() {
    if (!this.player) return;

    // Khi player chết: vẫn chạy particle VFX + camera shake, nhưng không di chuyển/va chạm
    if (this.player.isDead) {
      // Cập nhật particles khi đang chờ death animation
      this._updateParticles();
      // Cập nhật camera shake
      if (this.shakeTime > 0) {
        this.camera.x += (Math.random() - 0.5) * 20;
        this.camera.y += (Math.random() - 0.5) * 20;
        this.shakeTime--;
      }
      return;
    }

    // --- Cơ chế ẩn: Khi đạt 10.000 điểm -> Chiến thắng ---
    if (!this.player.isVictory && this.player.score >= 10000) {
      this.player.isVictory = true;
      this.player.isDead = true; // Ngừng điều khiển
      
      // Đổi thành playBGM để chặn nhạc nền cơ bản và phát nhạc Win
      // ── Wink: complete round + submit score ──
      if (this._winkRound) {
        winkGame.completeRound(this._winkRound, {
          metadata: { outcome: 'victory', score: this.player.score },
        });
        if (winkGame.canSubmitScore) {
          winkGame.submitFinalScore({
            score: this.player.score,
            playTime: Math.round((Date.now() - this._winkRound.startedAtMs) / 1000),
            gameMode: 'io',
          }).catch(() => {});
        }
      }

      this.game.audioManager.playBGM('/assest/music/EndGameWin.wav', 1.0); 
      this.player.container.visible = false;
      this.createVictoryEffect();
      
      setTimeout(() => {
        this.game.switchScene('GameOver', { score: this.player.score, isVictory: true });
      }, 4500); // Tăng thời gian hưởng thụ chiến thắng
      return;
    }

    if (this.joystick && this.joystick.visible && (this.joystick.vector.x !== 0 || this.joystick.vector.y !== 0)) {
      const moveDx = this.joystick.vector.x * 1000;
      const moveDy = this.joystick.vector.y * 1000;
      this.player.setTarget(this.player.x + moveDx, this.player.y + moveDy);
    }

    this.player.update(this.worldWidth, this.worldHeight, this.isBoosting);
    this.player.container.zIndex = this.player.container.y;

    this._updateParticles();

    const screenW = this.game.app.screen.width;
    const screenH = this.game.app.screen.height;

    // Zoom out động: Càng to thì camera càng lùi ra xa (nhưng lùi ít hơn để đỡ mờ)
    let activeScale = (this.baseCameraScale || 1) / Math.pow(this.player.sizeScale || 1, 0.25);

    // Ngưỡng zoom tối đa để không làm mờ nhân vật (không nhỏ hơn 75% zoom mặc định)
    const visualMinScale = (this.baseCameraScale || 1) * 0.75;

    // Ngưỡng zoom tối thiểu để map luôn lấp đầy màn hình (tránh lộ nền đen ngoài map, tính thêm vùng đệm)
    const padding = 250;
    const minScaleX = screenW / (this.worldWidth + padding * 2);
    const minScaleY = screenH / (this.worldHeight + padding * 2);
    const minActiveScale = Math.max(minScaleX, minScaleY);

    // Chốt lại activeScale không được nhỏ hơn cả 2 ngưỡng trên
    activeScale = Math.max(activeScale, visualMinScale, minActiveScale);
    this.camera.scale.set(activeScale);

    // Tính toán lại vị trí Camera có nhân với activeScale
    this.camera.x = screenW / 2 - this.player.x * activeScale;
    this.camera.y = screenH / 2 - this.player.y * activeScale;

    // Tính toán lại giới hạn Camera (cho phép nhìn thấy ngoài biên 250px)
    const maxCamX = padding * activeScale;
    const maxCamY = padding * activeScale;
    const minCamX = screenW - (this.worldWidth + padding) * activeScale;
    const minCamY = screenH - (this.worldHeight + padding) * activeScale;

    if (this.camera.x > maxCamX) this.camera.x = maxCamX;
    if (this.camera.y > maxCamY) this.camera.y = maxCamY;
    if (this.camera.x < minCamX) this.camera.x = minCamX;
    if (this.camera.y < minCamY) this.camera.y = minCamY;

    // Rung màn hình (Camera Shake)
    if (this.shakeTime > 0) {
      this.camera.x += (Math.random() - 0.5) * 20;
      this.camera.y += (Math.random() - 0.5) * 20;
      this.shakeTime--;
    }

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      enemy.update(this.worldWidth, this.worldHeight);
      enemy.container.zIndex = enemy.container.y;
      
      // Culling: Ẩn kẻ thù nếu nằm ngoài màn hình để tiết kiệm tài nguyên
      enemy.container.visible = this.isInViewport(enemy.x, enemy.y);
    }

    this.checkCollisions();



    let activeFoods = 0;
    for (const food of this.foods) {
      if (food.isDead) continue;
      activeFoods++;
      // Culling: Ẩn thức ăn nếu nằm ngoài màn hình
      food.sprite.visible = this.isInViewport(food.x, food.y);
    }

    // Culling cho border trees
    if (this.borderTrees) {
      for (let i = 0; i < this.borderTrees.length; i++) {
        const tree = this.borderTrees[i];
        tree.visible = this.isInViewport(tree.x, tree.y);
      }
    }
    
    if (activeFoods < 150) {
      this.spawnFood();
    }

    this.updateLeaderboard();
  }

  updateLeaderboard() {
    if (!this.leaderboardContainer || !this.player || this.player.isDead) return;
    
    // Throttling updates (Cập nhật BXH mỗi 15 frame để mượt mà nhưng ko tốn CPU)
    this._lbTimer = (this._lbTimer || 0) + 1;
    if (this._lbTimer < 15) return;
    this._lbTimer = 0;
    
    // Lọc các thực thể còn sống
    const entities = [...this.enemies.filter(e => !e.isDead), this.player];
    // Sắp xếp theo điểm giảm dần
    entities.sort((a, b) => b.score - a.score);
    
    let playerRank = entities.findIndex(e => e === this.player) + 1;
    
    // Hiển thị top 3
    for (let i = 0; i < 3; i++) {
        const e = entities[i];
        if (e) {
            this.lbTexts[i].text = `#${i+1} ${e.name} - ${Math.floor(e.score)}`;
            this.lbTexts[i].style.fill = (e === this.player) ? '#00FF00' : '#FFFFFF';
        } else {
            this.lbTexts[i].text = '';
        }
    }
    
    // Dòng 4: Hiển thị bản thân
    if (playerRank > 3) {
        this.lbTexts[3].text = `#${playerRank} ${this.player.name} - ${Math.floor(this.player.score)}`;
        this.lbTexts[3].style.fill = '#00FF00'; // Xanh lá nổi bật
    } else if (entities.length > 3) {
        // Nếu player đã trong top 3, dòng 4 hiện người đứng thứ 4
        const e = entities[3];
        this.lbTexts[3].text = `#4 ${e.name} - ${Math.floor(e.score)}`;
        this.lbTexts[3].style.fill = '#FFFFFF';
    } else {
        this.lbTexts[3].text = '';
    }
  }

  // Kiểm tra vị trí world có trong khung hình người chơi không
  isInViewport(worldX, worldY) {
    const screenW = this.game.app.screen.width;
    const screenH = this.game.app.screen.height;
    const scale = this.camera.scale.x || 1;
    // Chuyển world → screen
    const screenX = worldX * scale + this.camera.x;
    const screenY = worldY * scale + this.camera.y;
    const margin = 100; // Mở rộng 1 chút rìa
    return screenX > -margin && screenX < screenW + margin &&
      screenY > -margin && screenY < screenH + margin;
  }

  checkCollisions() {
    // Dịch tâm hitbox của Player lên giữa thân hình trực quan (thay vì ở dưới mỏ neo/chân)
    const pScale = this.player.sizeScale || 1;
    const pCx = this.player.x;
    const pCy = this.player.y - (40 * pScale);
    const pRadius = this.player.radius; // radius đã = 40*scale, không cần nhân thêm

    for (const food of this.foods) {
      if (food.isDead) continue;

      // Check va chạm bình thường (Chỉ player)
      const dx = pCx - food.x;
      const dy = pCy - food.y;
      const rSum = pRadius + food.radius;
      
      // AABB check trước khi tính khoảng cách
      if (Math.abs(dx) < rSum && Math.abs(dy) < rSum) {
        const distSq = dx*dx + dy*dy;
        // Ăn khi chạm vào
        if (distSq < rSum * rSum) {
           food.isDead = true;
           
           // Chuyển sprite thành hạt bay vào mồm
           this.entityLayer.removeChild(food.sprite);
           this.vfxLayer.addChild(food.sprite);
           food.sprite.life = 1.0;
           food.sprite.decay = 0.03; // Giảm decay để sống lâu hơn, bay từ từ vào mồm
           food.sprite._targetEat = this.player;
           this.particles.push(food.sprite);

           this.player.addScore(food.scoreValue);
           this.game.audioManager.playSFX('pop');
           continue;
        }
      }

      // Kẻ địch (máy) ăn
      for (const enemy of this.enemies) {
        if (enemy.isDead) continue;
        const eScale = enemy.sizeScale || 1;
        const eCx = enemy.x;
        const eCy = enemy.y - (40 * eScale);
        
        const edx = eCx - food.x;
        const edy = eCy - food.y;
        const erSum = enemy.radius + food.radius;
        
        // AABB check cho kẻ địch
        if (Math.abs(edx) < erSum && Math.abs(edy) < erSum) {
          const edistSq = edx*edx + edy*edy;
          if (edistSq < erSum * erSum) {
             food.isDead = true;
             
             // Chuyển sprite thành hạt bay vào mồm kẻ địch
             this.entityLayer.removeChild(food.sprite);
             this.vfxLayer.addChild(food.sprite);
             food.sprite.life = 1.0;
             food.sprite.decay = 0.03; // Giảm decay cho địch giống player
             food.sprite._targetEat = enemy;
             this.particles.push(food.sprite);
             
             enemy.addScore(food.scoreValue);
             this.playSoundAt('pop', food.x, food.y, 800);
             break;
          }
        }
      }
    }

    for (let i = this.foods.length - 1; i >= 0; i--) {
      if (this.foods[i].isDead) this.foods.splice(i, 1);
    }

// Check PVP Collisions (giữ hitbox PVP bình thường nhưng dời lên tâm thân)
for (const enemy of this.enemies) {
  if (enemy.isDead) continue;

  const eScale = enemy.sizeScale || 1;
  const eCx = enemy.x;
  const eCy = enemy.y - (40 * eScale);

  const dx = pCx - eCx;
  const dy = pCy - eCy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < this.player.radius + enemy.radius) {
    // Yêu cầu: khoảng cách 50 điểm mới đá được nhau nếu từ 100 điểm trở lên (dưới 100 thì 10 điểm)
    const requiredGap = Math.max(this.player.score, enemy.score) >= 100 ? 50 : 10;

    // --- LOGIC ĐÂM LÉN (BACKSTAB) ---
    const eMoveAngle = Math.atan2(enemy.targetY - enemy.y, enemy.targetX - enemy.x);
    const angleEtoP = Math.atan2(pCy - eCy, pCx - eCx);
    let diffE = Math.abs(eMoveAngle - angleEtoP);
    if (diffE > Math.PI) diffE = 2 * Math.PI - diffE;
    const isPlayerBehindEnemy = diffE > Math.PI * 0.7;

    let pMoveX = 0, pMoveY = 0;
    if (this.joystick && this.joystick.visible && (this.joystick.vector.x !== 0 || this.joystick.vector.y !== 0)) {
       pMoveX = this.joystick.vector.x;
       pMoveY = this.joystick.vector.y;
    } else {
       pMoveX = this.player.targetX - this.player.x;
       pMoveY = this.player.targetY - this.player.y;
    }
    const pMoveAngle = Math.atan2(pMoveY, pMoveX);
    const anglePtoE = Math.atan2(eCy - pCy, eCx - pCx);
    let diffP = Math.abs(pMoveAngle - anglePtoE);
    if (diffP > Math.PI) diffP = 2 * Math.PI - diffP;
    const isEnemyBehindPlayer = diffP > Math.PI * 0.7; 

    if (this.player.isBoosting && this.player.score < enemy.score + requiredGap && isPlayerBehindEnemy) {
        const penalty = Math.floor(Math.min(enemy.score * 0.1, 50));
        if (penalty >= 5) {
            enemy.addScore(-penalty);
            for (let k = 0; k < Math.min(15, penalty); k++) {
                const angle = Math.random() * Math.PI * 2;
                const dropDist = enemy.radius + 30 + Math.random() * 80;
                this.spawnFood(eCx + Math.cos(angle) * dropDist, eCy + Math.sin(angle) * dropDist);
            }
            this.createExplosion(eCx, eCy, 15, 0xff0000, 1.0);
            this.game.audioManager.playSFX('hit');
            this.player.x -= Math.cos(anglePtoE) * 80;
            this.player.y -= Math.sin(anglePtoE) * 80;
            continue; 
        }
    }

    if (enemy.isBoosting && enemy.score < this.player.score + requiredGap && isEnemyBehindPlayer) {
        const penalty = Math.floor(Math.min(this.player.score * 0.1, 50));
        if (penalty >= 5) {
            this.player.addScore(-penalty);
            for (let k = 0; k < Math.min(15, penalty); k++) {
                const angle = Math.random() * Math.PI * 2;
                const dropDist = this.player.radius + 30 + Math.random() * 80;
                this.spawnFood(pCx + Math.cos(angle) * dropDist, pCy + Math.sin(angle) * dropDist);
            }
            this.createExplosion(pCx, pCy, 15, 0xff0000, 1.0);
            this.shakeCamera(10);
            this.game.audioManager.playSFX('hit');
            enemy.x -= Math.cos(angleEtoP) * 80;
            enemy.y -= Math.sin(angleEtoP) * 80;
            continue; 
        }
    }
    // --- END ĐÂM LÉN ---

    if (this.player.score >= enemy.score + requiredGap && dist < this.player.radius) {
      const scoreGained = Math.floor(enemy.score / 2);
      // Lưu reference trước khi destroy
      const victimRef = {
        mountSprite: enemy.mountSprite,
        sprite: enemy.sprite,
        baseScale: enemy.baseScale,
        sizeScale: enemy.sizeScale || 1
      };
      enemy.isDead = true;
      this.entityLayer.removeChild(enemy.container);
      this.player.addScore(scoreGained);
      this.game.audioManager.playSFX('eat');
      this.shakeCamera(20);
      // Hiệu ứng hoành tráng khi player ăn enemy
      this.createKillEffect(eCx, eCy, victimRef, scoreGained, pCx, pCy);
      // Destroy container sau khi đã tạo VFX
      enemy.container.destroy();
    } else if (enemy.score >= this.player.score + requiredGap && dist < enemy.radius) {
      this.player.isDead = true;
      this.shakeCamera(25);

      // Ẩn nhân vật player, tạo hiệu ứng chết văng vào màn hình
      this.player.container.visible = false;
      this.createPlayerDeathEffect(pCx, pCy, eCx, eCy);

      // Chờ hiệu ứng bay vào màn hình (Khoảng 2s)
      setTimeout(() => {
        if (this.hasRevived) {
          // ── Wink: complete round + submit score ──
          if (this._winkRound) {
            winkGame.completeRound(this._winkRound, {
              metadata: { outcome: 'defeat', score: this.player.score },
            });
            if (winkGame.canSubmitScore) {
              winkGame.submitFinalScore({
                score: this.player.score,
                playTime: Math.round((Date.now() - this._winkRound.startedAtMs) / 1000),
                gameMode: 'io',
              }).catch(() => {});
            }
          }

          this.game.switchScene('GameOver', { score: this.player.score });
          return;
        }

        this.game.app.ticker.stop();

        this.game.overlayManager.showReviveOffer(
          () => {
            this.game.adManager.showRewardAd(
              () => {
                const safePos = this.getSafePosition();
                this.player.x = safePos.x;
                this.player.y = safePos.y;
                if (this.player.setTarget) {
                  this.player.setTarget(safePos.x, safePos.y);
                }
                this.player.container.visible = true;
                this.player.isDead = false;
                this.hasRevived = true;
                this.game.app.ticker.start();
              },
              () => {
                this.game.app.ticker.start();
                
                // ── Wink: complete round + submit score ──
                if (this._winkRound) {
                  winkGame.completeRound(this._winkRound, {
                    metadata: { outcome: 'defeat', score: this.player.score },
                  });
                  if (winkGame.canSubmitScore) {
                    winkGame.submitFinalScore({
                      score: this.player.score,
                      playTime: Math.round((Date.now() - this._winkRound.startedAtMs) / 1000),
                      gameMode: 'io',
                    }).catch(() => {});
                  }
                }

                this.game.switchScene('GameOver', { score: this.player.score });
              }
            );
          },
          () => {
            this.game.app.ticker.start();

            // ── Wink: complete round + submit score ──
            if (this._winkRound) {
              winkGame.completeRound(this._winkRound, {
                metadata: { outcome: 'defeat', score: this.player.score },
              });
              if (winkGame.canSubmitScore) {
                winkGame.submitFinalScore({
                  score: this.player.score,
                  playTime: Math.round((Date.now() - this._winkRound.startedAtMs) / 1000),
                  gameMode: 'io',
                }).catch(() => {});
              }
            }

            this.game.switchScene('GameOver', { score: this.player.score });
          }
        );
      }, 1500);
      return;
    } else if (Math.abs(this.player.score - enemy.score) < requiredGap) {
      // Bouncing if similar score
      const overlap = this.player.radius + enemy.radius - dist;
      if (overlap > 0) {
        const angle = Math.atan2(dy, dx);
        this.player.x += Math.cos(angle) * overlap * 0.5;
        this.player.y += Math.sin(angle) * overlap * 0.5;
        enemy.x -= Math.cos(angle) * overlap * 0.5;
        enemy.y -= Math.sin(angle) * overlap * 0.5;

        if (overlap > 2) {
          const now = Date.now();
          if (now - (this.lastBounceTime || 0) > 300) {
            this.game.audioManager.playSFX('bounce');
            this.lastBounceTime = now;
          }
        }
      }
    }
  }
}

for (let i = 0; i < this.enemies.length; i++) {
  const e1 = this.enemies[i];
  if (e1.isDead) continue;
  for (let j = i + 1; j < this.enemies.length; j++) {
    const e2 = this.enemies[j];
    if (e2.isDead) continue;

    const e1Scale = e1.sizeScale || 1;
    const e2Scale = e2.sizeScale || 1;

    const e1Cx = e1.x;
    const e1Cy = e1.y - 40 * e1Scale;
    const e2Cx = e2.x;
    const e2Cy = e2.y - 40 * e2Scale;

    const dx = e1Cx - e2Cx;
    const dy = e1Cy - e2Cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < e1.radius + e2.radius) {
      const requiredGap = Math.max(e1.score, e2.score) >= 100 ? 50 : 10;

      // --- LOGIC ĐÂM LÉN (Enemy vs Enemy) ---
      const e1MoveAngle = Math.atan2(e1.targetY - e1.y, e1.targetX - e1.x);
      const angleE1toE2 = Math.atan2(e2Cy - e1Cy, e2Cx - e1Cx);
      let diffE1 = Math.abs(e1MoveAngle - angleE1toE2);
      if (diffE1 > Math.PI) diffE1 = 2 * Math.PI - diffE1;
      const isE2BehindE1 = diffE1 > Math.PI * 0.7;

      const e2MoveAngle = Math.atan2(e2.targetY - e2.y, e2.targetX - e2.x);
      const angleE2toE1 = Math.atan2(e1Cy - e2Cy, e1Cx - e2Cx);
      let diffE2 = Math.abs(e2MoveAngle - angleE2toE1);
      if (diffE2 > Math.PI) diffE2 = 2 * Math.PI - diffE2;
      const isE1BehindE2 = diffE2 > Math.PI * 0.7;

      if (e1.isBoosting && e1.score < e2.score + requiredGap && isE1BehindE2) {
          const penalty = Math.floor(Math.min(e2.score * 0.1, 50));
          if (penalty >= 5) {
              e2.addScore(-penalty);
              for (let k = 0; k < Math.min(10, penalty); k++) {
                  const angle = Math.random() * Math.PI * 2;
                  const dropDist = e2.radius + 30 + Math.random() * 80;
                  this.spawnFood(e2Cx + Math.cos(angle) * dropDist, e2Cy + Math.sin(angle) * dropDist);
              }
              this.createExplosion(e2Cx, e2Cy, 15, 0xff0000, 1.0);
              if (this.isInViewport(e2Cx, e2Cy)) this.playSoundAt('hit', e2Cx, e2Cy);
              e1.x -= Math.cos(angleE1toE2) * 80;
              e1.y -= Math.sin(angleE1toE2) * 80;
              continue;
          }
      }

      if (e2.isBoosting && e2.score < e1.score + requiredGap && isE2BehindE1) {
          const penalty = Math.floor(Math.min(e1.score * 0.1, 50));
          if (penalty >= 5) {
              e1.addScore(-penalty);
              for (let k = 0; k < Math.min(10, penalty); k++) {
                  const angle = Math.random() * Math.PI * 2;
                  const dropDist = e1.radius + 30 + Math.random() * 80;
                  this.spawnFood(e1Cx + Math.cos(angle) * dropDist, e1Cy + Math.sin(angle) * dropDist);
              }
              this.createExplosion(e1Cx, e1Cy, 15, 0xff0000, 1.0);
              if (this.isInViewport(e1Cx, e1Cy)) this.playSoundAt('hit', e1Cx, e1Cy);
              e2.x -= Math.cos(angleE2toE1) * 80;
              e2.y -= Math.sin(angleE2toE1) * 80;
              continue;
          }
      }
      // --- END ĐÂM LÉN ---

      if (e1.score >= e2.score + requiredGap && dist < e1.radius) {
        const scoreGained = Math.floor(e2.score / 2);
        const victimRef = {
          mountSprite: e2.mountSprite,
          sprite: e2.sprite,
          baseScale: e2.baseScale,
          sizeScale: e2.sizeScale || 1
        };
        e2.isDead = true;
        this.entityLayer.removeChild(e2.container);
        e1.addScore(scoreGained);
        
        e1.health = 100;
        
        if (this.isInViewport(e2Cx, e2Cy)) {
          this.createEnemyKillEffect(e2Cx, e2Cy, victimRef, e1Cx, e1Cy);
        }
        this.playSoundAt('hit', e2Cx, e2Cy);
        e2.container.destroy();
      } else if (e2.score >= e1.score + requiredGap && dist < e2.radius) {
        const scoreGained = Math.floor(e1.score / 2);
        const victimRef = {
          mountSprite: e1.mountSprite,
          sprite: e1.sprite,
          baseScale: e1.baseScale,
          sizeScale: e1.sizeScale || 1
        };
        e1.isDead = true;
        this.entityLayer.removeChild(e1.container);
        e2.addScore(scoreGained);

        e2.health = 100;

        if (this.isInViewport(e1Cx, e1Cy)) {
          this.createEnemyKillEffect(e1Cx, e1Cy, victimRef, e2Cx, e2Cy);
        }
        this.playSoundAt('hit', e1Cx, e1Cy);
        e1.container.destroy();
      } else if (Math.abs(e1.score - e2.score) < requiredGap) {
        // Bouncing
        const overlap = e1.radius + e2.radius - dist;
        if (overlap > 0) {
          const angle = Math.atan2(dy, dx);
          e1.x += Math.cos(angle) * overlap * 0.5;
          e1.y += Math.sin(angle) * overlap * 0.5;
          e2.x -= Math.cos(angle) * overlap * 0.5;
          e2.y -= Math.sin(angle) * overlap * 0.5;
        }
      }
    }
  }
}

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (this.enemies[i].isDead) this.enemies.splice(i, 1);
    }

if (this.enemies.length < 10) {
  this.spawnEnemy();
}
  } // <-- End of checkCollisions()


  onResize(w, h) {
    const scale = Math.min(w / 800, h / 600, 1.2);

    // Thu nhỏ camera để bao quát xung quanh (tối thiểu 0.55)
    // Cân bằng giữa việc nhìn rõ đồ ăn và bao quát được xung quanh
    this.baseCameraScale = Math.min(w, h) / 700;
    this.baseCameraScale = Math.max(0.55, Math.min(this.baseCameraScale, 1.2));

  if (this.settingsBtn) {
    const uiScale = Math.max(0.6, scale);
    this.settingsBtn.scale.set(uiScale);
    this.settingsBtn.x = w - 40 * uiScale;
    this.settingsBtn.y = 40 * uiScale;
  }
  
  if (this.boostBtn) {
    const uiScale = Math.max(0.6, scale);
    this.boostBtn.scale.set(uiScale);
    this.boostBtn.x = w - 75 * uiScale;
    this.boostBtn.y = h - 75 * uiScale;
  }

  if (this.leaderboardContainer) {
    const uiScale = Math.max(0.6, scale);
    this.leaderboardContainer.scale.set(uiScale);
    this.leaderboardContainer.x = 10; 
    this.leaderboardContainer.y = 10;
  }
}

getSafePosition() {
  let bestX = this.worldWidth / 2;
  let bestY = this.worldHeight / 2;
  let maxMinDist = -1;

  for (let i = 0; i < 30; i++) {
    const rx = 200 + Math.random() * (this.worldWidth - 400);
    const ry = 200 + Math.random() * (this.worldHeight - 400);

    let minDist = Infinity;
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      const dx = enemy.x - rx;
      const dy = enemy.y - ry;
      const dist = Math.sqrt(dx * dx + dy * dy) - enemy.radius;
      if (dist < minDist) {
        minDist = dist;
      }
    }

    if (minDist > maxMinDist) {
      maxMinDist = minDist;
      bestX = rx;
      bestY = ry;
    }
  }
  return { x: bestX, y: bestY };
}

playSoundAt(type, x, y, maxDist = 1500) {
  let pCx, pCy;
  if (this.player && this.player.container && !this.player.isDead) {
    pCx = this.player.x;
    pCy = this.player.y;
  } else {
    pCx = -this.camera.x + this.game.app.screen.width / 2;
    pCy = -this.camera.y + this.game.app.screen.height / 2;
  }

  const dx = pCx - x;
  const dy = pCy - y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < maxDist) {
    let volume = 1 - (dist / maxDist);
    volume = volume * volume;

    if (dist > 50) volume *= 0.4;

    if (volume > 0.01) {
      this.game.audioManager.playSFX(type, volume);
    }
  }
}

onExit() {
  window.removeEventListener('keydown', this._onKeyDown);
  window.removeEventListener('keyup', this._onKeyUp);
  window.removeEventListener('pointerup', this._pointerUp);
  window.removeEventListener('pointercancel', this._pointerUp);
}
}

