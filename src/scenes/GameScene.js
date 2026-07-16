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
    
    // Nền cỏ xanh đậm để làm nổi bật item và nhân vật
    this.bg.rect(0, 0, this.worldWidth, this.worldHeight).fill('#2E7D32');
    
    // Lưới ô vuông mờ chuẩn game .io (màu tối hơn)
    this.bg.setStrokeStyle({ width: 3, color: '#1B5E20', alpha: 0.8 });
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
        // Cụm cỏ xanh đậm (sáng hơn nền một chút)
        this.bg.circle(x, y, 8 + Math.random()*6).fill('#4CAF50');
        this.bg.circle(x+10, y+4, 6 + Math.random()*4).fill('#4CAF50');
        this.bg.circle(x-10, y+4, 6 + Math.random()*4).fill('#4CAF50');
      } else if (type < 0.8) {
        // Bãi đất nện mờ (vàng kem, độ mờ thấp để hòa vào nền tối)
        this.bg.ellipse(x, y, 20 + Math.random()*20, 10 + Math.random()*10).fill({color: '#FFF3D6', alpha: 0.3});
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
        // Dùng toLocal để hỗ trợ mọi mức Zoom của Camera
        const localPos = this.camera.toLocal(e.global);
        this.player.setTarget(localPos.x, localPos.y);
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
    // Chỉ spawn trong vùng an toàn mà nhân vật có thể đi tới (tránh việc đồ ăn dính mép trên không ăn được)
    const safeLeft = 40;
    const safeRight = this.worldWidth - 40;
    const safeTop = 120;
    const safeBottom = this.worldHeight - 10;
    
    const x = safeLeft + Math.random() * (safeRight - safeLeft);
    const y = safeTop + Math.random() * (safeBottom - safeTop);
    const tex = this.game.assetLoader.items[Math.floor(Math.random() * this.game.assetLoader.items.length)];
    const food = new Food(x, y, tex);
    food.sprite.cullable = true; // Bật culling cho food
    this.foods.push(food);
    this.foodLayer.addChild(food.sprite);
  }

  createExplosion(x, y, count = 15, color = 0xFFD54F, sizeScale = 1) {
    for (let i = 0; i < count; i++) {
      const p = new Graphics();
      p.circle(0, 0, (4 + Math.random() * 6) * sizeScale).fill(color);
      p.x = x;
      p.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = (2 + Math.random() * 8) * sizeScale;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = 1.0;
      p.decay = 0.02 + Math.random() * 0.03;
      this.vfxLayer.addChild(p);
      this.particles.push(p);
    }
  }

  shakeCamera(duration = 10) {
    this.shakeTime = duration;
  }

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
    t.decay = 0.04;
    t.scale.set(0.2);
    t.dScale = 0.1;
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
      if (p.dScale) {
        const newScale = Math.min(1.2, p.scale.x + p.dScale);
        p.scale.set(newScale);
      }
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
    
    // Zoom out động: Càng to thì camera càng lùi ra xa (nhưng lùi ít hơn để đỡ mờ)
    let activeScale = (this.baseCameraScale || 1) / Math.pow(this.player.sizeScale || 1, 0.25);
    
    // Ngưỡng zoom tối đa để không làm mờ nhân vật (không nhỏ hơn 75% zoom mặc định)
    const visualMinScale = (this.baseCameraScale || 1) * 0.75;
    
    // Ngưỡng zoom tối thiểu để map luôn lấp đầy màn hình (tránh lộ nền đen ngoài map)
    const minScaleX = screenW / this.worldWidth;
    const minScaleY = screenH / this.worldHeight;
    const minActiveScale = Math.max(minScaleX, minScaleY);
    
    // Chốt lại activeScale không được nhỏ hơn cả 2 ngưỡng trên
    activeScale = Math.max(activeScale, visualMinScale, minActiveScale);
    this.camera.scale.set(activeScale);

    // Tính toán lại vị trí Camera có nhân với activeScale
    this.camera.x = screenW / 2 - this.player.x * activeScale;
    this.camera.y = screenH / 2 - this.player.y * activeScale;

    // Tính toán lại giới hạn Camera
    const minCamX = screenW - this.worldWidth * activeScale;
    const minCamY = screenH - this.worldHeight * activeScale;

    if (this.camera.x > 0) this.camera.x = 0;
    if (this.camera.y > 0) this.camera.y = 0;
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
    }

    this.checkCollisions();



    const activeFoods = this.foods.filter(f => !f.isDead).length;
    if (activeFoods < 150) {
      this.spawnFood();
    }
  }

  checkCollisions() {
    // Dịch tâm hitbox của Player lên giữa thân hình trực quan (thay vì ở dưới mỏ neo/chân)
    const pScale = this.player.sizeScale || 1;
    const pCx = this.player.x;
    const pCy = this.player.y - (40 * pScale);
    const pRadius = this.player.radius * 1.5; // Tăng diện tích ăn

    for (const food of this.foods) {
      if (food.isDead) continue;
      const dx = pCx - food.x;
      const dy = pCy - food.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < pRadius + food.radius) {
        food.isDead = true;
        this.foodLayer.removeChild(food.sprite);
        food.sprite.destroy();
        this.player.addScore(1);
        this.game.audioManager.playSFX('pop');
        this.createExplosion(food.x, food.y, 10, 0x4CAF50, 0.5); // Hạt nhỏ ở chỗ thức ăn
        
        // Hiển thị +1 ở trên đầu người ăn
        const pCxText = this.player.x;
        const pCyText = this.player.y - 120 * (this.player.sizeScale || 1);
        this.createFloatingText(pCxText, pCyText, '+1', '#00ff00');
      }
    }

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      
      const eScale = enemy.sizeScale || 1;
      const eCx = enemy.x;
      const eCy = enemy.y - (40 * eScale);
      const eRadius = enemy.radius * 1.5;

      for (const food of this.foods) {
        if (food.isDead) continue;
        const dx = eCx - food.x;
        const dy = eCy - food.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < eRadius + food.radius) {
          food.isDead = true;
          this.foodLayer.removeChild(food.sprite);
          food.sprite.destroy();
          enemy.addScore(1);
          this.createExplosion(food.x, food.y, 8, 0x4CAF50, 0.4);
        }
      }
    }

    this.foods = this.foods.filter(f => !f.isDead);

    // Check PVP Collisions (giữ hitbox PVP bình thường nhưng dời lên tâm thân)
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      
      const eScale = enemy.sizeScale || 1;
      const eCx = enemy.x;
      const eCy = enemy.y - (40 * eScale);
      
      const dx = pCx - eCx;
      const dy = pCy - eCy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      // Hitbox chạm nhau
      if (dist < this.player.radius + enemy.radius) {
        if (this.player.radius > enemy.radius * 1.1 && dist < this.player.radius) {
          enemy.isDead = true;
          enemy.container.destroy();
          this.player.addScore(enemy.score / 2);
          this.game.audioManager.playSFX('eat');
          this.shakeCamera(15);
          this.createExplosion(eCx, eCy, 40, 0xff3333, 2); // Nổ ở tâm nhân vật bị ăn
          this.createFloatingText(eCx, eCy, 'YUMMY!', '#ff0000'); // Chữ YUMMY ở chỗ bị ăn
          
          // Điểm cộng bay lên ở đầu người chơi
          const pHeadX = this.player.x;
          const pHeadY = this.player.y - 120 * (this.player.sizeScale || 1);
          setTimeout(() => this.createFloatingText(pHeadX, pHeadY, '+' + Math.floor(enemy.score / 2), '#ffaa00'), 150);
        } else if (enemy.radius > this.player.radius * 1.1 && dist < enemy.radius) {
          this.player.isDead = true;
          this.game.audioManager.playSFX('die');
          this.shakeCamera(20);
          this.createExplosion(pCx, pCy, 50, 0xff0000, 2.5); // Nổ ở tâm player
          
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
        
        const e1Scale = e1.sizeScale || 1;
        const e2Scale = e2.sizeScale || 1;
        
        const dx = e1.x - e2.x;
        const dy = (e1.y - 40 * e1Scale) - (e2.y - 40 * e2Scale);
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < e1.radius + e2.radius) {
          if (e1.radius > e2.radius * 1.1 && dist < e1.radius) {
            e2.isDead = true;
            e2.container.destroy();
            e1.addScore(e2.score / 2);
            const e2Cx = e2.x;
            const e2Cy = e2.y - 40 * (e2.sizeScale || 1);
            this.createExplosion(e2Cx, e2Cy, 30, 0xffaa00, 1.5);
          } else if (e2.radius > e1.radius * 1.1 && dist < e2.radius) {
            e1.isDead = true;
            e1.container.destroy();
            e2.addScore(e1.score / 2);
            const e1Cx = e1.x;
            const e1Cy = e1.y - 40 * (e1.sizeScale || 1);
            this.createExplosion(e1Cx, e1Cy, 30, 0xffaa00, 1.5);
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
    
    // Thu nhỏ camera để bao quát xung quanh (tối thiểu 0.45)
    this.baseCameraScale = Math.min(w, h) / 900;
    this.baseCameraScale = Math.max(0.45, Math.min(this.baseCameraScale, 1.2));

    if (this.settingsBtn) {
      const uiScale = Math.max(0.6, scale);
      this.settingsBtn.scale.set(uiScale);
      this.settingsBtn.x = w - 40 * uiScale;
      this.settingsBtn.y = 40 * uiScale;
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
