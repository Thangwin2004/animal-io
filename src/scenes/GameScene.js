import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Food } from '../entities/Food.js';
import { checkCircleCollision } from '../utils/math.js';
import { IconBtn } from '../ui/Button.js';

export class GameScene {
  constructor(game) {
    this.game = game;
    this.container = new Container();
    
    this.worldWidth = 3000;
    this.worldHeight = 3000;

    this.camera = new Container();
    this.container.addChild(this.camera);

    this.bg = new Graphics();
    
    // Nền cỏ xanh (kiểu đồng cỏ thảo nguyên Hyper Casual)
    this.bg.rect(0, 0, this.worldWidth, this.worldHeight).fill('#A5D6A7');
    
    // Lưới ô vuông mờ chuẩn game .io
    this.bg.setStrokeStyle({ width: 3, color: '#81C784', alpha: 0.6 });
    for (let i = 0; i <= this.worldWidth; i += 150) {
      this.bg.moveTo(i, 0).lineTo(i, this.worldHeight);
      this.bg.moveTo(0, i).lineTo(this.worldWidth, i);
    }
    this.bg.stroke();

    // Rải rác các chi tiết trang trí (Cụm cỏ, bãi đất, khóm hoa)
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * this.worldWidth;
      const y = Math.random() * this.worldHeight;
      const type = Math.random();
      
      if (type < 0.5) {
        // Cụm cỏ xanh đậm
        this.bg.circle(x, y, 8 + Math.random()*6).fill('#81C784');
        this.bg.circle(x+10, y+4, 6 + Math.random()*4).fill('#81C784');
        this.bg.circle(x-10, y+4, 6 + Math.random()*4).fill('#81C784');
      } else if (type < 0.8) {
        // Bãi đất nện mờ (vàng kem)
        this.bg.ellipse(x, y, 20 + Math.random()*20, 10 + Math.random()*10).fill({color: '#FFF3D6', alpha: 0.6});
      } else {
        // Khóm hoa cúc nhỏ xíu
        for(let j=0; j<5; j++) { // 5 cánh trắng
           this.bg.circle(x + Math.cos(j*Math.PI*2/5)*6, y + Math.sin(j*Math.PI*2/5)*6, 4).fill('#FFFFFF');
        }
        this.bg.circle(x, y, 5).fill('#FFEB3B'); // Nhụy vàng
      }
    }
    
    // Tối ưu hóa: Biến toàn bộ nền Graphics khổng lồ thành 1 texture duy nhất để giảm draw calls
    this.bg.cacheAsTexture(true);

    this.camera = new Container();
    this.container.addChild(this.camera);
    this.camera.addChild(this.bg);

    this.entityLayer = new Container();
    this.foodLayer = new Container();
    this.camera.addChild(this.foodLayer);
    this.camera.addChild(this.entityLayer);
    
    this.vfxLayer = new Container();
    this.container.addChild(this.vfxLayer);

    this.uiLayer = new Container();
    this.container.addChild(this.uiLayer);

    const style = new TextStyle({
      fontFamily: "'Fredoka', 'Baloo 2', 'Be Vietnam Pro', sans-serif", fontSize: 28, fill: '#FFB74D', fontWeight: 'bold', stroke: { color: '#5D4037', width: 4 }
    });
    this.scoreText = new Text({ text: 'Điểm: 0', style });
    this.scoreText.x = 20;
    this.scoreText.y = 20;
    this.uiLayer.addChild(this.scoreText);

    this.settingsBtn = new IconBtn(this.game.assetLoader.ui.settingBtn, () => {
      this.game.audioManager.playSFX('click');
      this.game.app.ticker.stop();
      this.game.overlayManager.showSettings(() => {
        this.game.app.ticker.start();
      }, true);
    }, 25);
    this.uiLayer.addChild(this.settingsBtn);

    this.player = null;
    this.enemies = [];
    this.foods = [];
    this.particles = [];

    this.container.eventMode = 'static';
    this.container.hitArea = { contains: () => true }; 
    this.container.on('pointermove', (e) => {
      if (this.player && !this.player.isDead) {
        const worldX = e.global.x - this.camera.x;
        const worldY = e.global.y - this.camera.y;
        this.player.setTarget(worldX, worldY);
      }
    });

    this.enemyNames = ["Tom", "Jerry", "Mickey", "Donald", "Goofy", "Pluto", "Simba", "Nala", "Timon", "Pumbaa"];
  }

  onEnter(data) {
    this.game.audioManager.playBGM('/assest/music/music.mp3');
    this.settingsBtn.setTexture(this.game.assetLoader.ui.settingBtn, 25);

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

    const randomAvatar = this.game.assetLoader.avatars[Math.floor(Math.random() * this.game.assetLoader.avatars.length)];
    const mountTex = this.game.assetLoader.ui.tuanNhun;
    
    const safePos = this.getSafePosition();
    this.player = new Player(safePos.x, safePos.y, randomAvatar, mountTex);
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
    const name = this.enemyNames[Math.floor(Math.random() * this.enemyNames.length)];
    const mountTex = this.game.assetLoader.ui.tuanNhun;
    
    let ex = Math.random() * this.worldWidth;
    let ey = Math.random() * this.worldHeight;
    
    if (this.player && !this.player.isDead) {
      for (let i = 0; i < 10; i++) {
        ex = Math.random() * this.worldWidth;
        ey = Math.random() * this.worldHeight;
        const dx = ex - this.player.x;
        const dy = ey - this.player.y;
        if (Math.sqrt(dx*dx + dy*dy) > 500) break;
      }
    }
    
    const enemy = new Enemy(ex, ey, tex, name, mountTex);
    enemy.container.cullable = true; // Bật culling cho enemy
    enemy.addScore(Math.floor(Math.random() * 50));
    this.enemies.push(enemy);
    this.entityLayer.addChild(enemy.container);
  }

  spawnFood() {
    const x = Math.random() * this.worldWidth;
    const y = Math.random() * this.worldHeight;
    const tex = this.game.assetLoader.items[Math.floor(Math.random() * this.game.assetLoader.items.length)];
    const food = new Food(x, y, tex);
    food.sprite.cullable = true; // Bật culling cho food
    this.foods.push(food);
    this.foodLayer.addChild(food.sprite);
  }

  createExplosion(x, y, radius, color) {
    const count = 10 + Math.random() * 10;
    for (let i = 0; i < count; i++) {
      const p = new Graphics();
      p.circle(0, 0, 3 + Math.random() * 5).fill(color || 0xffffff);
      p.x = x;
      p.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = 1.0;
      p.decay = 0.02 + Math.random() * 0.03;
      this.vfxLayer.addChild(p);
      this.particles.push(p);
    }
  }

  createFloatingText(x, y, text, color = '#FFD54F') {
    const style = new TextStyle({
      fontFamily: "'Fredoka', 'Baloo 2', 'Be Vietnam Pro', sans-serif", fontSize: 28, fill: color, fontWeight: 'bold', stroke: { color: '#5D4037', width: 4 }
    });
    const t = new Text({ text, style });
    t.anchor.set(0.5);
    t.x = x;
    t.y = y - 30;
    t.vy = -2;
    t.life = 1.0;
    t.decay = 0.02;
    this.vfxLayer.addChild(t);
    this.particles.push(t);
  }

  update() {
    if (this.player.isDead) return;

    this.player.update(this.worldWidth, this.worldHeight);
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx || 0;
      p.y += p.vy || 0;
      p.life -= p.decay;
      p.alpha = Math.max(0, p.life);
      
      if (p.life <= 0) {
        this.vfxLayer.removeChild(p);
        p.destroy();
        this.particles.splice(i, 1);
      }
    }
    
    const screenW = this.game.app.screen.width;
    const screenH = this.game.app.screen.height;
    this.camera.x = screenW / 2 - this.player.x;
    this.camera.y = screenH / 2 - this.player.y;

    if (this.camera.x > 0) this.camera.x = 0;
    if (this.camera.y > 0) this.camera.y = 0;
    if (this.camera.x < screenW - this.worldWidth) this.camera.x = screenW - this.worldWidth;
    if (this.camera.y < screenH - this.worldHeight) this.camera.y = screenH - this.worldHeight;

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      enemy.update(this.worldWidth, this.worldHeight);
    }

    this.checkCollisions();

    // Tối ưu hóa: Chỉ cập nhật Text khi điểm số thực sự thay đổi (Text diffing)
    const nextScoreText = `Điểm: ${this.player.score}`;
    if (this.scoreText.text !== nextScoreText) {
      this.scoreText.text = nextScoreText;
    }

    const activeFoods = this.foods.filter(f => !f.isDead).length;
    if (activeFoods < 150) {
      this.spawnFood();
    }
  }

  checkCollisions() {
    for (const food of this.foods) {
      if (food.isDead) continue;
      const dx = this.player.x - food.x;
      const dy = this.player.y - food.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < this.player.radius + food.radius) {
        food.isDead = true;
        this.foodLayer.removeChild(food.sprite);
        food.sprite.destroy();
        this.player.addScore(1);
        this.game.audioManager.playSFX('pop');
        this.createFloatingText(food.x, food.y, '+1', '#00ff00');
      }
    }

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      for (const food of this.foods) {
        if (food.isDead) continue;
        const dx = enemy.x - food.x;
        const dy = enemy.y - food.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < enemy.radius + food.radius) {
          food.isDead = true;
          this.foodLayer.removeChild(food.sprite);
          food.sprite.destroy();
          enemy.addScore(1);
        }
      }
    }

    this.foods = this.foods.filter(f => !f.isDead);

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < this.player.radius + enemy.radius) {
        if (this.player.radius > enemy.radius * 1.1 && dist < this.player.radius) {
          enemy.isDead = true;
          enemy.container.destroy();
          this.player.addScore(enemy.score / 2);
          this.game.audioManager.playSFX('eat');
          this.createExplosion(enemy.x, enemy.y, enemy.radius, 0xff0000);
          this.createFloatingText(enemy.x, enemy.y, '+' + Math.floor(enemy.score / 2), '#ffaa00');
        } else if (enemy.radius > this.player.radius * 1.1 && dist < enemy.radius) {
          this.player.isDead = true;
          this.game.audioManager.playSFX('die');
          
          if (this.hasRevived) {
            this.game.switchScene('GameOver', { score: this.player.score });
            return;
          }

          this.game.app.ticker.stop();
          
          this.game.overlayManager.showReviveOffer(
            () => {
              // onRevive: show ad
              this.game.adManager.showRewardAd(
                () => { // Success
                  const safePos = this.getSafePosition();
                  this.player.x = safePos.x;
                  this.player.y = safePos.y;
                  if (this.player.setTarget) {
                    this.player.setTarget(safePos.x, safePos.y);
                  }
                  
                  this.player.isDead = false;
                  this.hasRevived = true;
                  this.game.app.ticker.start();
                },
                () => {
                  this.game.app.ticker.start();
                  this.game.switchScene('GameOver', { score: this.player.score });
                }
              );
            },
            () => {
              this.game.app.ticker.start();
              this.game.switchScene('GameOver', { score: this.player.score });
            }
          );
          return; 
        } else if (this.player.radius <= enemy.radius * 1.1 && enemy.radius <= this.player.radius * 1.1) {
          // Bouncing if similar size
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
        const dx = e1.x - e2.x;
        const dy = e1.y - e2.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < e1.radius + e2.radius) {
          if (e1.radius > e2.radius * 1.1 && dist < e1.radius) {
            e2.isDead = true;
            e2.container.destroy();
            e1.addScore(e2.score / 2);
            this.createExplosion(e2.x, e2.y, e2.radius, 0xffaa00);
          } else if (e2.radius > e1.radius * 1.1 && dist < e2.radius) {
            e1.isDead = true;
            e1.container.destroy();
            e2.addScore(e1.score / 2);
            this.createExplosion(e1.x, e1.y, e1.radius, 0xffaa00);
          } else if (e1.radius <= e2.radius * 1.1 && e2.radius <= e1.radius * 1.1) {
            // Bouncing if similar size
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

    this.enemies = this.enemies.filter(e => !e.isDead);
    
    if (this.enemies.length < 10) {
      this.spawnEnemy();
    }
  }

  onResize(w, h) {
    const scale = Math.min(w / 800, h / 600, 1.2);

    if (this.settingsBtn) {
      const uiScale = Math.max(0.6, scale);
      this.settingsBtn.scale.set(uiScale);
      this.settingsBtn.x = w - 40 * uiScale;
      this.settingsBtn.y = 40 * uiScale;
    }
    
    if (this.scoreText) {
      this.scoreText.scale.set(scale);
      this.scoreText.x = 20 * scale;
      this.scoreText.y = 20 * scale;
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
        const dist = Math.sqrt(dx*dx + dy*dy) - enemy.radius;
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
}
