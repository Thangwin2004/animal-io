import { Sprite, Container, Text, TextStyle, Graphics } from 'pixi.js';

export class Enemy {
  constructor(x, y, texture, name, mountTexture) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.name = name;
    this.isDead = false;

    this.container = new Container();
    this.container.x = x;
    this.container.y = y;

    this.bodyContainer = new Container();

    // Mount (Thú nhún)
    if (mountTexture) {
      this.mountSprite = new Sprite(mountTexture);
      this.mountSprite.anchor.set(0.5, 0.8);
      const mountScale = mountTexture.width > 0 ? 120 / mountTexture.width : 0.12;
      this.mountSprite.scale.set(mountScale);
      this.bodyContainer.addChild(this.mountSprite);
    }

    this.riderContainer = new Container();
    this.riderContainer.x = 25;
    this.riderContainer.y = -70;

    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.baseScale = texture.width > 0 ? 70 / texture.width : 0.07;
    this.sprite.scale.set(this.baseScale);
    this.sprite.y = -10;
    this.riderContainer.addChild(this.sprite);

    // mask removed for performance optimization
    this.bodyContainer.addChild(this.riderContainer);

    this.container.addChild(this.bodyContainer);

    const style = new TextStyle({
      fontFamily: 'Be Vietnam Pro', fontSize: 28, fill: '#ffeb3b', fontWeight: 'bold',
      stroke: { color: '#000000', width: 5 }
    });
    this.nameText = new Text({ text: '1', style });
    this.nameText.anchor.set(0.5);
    this.nameText.y = -140;
    this.container.addChild(this.nameText);

    this.score = 1;
    this.radius = 40;
    this.baseSpeed = 2.5 + Math.random() * 2;
    this.speed = this.baseSpeed;

    this.changeTargetTimer = 0;
    this.isBoosting = false;
    this.scoreFloat = 0;
    this.boostTimer = 0;
    this.boostCooldown = 0;
  }

  addScore(points) {
    this.score += points;
    this.score = Math.floor(this.score); // Đảm bảo luôn là số nguyên
    // Tính từ 100 điểm trở lên thì độ to tăng tuyến tính để dễ dàng nhận ra ai to hơn
    let newScale = 1;
    if (this.score <= 100) {
      newScale = 1 + (this.score / 100) * 1.5;
    } else {
      newScale = 2.5 + (this.score - 100) * 0.0015; // Giảm mạnh tốc độ phình to
    }
    this.sizeScale = newScale;
    this.radius = 40 * newScale;
    this.nameText.y = -140 * newScale;
    this.nameText.text = this.score.toString();

    const sizeRatio = newScale;
    this.speed = Math.max(1.0, this.baseSpeed / Math.sqrt(sizeRatio));
  }

  update(worldWidth, worldHeight) {
    const currentScale = this.sizeScale || 1;
    const visualLeft = 60 + 20 * Math.sqrt(currentScale);
    const visualRight = 60 + 20 * Math.sqrt(currentScale);
    const visualTop = 100 + 40 * Math.sqrt(currentScale);
    const visualBottom = 60;

    let dx = this.targetX - this.x;
    let dy = this.targetY - this.y;
    let dist = Math.sqrt(dx * dx + dy * dy);

    this.changeTargetTimer--;
    if (this.changeTargetTimer <= 0 || dist < 10) {
      this.targetX = visualLeft + Math.random() * (worldWidth - visualLeft - visualRight);
      this.targetY = visualTop + Math.random() * (worldHeight - visualTop - visualBottom);
      this.changeTargetTimer = 120 + Math.random() * 180; // Di chuyển dài hơn
      dx = this.targetX - this.x;
      dy = this.targetY - this.y;
      dist = Math.sqrt(dx * dx + dy * dy);
    }

    // AI Boost Logic
    if (this.score > 20) {
      if (this.boostCooldown > 0) {
        this.boostCooldown--;
      } else if (!this.isBoosting && Math.random() < 0.01) {
        this.isBoosting = true;
        this.boostTimer = 30 + Math.random() * 60; // Boost for 0.5 - 1.5 seconds
      }

      if (this.isBoosting) {
        this.boostTimer--;
        if (this.boostTimer <= 0 || this.score <= 20) {
          this.isBoosting = false;
          this.boostCooldown = 120 + Math.random() * 180; // Cooldown 2-3 seconds
        }
      }
    } else {
      this.isBoosting = false;
    }

    let currentSpeed = this.speed;
    if (this.isBoosting && this.score > 20) {
      currentSpeed *= 2.8;
      this.scoreFloat -= 0.15;
      if (this.scoreFloat <= -1) {
        this.addScore(-1);
        this.scoreFloat += 1;
      }
    }

    if (dist > currentSpeed) {
      this.x += (dx / dist) * currentSpeed;
      this.y += (dy / dist) * currentSpeed;
    }

    // Giới hạn nhân vật không được đi ra khỏi bản đồ
    // Đã tính visual bounds ở đầu hàm

    if (this.x < visualLeft) this.x = visualLeft;
    if (this.x > worldWidth - visualRight) this.x = worldWidth - visualRight;
    if (this.y < visualTop) this.y = visualTop;
    if (this.y > worldHeight - visualBottom) this.y = worldHeight - visualBottom;

    this.container.x = this.x;
    this.container.y = this.y;

    if (this.sizeScale === undefined) this.sizeScale = Math.abs(this.bodyContainer.scale.y) || 1;
    if (this.facingRight === undefined) this.facingRight = this.bodyContainer.scale.x < 0;

    const isMoving = dist > 0.5;
    const bouncePhase = Date.now() * 0.008;

    if (isMoving) {
      this.bodyContainer.y = -Math.abs(Math.sin(bouncePhase)) * 8 * this.sizeScale;
      this.bodyContainer.scale.y = (1 - Math.abs(Math.sin(bouncePhase)) * 0.05) * this.sizeScale;
      this.riderContainer.rotation = Math.sin(bouncePhase * 0.5) * 0.1;
      this.riderContainer.y = -70 - Math.abs(Math.cos(bouncePhase)) * 3;
    } else {
      this.bodyContainer.y = 0;
      this.bodyContainer.scale.y = this.sizeScale;
      this.riderContainer.rotation = 0;
      this.riderContainer.y = -70;
    }

    // Squash & Stretch
    let stretchX = 1;
    let stretchY = 1;

    if (isMoving) {
      const heightFactor = Math.abs(Math.sin(bouncePhase));
      stretchX = 1.08 - (0.15 * heightFactor); // Chạm đất béo ra, trên không gầy lại
      stretchY = 0.92 + (0.15 * heightFactor); // Chạm đất lùn đi, trên không cao lên
    }

    // Nghiêng người khi di chuyển
    if (isMoving) {
      this.bodyContainer.rotation = (dx / (Math.abs(dx) || 1)) * 0.1;
    } else {
      this.bodyContainer.rotation = 0;
    }

    // Quay mặt
    if (dx < -1) {
      this.facingRight = false;
    } else if (dx > 1) {
      this.facingRight = true;
    }

    // Gộp tổng Scale (Kích thước gốc * Hướng quay * Hiệu ứng nhún)
    const dirX = this.facingRight ? -1 : 1;
    this.bodyContainer.scale.set(
      dirX * this.sizeScale * stretchX,
      this.sizeScale * stretchY
    );
  }
}
