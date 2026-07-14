import { Sprite, Container, Text, TextStyle, Graphics } from 'pixi.js';

export class Enemy {
  constructor(x, y, texture, name, mountTexture) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
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

    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.baseScale = texture.width > 0 ? 70 / texture.width : 0.07;
    this.sprite.scale.set(this.baseScale);
    
    // Mask tròn
    if (texture.width > 0) {
      const mask = new Graphics();
      mask.circle(0, 0, texture.width * 0.35).fill(0xffffff); // Cắt sát hơn vào trung tâm (0.35 thay vì 0.5)
      this.sprite.addChild(mask);
      this.sprite.mask = mask;
    }
    
    // Cưỡi lên thú nhún (hình ảnh gốc quay sang trái, nên yên nằm bên phải trục X -> x = 25)
    this.sprite.x = 25;
    this.sprite.y = -80;
    this.bodyContainer.addChild(this.sprite);
    
    this.container.addChild(this.bodyContainer);

    const style = new TextStyle({
      fontFamily: 'Arial', fontSize: 16, fill: '#ffcccc',
      stroke: { color: '#000000', width: 2 }
    });
    this.nameText = new Text({ text: name, style });
    this.nameText.anchor.set(0.5);
    this.nameText.y = -80;
    this.container.addChild(this.nameText);

    this.score = 0;
    this.radius = 20;
    this.baseSpeed = 2.5 + Math.random() * 2;
    this.speed = this.baseSpeed;
    
    this.changeTargetTimer = 0;
  }

  addScore(points) {
    this.score += points;
    const newScale = 1 + Math.log10(this.score / 20 + 1) * 2.5; // Giảm một chút để không bị khổng lồ quá nhanh
    this.sizeScale = newScale;
    this.radius = 20 * newScale;
    this.nameText.y = -80 * newScale;

    const sizeRatio = newScale;
    this.speed = Math.max(1.0, this.baseSpeed / Math.sqrt(sizeRatio));
  }

  update(worldWidth, worldHeight) {
    this.changeTargetTimer--;
    if (this.changeTargetTimer <= 0) {
      this.targetX = Math.random() * worldWidth;
      this.targetY = Math.random() * worldHeight;
      this.changeTargetTimer = 60 + Math.random() * 120;
    }

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.speed) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }

    if (this.x < this.radius) this.x = this.radius;
    if (this.x > worldWidth - this.radius) this.x = worldWidth - this.radius;
    if (this.y < this.radius) this.y = this.radius;
    if (this.y > worldHeight - this.radius) this.y = worldHeight - this.radius;

    this.container.x = this.x;
    this.container.y = this.y;
    
    if (this.sizeScale === undefined) this.sizeScale = Math.abs(this.bodyContainer.scale.y) || 1;
    if (this.facingRight === undefined) this.facingRight = this.bodyContainer.scale.x < 0;

    const isMoving = dist > 0.5;
    const bouncePhase = Date.now() * 0.015;
    
    // Bouncing effect
    const bounceY = isMoving ? Math.abs(Math.sin(bouncePhase)) * -15 : 0;
    this.bodyContainer.y = bounceY * this.sizeScale;

    // Squash & Stretch
    let stretchX = 1;
    let stretchY = 1;
    
    if (isMoving) {
        const heightFactor = Math.abs(Math.sin(bouncePhase)); 
        stretchX = 1.15 - (0.25 * heightFactor); // Chạm đất béo ra, trên không gầy lại
        stretchY = 0.85 + (0.25 * heightFactor); // Chạm đất lùn đi, trên không cao lên
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
