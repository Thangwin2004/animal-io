import { Sprite, Container, Text, TextStyle, Graphics } from 'pixi.js';

export class Player {
  constructor(x, y, texture, mountTexture) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    
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
    
    // Mask tròn cho avatar đã được bỏ vì ảnh đã tách nền trong suốt    
    // Cưỡi lên thú nhún (hình ảnh gốc quay sang trái, nên yên nằm bên phải trục X -> x = 25)
    this.sprite.x = 25;
    this.sprite.y = -80;
    this.bodyContainer.addChild(this.sprite);
    
    this.container.addChild(this.bodyContainer);

    const style = new TextStyle({
      fontFamily: 'Arial', fontSize: 20, fill: '#00ff00',
      stroke: { color: '#000000', width: 3 }
    });
    this.nameText = new Text({ text: 'YOU', style });
    this.nameText.anchor.set(0.5);
    this.nameText.y = -80;
    this.container.addChild(this.nameText);

    this.score = 0;
    this.radius = 20;
    this.baseSpeed = 5;
    this.speed = this.baseSpeed;
  }

  addScore(points) {
    this.score += points;
    const newScale = 1 + Math.log10(this.score / 20 + 1) * 2.5; // Giảm một chút để không bị khổng lồ quá nhanh
    this.sizeScale = newScale;
    this.radius = 20 * newScale;
    this.nameText.y = -80 * newScale;

    // Cơ chế: Càng to đi càng chậm
    const sizeRatio = newScale;
    this.speed = Math.max(1.5, this.baseSpeed / Math.sqrt(sizeRatio));
  }

  setTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  update(worldWidth = 4000, worldHeight = 4000) {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.speed) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }

    // Giới hạn nhân vật không được đi ra khỏi bản đồ (bo sát theo hình ảnh)
    // Kích thước thú nhún cơ bản là 120x120. Với anchor (0.5, 0.8)
    const currentScale = this.sizeScale || 1;
    const visualHalfWidth = 60 * currentScale;
    const visualTop = 96 * currentScale;
    const visualBottom = 24 * currentScale;

    if (this.x < visualHalfWidth) this.x = visualHalfWidth;
    if (this.x > worldWidth - visualHalfWidth) this.x = worldWidth - visualHalfWidth;
    if (this.y < visualTop) this.y = visualTop;
    if (this.y > worldHeight - visualBottom) this.y = worldHeight - visualBottom;

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
