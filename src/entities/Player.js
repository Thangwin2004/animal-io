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
    
    // Mask tròn cho avatar để cắt bỏ hình nền vuông xấu xí
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
      fontFamily: 'Arial', fontSize: 20, fill: '#00ff00',
      stroke: { color: '#000000', width: 3 }
    });
    this.nameText = new Text({ text: 'YOU', style });
    this.nameText.anchor.set(0.5);
    this.nameText.y = -80;
    this.container.addChild(this.nameText);

    this.score = 0;
    this.radius = 40;
    this.baseSpeed = 5;
    this.speed = this.baseSpeed;
  }

  addScore(points) {
    this.score += points;
    const newScale = 1 + Math.log10(this.score / 20 + 1) * 2.5; // Giảm một chút để không bị khổng lồ quá nhanh
    this.bodyContainer.scale.set(Math.sign(this.bodyContainer.scale.x) * newScale, newScale);
    this.radius = 40 * newScale;
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

    // Giới hạn nhân vật không được đi ra khỏi bản đồ
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
