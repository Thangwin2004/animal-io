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
    this.radius = 40;
    this.baseSpeed = 2.5 + Math.random() * 2;
    this.speed = this.baseSpeed;
    
    this.changeTargetTimer = 0;
  }

  addScore(points) {
    this.score += points;
    const newScale = 1 + Math.log10(this.score / 20 + 1) * 2.5; // Giảm một chút để không bị khổng lồ quá nhanh
    this.bodyContainer.scale.set(Math.sign(this.bodyContainer.scale.x) * newScale, newScale);
    this.radius = 40 * newScale;
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
    
    // Bouncing effect when moving
    this.bodyContainer.y = Math.abs(Math.sin(Date.now() * 0.015)) * -10 * (dist > 0.5 ? 1 : 0);

    // Ảnh gốc thú nhún quay sang trái.
    // Đi sang trái (dx < -1): cần quay trái -> scale.x dương
    if (dx < -1 && this.bodyContainer.scale.x < 0) {
      this.bodyContainer.scale.x = Math.abs(this.bodyContainer.scale.x);
    } 
    // Đi sang phải (dx > 1): cần quay phải -> scale.x âm
    else if (dx > 1 && this.bodyContainer.scale.x > 0) {
      this.bodyContainer.scale.x = -Math.abs(this.bodyContainer.scale.x);
    }
  }
}
