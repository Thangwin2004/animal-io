import { Sprite, Container, Text, TextStyle, Graphics } from 'pixi.js';

export class Player {
  constructor(x, y, texture, mountTexture) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.name = texture.characterName || 'Player';
    
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
    this.riderContainer.y = -70; // Thấp xuống một chút để tạo cảm giác lún vào lưng

    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.baseScale = texture.width > 0 ? 70 / texture.width : 0.07;
    this.sprite.scale.set(this.baseScale);
    this.sprite.y = -10; // Nâng avatar lên một chút so với tâm riderContainer
    this.riderContainer.addChild(this.sprite);

    // Mask cong ở phía dưới để cắt bớt chân/phần dưới phẳng của ảnh, tạo cảm giác lún (ngồi)
    const riderMask = new Graphics();
    riderMask.roundRect(-40, -60, 80, 80, 20).fill(0xffffff); // Viền dưới bo tròn tại y = 20
    this.riderContainer.addChild(riderMask);
    this.riderContainer.mask = riderMask;

    this.bodyContainer.addChild(this.riderContainer);
    
    this.container.addChild(this.bodyContainer);

    const style = new TextStyle({
      fontFamily: 'Arial', fontSize: 32, fill: '#00FF00', fontWeight: 'bold',
      stroke: { color: '#000000', width: 5 }
    });
    this.nameText = new Text({ text: '0', style });
    this.nameText.anchor.set(0.5);
    this.nameText.y = -140;
    this.container.addChild(this.nameText);

    this.score = 0;
    this.radius = 40;
    this.baseSpeed = 5;
    this.speed = this.baseSpeed;
    
    this.scoreFloat = 0;
  }

  addScore(points) {
    this.score += points;
    // Tính từ 100 điểm trở lên thì độ to tăng tuyến tính để dễ dàng nhận ra ai to hơn
    let newScale = 1;
    if (this.score <= 100) {
      newScale = 1 + (this.score / 100) * 1.5;
    } else {
      newScale = 2.5 + (this.score - 100) * 0.0015; // Giảm mạnh tốc độ phình to để không bị che kín màn quá sớm
    }
    this.sizeScale = newScale;
    this.radius = 40 * newScale;
    this.nameText.y = -140 * newScale;
    this.nameText.text = this.score.toString();

    // Cơ chế: Càng to đi càng chậm
    const sizeRatio = newScale;
    this.speed = Math.max(1.5, this.baseSpeed / Math.sqrt(sizeRatio));
  }

  setTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  update(worldWidth = 4000, worldHeight = 4000, isBoosting = false) {
    let currentSpeed = this.speed;
    if (isBoosting && this.score > 20) {
        currentSpeed *= 1.8;
        this.scoreFloat -= 0.15; // Mất 0.15 điểm mỗi frame (khoảng 9 điểm/s)
        if (this.scoreFloat <= -1) {
            this.addScore(-1);
            this.scoreFloat += 1;
        }
    }
    
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > currentSpeed) {
      this.x += (dx / dist) * currentSpeed;
      this.y += (dy / dist) * currentSpeed;
    } else {
      this.x = this.targetX;
      this.y = this.targetY;
    }

    // Giới hạn nhân vật không được đi ra khỏi bản đồ
    const currentScale = this.sizeScale || 1;
    // Bỏ qua viền trong suốt của texture, dùng offset chuẩn để không bị lọt vào hàng cây
    const visualLeft = 60 + 20 * Math.sqrt(currentScale);
    const visualRight = 60 + 20 * Math.sqrt(currentScale);
    const visualTop = 100 + 40 * Math.sqrt(currentScale); // Dùng sqrt để không tăng quá nhanh khi to
    const visualBottom = 60;

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
      // Hiệu ứng người cưỡi lắc lư và nhún nảy theo
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
