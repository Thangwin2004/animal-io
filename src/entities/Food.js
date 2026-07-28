import { Sprite } from 'pixi.js';

export class Food {
  constructor(x, y, texture, isGolden = false) {
    this.x = x;
    this.y = y;
    this.isGolden = isGolden;
    this.scoreValue = isGolden ? 30 : 1;
    this.radius = isGolden ? 60 : 35; // Tăng bán kính cho đồ ăn vàng
    this.isDead = false;
    
    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);
    
    // Scale cho kích thước thức ăn to hơn (~100px) để dễ nhìn trên điện thoại
    if (texture.width > 0 && texture.height > 0) {
      let scale = Math.min(100 / texture.width, 100 / texture.height);
      if (isGolden) scale *= 2; // Đồ ăn vàng to gấp đôi
      this.sprite.scale.set(scale);
    } else {
      this.sprite.scale.set(isGolden ? 0.5 : 0.25);
    }

    if (isGolden) {
      this.sprite.tint = 0xFFD700; // Ám vàng
      // Thêm hiệu ứng nhấp nháy xoay tròn nhẹ cho đồ ăn vàng? Có thể làm ở update()
    }
    
    this.sprite.x = x;
    this.sprite.y = y;
  }
}
