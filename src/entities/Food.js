import { Sprite } from 'pixi.js';

export class Food {
  constructor(x, y, texture) {
    this.x = x;
    this.y = y;
    this.radius = 35; // Tăng bán kính va chạm để ăn dễ hơn
    this.isDead = false;
    
    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);
    
    // Scale cho kích thước thức ăn to hơn (~80px) để không nhầm với hoa cỏ
    if (texture.width > 0 && texture.height > 0) {
      const scale = Math.min(80 / texture.width, 80 / texture.height);
      this.sprite.scale.set(scale);
    } else {
      this.sprite.scale.set(0.25);
    }
    
    this.sprite.x = x;
    this.sprite.y = y;
  }
}
